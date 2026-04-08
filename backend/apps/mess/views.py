import re
from decimal import Decimal
from uuid import uuid4

from django.core.cache import cache
from django.http import HttpResponse
from django.db.models import Count, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsMessManager, IsMessWorker, IsStudent

from .filters import MessManagerBookingFilter, MessMenuItemFilter
from .models import Mess, MessBooking, MessMenuItem, MessStaffAssignment
from .serializers import (
    MessBookingCancelSerializer,
    MessBookingCreateSerializer,
    MessBookingDetailSerializer,
    MessBookingListSerializer,
    MessWorkerVerifySerializer,
    MessInventoryUpdateSerializer,
    MessMenuItemCreateUpdateSerializer,
    MessMenuItemSerializer,
    MessSerializer,
)
from .services import QRGenerationError, build_booking_qr_payload, generate_booking_qr_image

WORKER_SCAN_HISTORY_TTL_SECONDS = 2 * 60 * 60
WORKER_SCAN_HISTORY_LIMIT = 20
WORKER_SCAN_STATUS_SUCCESS = "success"
WORKER_SCAN_STATUS_FAILED = "failed"


def _natural_sort_key(value):
    parts = re.split(r"(\d+)", value or "")
    return [int(part) if part.isdigit() else part.lower() for part in parts]


def _get_student_from_request(request):
    student = getattr(request.user, "student_profile", None)
    if student is None:
        raise NotFound("Student profile not found.")
    return student


def _get_staff_from_request(request):
    staff = getattr(request.user, "staff_profile", None)
    if staff is None:
        raise NotFound("Staff profile not found.")
    return staff


def _get_manager_assignment(request):
    staff = _get_staff_from_request(request)
    assignments = (
        MessStaffAssignment.objects.select_related("mess")
        .filter(
            staff=staff,
            assignment_role=MessStaffAssignment.AssignmentRole.MANAGER,
            is_active=True,
            mess__is_active=True,
        )
        .order_by("-updated_at", "-id")
    )

    requested_mess_id = request.query_params.get("mess_id")
    if requested_mess_id is None and request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        requested_mess_id = request.data.get("mess_id")

    if requested_mess_id is not None:
        try:
            requested_mess_id = int(requested_mess_id)
        except (TypeError, ValueError) as exc:
            raise ValidationError({"mess_id": "mess_id must be a valid integer."}) from exc
        assignments = assignments.filter(mess_id=requested_mess_id)
    assignment_count = assignments.count()
    if assignment_count > 1 and requested_mess_id is None:
        raise ValidationError({"mess_id": "Multiple active manager assignments found. Provide mess_id."})
    assignment = assignments.first()
    if assignment is None:
        raise PermissionDenied("No active manager assignment found for this mess.")
    return assignment


def _get_manager_mess(request):
    return _get_manager_assignment(request).mess


def _get_worker_assignment(request):
    staff = _get_staff_from_request(request)
    assignments = (
        MessStaffAssignment.objects.select_related("mess")
        .filter(
            staff=staff,
            assignment_role=MessStaffAssignment.AssignmentRole.WORKER,
            is_active=True,
            mess__is_active=True,
        )
        .order_by("-updated_at", "-id")
    )
    requested_mess_id = request.query_params.get("mess_id")
    if requested_mess_id is None and request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        requested_mess_id = request.data.get("mess_id")
    if requested_mess_id is not None:
        try:
            requested_mess_id = int(requested_mess_id)
        except (TypeError, ValueError) as exc:
            raise ValidationError({"mess_id": "mess_id must be a valid integer."}) from exc
        assignments = assignments.filter(mess_id=requested_mess_id)
    assignment_count = assignments.count()
    if assignment_count > 1 and requested_mess_id is None:
        raise ValidationError({"mess_id": "Multiple active worker assignments found. Provide mess_id."})
    assignment = assignments.first()
    if assignment is None:
        raise PermissionDenied("No active worker assignment found.")
    return assignment


def _worker_scan_history_cache_key(staff_id):
    return f"mess:worker:scan-history:{staff_id}"


