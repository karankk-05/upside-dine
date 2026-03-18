from rest_framework.permissions import BasePermission


def _has_role(user, role_name):
    return bool(user and user.is_authenticated and user.role and user.role.role_name == role_name)


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request.user, "student")


class IsMessManager(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request.user, "mess_manager")


class IsMessWorker(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request.user, "mess_worker")


class IsCanteenManager(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request.user, "canteen_manager")


class IsDeliveryPerson(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request.user, "delivery_person")


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return _has_role(request.user, "admin") or (request.user and request.user.is_superuser)