from rest_framework.permissions import BasePermission


def _has_role(user, role_name):
    return bool(user and user.is_authenticated and user.role and user.role.role_name == role_name)


class IsStudent(BasePermission):
    """Allow access to users with the 'student' role."""
    def has_permission(self, request, view):
        return _has_role(request.user, "student")


class IsMessManager(BasePermission):
    """Allow access to users with the 'mess_manager' role."""
    def has_permission(self, request, view):
        return _has_role(request.user, "mess_manager")


class IsMessWorker(BasePermission):
    """Allow access to users with the 'mess_worker' role."""
    def has_permission(self, request, view):
        return _has_role(request.user, "mess_worker")


class IsCanteenManager(BasePermission):
    """Allow access to users with the 'canteen_manager' role."""
    def has_permission(self, request, view):
        return _has_role(request.user, "canteen_manager")


class IsDeliveryPerson(BasePermission):
    """Allow access to users with the 'delivery_person' role."""
    def has_permission(self, request, view):
        return _has_role(request.user, "delivery_person")


class IsSuperAdmin(BasePermission):
    """Allow access only to superusers (GOD / superadmin role)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsMessStaff(BasePermission):
    """Allow access to mess_manager OR mess_worker."""
    def has_permission(self, request, view):
        return _has_role(request.user, "mess_manager") or _has_role(request.user, "mess_worker")


class IsAnyStaff(BasePermission):
    """Allow access to any non-student role OR superusers."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        return request.user.role and request.user.role.role_name != "student"