def _safe_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _extract_worker_scan_error_message(detail):
    if isinstance(detail, dict):
        first_key = next(iter(detail), None)
        if first_key is None:
            return "Verification failed."
        return _extract_worker_scan_error_message(detail[first_key])

    if isinstance(detail, (list, tuple)):
        if not detail:
            return "Verification failed."
        return _extract_worker_scan_error_message(detail[0])

    text = str(detail).strip()
    return text or "Verification failed."


def _normalize_worker_scan_history_entry(raw_entry):
    if isinstance(raw_entry, dict):
        scan_status = raw_entry.get("scan_status")
        if scan_status not in {WORKER_SCAN_STATUS_SUCCESS, WORKER_SCAN_STATUS_FAILED}:
            return None

        booking_id = _safe_int(raw_entry.get("booking_id"))
        if scan_status == WORKER_SCAN_STATUS_SUCCESS and booking_id is None:
            return None

        normalized_entry = {
            "entry_id": str(raw_entry.get("entry_id") or uuid4().hex),
            "scan_status": scan_status,
            "attempted_at": raw_entry.get("attempted_at"),
        }
        if booking_id is not None:
            normalized_entry["booking_id"] = booking_id

        attempted_booking_id = _safe_int(raw_entry.get("attempted_booking_id"))
        if attempted_booking_id is not None:
            normalized_entry["attempted_booking_id"] = attempted_booking_id

        if scan_status == WORKER_SCAN_STATUS_FAILED:
            failure_reason = raw_entry.get("failure_reason")
            if failure_reason:
                normalized_entry["failure_reason"] = str(failure_reason)

            identifier_type = raw_entry.get("identifier_type")
            if identifier_type in {"booking_id", "qr_code"}:
                normalized_entry["identifier_type"] = identifier_type

        return normalized_entry

    legacy_booking_id = _safe_int(raw_entry)
    if legacy_booking_id is None:
        return None

    return {
        "entry_id": f"legacy-success-{legacy_booking_id}",
        "scan_status": WORKER_SCAN_STATUS_SUCCESS,
        "booking_id": legacy_booking_id,
    }


def _get_worker_scan_history_entries(staff_id):
    key = _worker_scan_history_cache_key(staff_id)
    values = cache.get(key, [])
    if not isinstance(values, (list, tuple)):
        return []

    normalized_entries = []
    for raw_entry in values:
        normalized_entry = _normalize_worker_scan_history_entry(raw_entry)
        if normalized_entry is not None:
            normalized_entries.append(normalized_entry)

    return normalized_entries[:WORKER_SCAN_HISTORY_LIMIT]


def _set_worker_scan_history_entries(staff_id, entries):
    cache.set(
        _worker_scan_history_cache_key(staff_id),
        entries[:WORKER_SCAN_HISTORY_LIMIT],
        timeout=WORKER_SCAN_HISTORY_TTL_SECONDS,
    )


def _record_worker_scan_history(staff_id, *, scan_status, booking=None, failure_reason=None, payload=None):
    payload = payload or {}
    attempted_booking_id = _safe_int(payload.get("booking_id"))
    identifier_type = "booking_id" if attempted_booking_id is not None else ("qr_code" if payload.get("qr_code") else None)

    history_entry = {
        "entry_id": uuid4().hex,
        "scan_status": scan_status,
        "attempted_at": timezone.now().isoformat(),
    }
    if booking is not None:
        history_entry["booking_id"] = booking.id
    if attempted_booking_id is not None:
        history_entry["attempted_booking_id"] = attempted_booking_id
    if scan_status == WORKER_SCAN_STATUS_FAILED:
        history_entry["failure_reason"] = str(failure_reason or "Verification failed.")
        if identifier_type:
            history_entry["identifier_type"] = identifier_type

    existing_entries = _get_worker_scan_history_entries(staff_id)
    if scan_status == WORKER_SCAN_STATUS_SUCCESS and booking is not None:
        existing_entries = [
            entry
            for entry in existing_entries
            if not (
                entry.get("scan_status") == WORKER_SCAN_STATUS_SUCCESS
                and entry.get("booking_id") == booking.id
            )
        ]

    _set_worker_scan_history_entries(staff_id, [history_entry, *existing_entries])


