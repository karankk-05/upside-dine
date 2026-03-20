from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .forms import UserCreationForm, UserChangeForm
from .models import User, Role, Student, Staff, MessAccount, UserToken


class StudentInline(admin.StackedInline):
    model = Student
    can_delete = False
    verbose_name_plural = "Student Profile"
    fk_name = "user"
    extra = 0


class StaffInline(admin.StackedInline):
    model = Staff
    can_delete = False
    verbose_name_plural = "Staff Profile"
    fk_name = "user"
    extra = 0


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    add_form = UserCreationForm
    form = UserChangeForm
    ordering = ("email",)
    list_display = ("email", "role", "is_verified", "is_active", "is_staff", "is_superuser")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("phone", "role")}),
        ("Permissions", {"fields": ("is_active", "is_verified", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "password1", "password2", "role", "is_staff", "is_superuser")}),
    )
    search_fields = ("email",)
    list_filter = ("is_active", "is_verified", "is_staff", "is_superuser", "role")
    inlines = [StudentInline, StaffInline]


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("role_name", "description")
    search_fields = ("role_name",)


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("full_name", "roll_number", "user", "hostel_name", "room_number")
    search_fields = ("full_name", "roll_number", "user__email")
    list_filter = ("hostel_name",)


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ("full_name", "employee_code", "user", "is_mess_staff", "canteen_id")
    search_fields = ("full_name", "employee_code", "user__email")
    list_filter = ("is_mess_staff",)


@admin.register(MessAccount)
class MessAccountAdmin(admin.ModelAdmin):
    list_display = ("student", "balance", "last_updated")
    search_fields = ("student__full_name", "student__user__email")


@admin.register(UserToken)
class UserTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "device_info", "ip_address", "expires_at", "is_revoked", "created_at")
    list_filter = ("is_revoked",)
    search_fields = ("user__email",)


admin.site.site_header = "Upside Dine Admin"
admin.site.site_title = "Upside Dine Admin"
admin.site.index_title = "Administration"