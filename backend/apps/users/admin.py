from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .forms import UserCreationForm, UserChangeForm
from .models import User, Role, Student, Staff, MessAccount, UserToken


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    add_form = UserCreationForm
    form = UserChangeForm
    ordering = ("email",)
    list_display = ("email", "role", "is_verified", "is_active", "is_staff")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("phone", "role")}),
        ("Permissions", {"fields": ("is_active", "is_verified", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "password1", "password2", "is_staff", "is_superuser")}),
    )
    search_fields = ("email",)
    list_filter = ("is_active", "is_verified", "is_staff", "role")


admin.site.register(Role)
admin.site.register(Student)
admin.site.register(Staff)
admin.site.register(MessAccount)
admin.site.register(UserToken)
admin.site.site_header = "Upside Dine Admin"
admin.site.site_title = "Upside Dine Admin"
admin.site.index_title = "Administration"