def _build_worker_scan_history_response_entry(entry, *, booking=None, booking_data=None):
    response_entry = dict(booking_data or {})
    if not response_entry:
        fallback_id = entry.get("attempted_booking_id") or entry.get("booking_id") or entry["entry_id"]
        response_entry = {
            "id": fallback_id,
            "menu_item": None,
            "quantity": None,
            "total_price": None,
            "meal_type": None,
            "booking_date": None,
            "status": None,
            "qr_expires_at": None,
            "created_at": entry.get("attempted_at"),
            "booking_reference": None,
        }

    attempted_at = entry.get("attempted_at")
    if attempted_at is None and booking is not None:
        attempted_at = (booking.redeemed_at or booking.updated_at or booking.created_at).isoformat()

    response_entry["entry_id"] = entry.get("entry_id") or f"success-{response_entry['id']}"
    response_entry["scan_status"] = entry.get("scan_status", WORKER_SCAN_STATUS_SUCCESS)
    response_entry["attempted_at"] = attempted_at or response_entry.get("created_at")

    if response_entry["scan_status"] == WORKER_SCAN_STATUS_FAILED:
        response_entry["failure_reason"] = entry.get("failure_reason") or "Verification failed."
        response_entry["identifier_type"] = entry.get("identifier_type")
        response_entry["attempted_booking_id"] = entry.get("attempted_booking_id")
        if not response_entry.get("booking_reference") and entry.get("attempted_booking_id"):
            response_entry["booking_reference"] = f"Booking #{entry['attempted_booking_id']}"

    return response_entry


def _parse_bool(value, field_name):
    if value is None:
        return None
    normalized = str(value).strip().lower()
    if normalized in {"true", "1", "yes", "y"}:
        return True
    if normalized in {"false", "0", "no", "n"}:
        return False
    raise ValidationError({field_name: "Invalid boolean value. Use true or false."})


def _apply_manager_booking_filters(queryset, query_params):
    filterset = MessManagerBookingFilter(data=query_params, queryset=queryset)
    if not filterset.is_valid():
        raise ValidationError(filterset.errors)
    return filterset.qs


def _build_booking_status_summary(queryset):
    summary = {
        "total": 0,
        MessBooking.Status.PENDING: 0,
        MessBooking.Status.REDEEMED: 0,
        MessBooking.Status.EXPIRED: 0,
        MessBooking.Status.CANCELLED: 0,
    }
    counts = queryset.values("status").annotate(total_count=Count("id"))
    for row in counts:
        summary[row["status"]] = row["total_count"]
    summary["total"] = (
        summary[MessBooking.Status.PENDING]
        + summary[MessBooking.Status.REDEEMED]
        + summary[MessBooking.Status.EXPIRED]
        + summary[MessBooking.Status.CANCELLED]
    )
    return summary


class StudentMessListView(generics.ListAPIView):
    permission_classes = [IsStudent]
    serializer_class = MessSerializer

    def get_queryset(self):
        return sorted(
            Mess.objects.filter(is_active=True),
            key=lambda mess: _natural_sort_key(mess.hall_name or mess.name),
        )


class StudentMessMenuListView(generics.ListAPIView):
    permission_classes = [IsStudent]
    serializer_class = MessMenuItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = MessMenuItemFilter

    def get_queryset(self):
        mess_id = self.kwargs["mess_id"]
        mess = get_object_or_404(Mess, pk=mess_id, is_active=True)

        queryset = MessMenuItem.objects.select_related("mess").filter(mess=mess)
        is_active_value = self.request.query_params.get("is_active")
        if is_active_value is not None:
            _parse_bool(is_active_value, "is_active")
        if is_active_value is None:
            queryset = queryset.filter(is_active=True)

        return queryset.order_by("day_of_week", "meal_type", "item_name")


class StudentExtrasBookingCreateView(generics.GenericAPIView):
    permission_classes = [IsStudent]
    serializer_class = MessBookingCreateSerializer

    def post(self, request, *args, **kwargs):
        student = _get_student_from_request(request)
        serializer = self.get_serializer(
            data=request.data,
            context={"request": request, "student": student},
        )
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        return Response(
            MessBookingDetailSerializer(booking, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class StudentBookingListView(generics.ListAPIView):
    permission_classes = [IsStudent]
    serializer_class = MessBookingListSerializer

    def get_queryset(self):
        student = _get_student_from_request(self.request)
        return (
            MessBooking.objects.select_related("menu_item", "menu_item__mess", "redeemed_by_staff")
            .filter(student=student)
            .order_by("-created_at")
        )


class StudentBookingDetailView(generics.RetrieveAPIView):
    permission_classes = [IsStudent]
    serializer_class = MessBookingDetailSerializer
    lookup_url_kwarg = "booking_id"

    def get_queryset(self):
        student = _get_student_from_request(self.request)
        return MessBooking.objects.select_related("menu_item", "menu_item__mess", "redeemed_by_staff").filter(
            student=student
        )


class StudentBookingCancelView(generics.GenericAPIView):
    permission_classes = [IsStudent]
    serializer_class = MessBookingCancelSerializer

    def post(self, request, booking_id, *args, **kwargs):
        student = _get_student_from_request(request)
        booking = get_object_or_404(
            MessBooking.objects.select_related("menu_item", "menu_item__mess", "redeemed_by_staff"),
            pk=booking_id,
            student=student,
        )
        serializer = self.get_serializer(
            data=request.data or {},
            context={"request": request, "student": student},
        )
        serializer.is_valid(raise_exception=True)
        cancelled = serializer.save(booking=booking)
        return Response(
            MessBookingDetailSerializer(cancelled, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class StudentBookingQRCodeView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request, booking_id, *args, **kwargs):
        token = request.query_params.get("token")
        if not token:
            raise PermissionDenied("Authentication token is required as a query parameter for image loading.")
            
        from rest_framework_simplejwt.authentication import JWTAuthentication
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            request.user = jwt_auth.get_user(validated_token)
        except Exception as e:
            raise PermissionDenied(f"Invalid or expired token: {str(e)}")
            
        student = _get_student_from_request(request)
        booking = get_object_or_404(
            MessBooking.objects.select_related("menu_item", "menu_item__mess"),
            pk=booking_id,
            student=student,
        )

        try:
            payload = build_booking_qr_payload(booking)
            image_bytes = generate_booking_qr_image(payload)
        except QRGenerationError as exc:
            raise ValidationError({"detail": str(exc)}) from exc

        response = HttpResponse(image_bytes, content_type="image/png")
        response["Content-Disposition"] = f'inline; filename="mess-booking-{booking.id}.png"'
        return response


class ManagerMenuListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsMessManager]
    filter_backends = [DjangoFilterBackend]
    filterset_class = MessMenuItemFilter

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MessMenuItemCreateUpdateSerializer
        return MessMenuItemSerializer

    def get_queryset(self):
        mess = _get_manager_mess(self.request)
        queryset = MessMenuItem.objects.select_related("mess").filter(mess=mess)
        is_active_value = self.request.query_params.get("is_active")
        if is_active_value is not None:
            _parse_bool(is_active_value, "is_active")
        if is_active_value is None:
            queryset = queryset.filter(is_active=True)

        return queryset.order_by(
            "day_of_week",
            "meal_type",
            "item_name",
        )

    def create(self, request, *args, **kwargs):
        mess = _get_manager_mess(request)
        payload = request.data.copy()
        requested_mess_id = payload.get("mess")
        if requested_mess_id not in (None, "", mess.id, str(mess.id)):
            raise ValidationError({"mess": "Managers can create menu items only for their assigned mess."})
        payload["mess"] = mess.id

        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(mess=mess)
        return Response(
            MessMenuItemSerializer(item, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ManagerMenuDetailView(APIView):
    permission_classes = [IsMessManager]

    def _get_menu_item(self, request, menu_item_id):
        mess = _get_manager_mess(request)
        return get_object_or_404(
            MessMenuItem.objects.select_related("mess"),
            pk=menu_item_id,
            mess=mess,
        )

    def patch(self, request, menu_item_id, *args, **kwargs):
        menu_item = self._get_menu_item(request, menu_item_id)
        payload = request.data.copy()
        requested_mess_id = payload.get("mess")
        if requested_mess_id not in (None, "", menu_item.mess_id, str(menu_item.mess_id)):
            raise ValidationError({"mess": "Changing mess is not allowed from manager menu endpoint."})
        payload["mess"] = menu_item.mess_id

        serializer = MessMenuItemCreateUpdateSerializer(menu_item, data=payload, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save(mess=menu_item.mess)
        return Response(
            MessMenuItemSerializer(updated, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, menu_item_id, *args, **kwargs):
        menu_item = self._get_menu_item(request, menu_item_id)
        if menu_item.is_active:
            menu_item.is_active = False
            menu_item.save(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ManagerBookingListView(APIView):
    permission_classes = [IsMessManager]

    def get(self, request, *args, **kwargs):
        mess = _get_manager_mess(request)
        queryset = (
            MessBooking.objects.select_related("student", "menu_item", "menu_item__mess", "redeemed_by_staff")
            .filter(menu_item__mess=mess)
            .order_by("-created_at")
        )

        if not any(
            key in request.query_params
            for key in ("booking_date", "booking_date_from", "booking_date_to")
        ):
            queryset = queryset.filter(booking_date=timezone.localdate())

        queryset = _apply_manager_booking_filters(queryset, request.query_params)
        data = MessBookingListSerializer(queryset, many=True, context={"request": request}).data
        return Response(
            {
                "stats": _build_booking_status_summary(queryset),
                "results": data,
            },
            status=status.HTTP_200_OK,
        )


class ManagerStatsView(APIView):
    permission_classes = [IsMessManager]

    def get(self, request, *args, **kwargs):
        mess = _get_manager_mess(request)
        queryset = MessBooking.objects.select_related("menu_item").filter(menu_item__mess=mess)
        queryset = _apply_manager_booking_filters(queryset, request.query_params)

        total_bookings = queryset.count()
        total_redeemed = queryset.filter(status=MessBooking.Status.REDEEMED).count()
        total_cancelled = queryset.filter(status=MessBooking.Status.CANCELLED).count()
        total_expired = queryset.filter(status=MessBooking.Status.EXPIRED).count()
        total_pending = queryset.filter(status=MessBooking.Status.PENDING).count()
        total_revenue = queryset.filter(status=MessBooking.Status.REDEEMED).aggregate(total=Sum("total_price"))[
            "total"
        ] or Decimal("0.00")

        popular_item = (
            queryset.values("menu_item_id", "menu_item__item_name")
            .annotate(total_quantity=Sum("quantity"))
            .order_by("-total_quantity", "menu_item__item_name")
            .first()
        )

        most_popular_item = None
        if popular_item:
            most_popular_item = {
                "menu_item_id": popular_item["menu_item_id"],
                "item_name": popular_item["menu_item__item_name"],
                "total_quantity": popular_item["total_quantity"],
            }

        return Response(
            {
                "mess_id": mess.id,
                "mess_name": mess.name,
                "total_bookings": total_bookings,
                "total_redeemed": total_redeemed,
                "total_cancelled": total_cancelled,
                "total_expired": total_expired,
                "total_pending": total_pending,
                "total_revenue": str(total_revenue),
                "most_popular_item": most_popular_item,
            },
            status=status.HTTP_200_OK,
        )


class ManagerInventoryView(APIView):
    permission_classes = [IsMessManager]

    def get(self, request, *args, **kwargs):
        mess = _get_manager_mess(request)
        queryset = MessMenuItem.objects.select_related("mess").filter(mess=mess).order_by(
            "day_of_week",
            "meal_type",
            "item_name",
        )
        data = MessMenuItemSerializer(queryset, many=True, context={"request": request}).data
        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        mess = _get_manager_mess(request)
        menu_item_id = request.data.get("menu_item_id")
        if menu_item_id in (None, ""):
            raise ValidationError({"menu_item_id": "menu_item_id is required."})
        try:
            menu_item_id = int(menu_item_id)
        except (TypeError, ValueError) as exc:
            raise ValidationError({"menu_item_id": "menu_item_id must be a valid integer."}) from exc

        menu_item = get_object_or_404(
            MessMenuItem.objects.select_related("mess"),
            pk=menu_item_id,
            mess=mess,
        )
        payload = request.data.copy()
        payload.pop("menu_item_id", None)
        payload.pop("mess_id", None)

        serializer = MessInventoryUpdateSerializer(menu_item, data=payload, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(
            MessMenuItemSerializer(updated, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class WorkerVerifyBookingView(generics.GenericAPIView):
    permission_classes = [IsMessWorker]
    serializer_class = MessWorkerVerifySerializer

    def post(self, request, *args, **kwargs):
        staff = _get_staff_from_request(request)
        worker_assignment = _get_worker_assignment(request)
        payload = request.data.copy()
        payload.pop("mess_id", None)

        serializer = self.get_serializer(
            data=payload,
            context={
                "request": request,
                "staff": staff,
                "allowed_mess_id": worker_assignment.mess_id,
            },
        )
        try:
            serializer.is_valid(raise_exception=True)
            booking = serializer.save(staff=staff)
        except ValidationError as exc:
            booking = None
            if getattr(serializer, "validated_data", None):
                try:
                    booking = serializer.get_booking()
                except ValidationError:
                    booking = None

            _record_worker_scan_history(
                staff.id,
                scan_status=WORKER_SCAN_STATUS_FAILED,
                booking=booking,
                failure_reason=_extract_worker_scan_error_message(exc.detail),
                payload=payload,
            )
            raise

        _record_worker_scan_history(
            staff.id,
            scan_status=WORKER_SCAN_STATUS_SUCCESS,
            booking=booking,
            payload=payload,
        )
        return Response(
            MessBookingDetailSerializer(booking, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class WorkerScanHistoryView(APIView):
    permission_classes = [IsMessWorker]

    def get(self, request, *args, **kwargs):
        staff = _get_staff_from_request(request)
        worker_assignment = _get_worker_assignment(request)

        cached_entries = _get_worker_scan_history_entries(staff.id)
        bookings_queryset = MessBooking.objects.select_related("menu_item", "menu_item__mess", "redeemed_by_staff").filter(
            menu_item__mess_id=worker_assignment.mess_id,
        )

        if cached_entries:
            booking_ids = [
                entry["booking_id"]
                for entry in cached_entries
                if entry.get("booking_id") is not None
            ]
            bookings = list(bookings_queryset.filter(id__in=booking_ids))
            bookings_by_id = {booking.id: booking for booking in bookings}
            serialized_bookings = MessBookingListSerializer(
                bookings,
                many=True,
                context={"request": request},
            ).data
            booking_data_by_id = {item["id"]: item for item in serialized_bookings}
            data = [
                _build_worker_scan_history_response_entry(
                    entry,
                    booking=bookings_by_id.get(entry.get("booking_id")),
                    booking_data=booking_data_by_id.get(entry.get("booking_id")),
                )
                for entry in cached_entries
            ]
        else:
            ordered_bookings = list(
                bookings_queryset.filter(
                    redeemed_by_staff=staff,
                    status=MessBooking.Status.REDEEMED,
                ).order_by("-redeemed_at", "-updated_at")[:WORKER_SCAN_HISTORY_LIMIT]
            )
            serialized_bookings = MessBookingListSerializer(
                ordered_bookings,
                many=True,
                context={"request": request},
            ).data
            booking_data_by_id = {item["id"]: item for item in serialized_bookings}
            data = [
                _build_worker_scan_history_response_entry(
                    {
                        "entry_id": f"success-{booking.id}",
                        "scan_status": WORKER_SCAN_STATUS_SUCCESS,
                        "booking_id": booking.id,
                    },
                    booking=booking,
                    booking_data=booking_data_by_id.get(booking.id),
                )
                for booking in ordered_bookings
            ]

        return Response(data, status=status.HTTP_200_OK)
