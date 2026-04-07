import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

role_passwords = {
    "admin_manager": "admin123",
    "canteen_manager": "canteen123",
    "delivery_person": "delivery123",
    "mess_manager": "mess123",
    "mess_worker": "worker123",
    "student": "student123"
}

for role, pw in role_passwords.items():
    users = User.objects.filter(role__role_name=role)
    for u in users:
        u.set_password(pw)
        u.save()
        print(f"Updated {role}: {u.email} -> {pw}")

# And explicitly update exactly the admin email requested
admin, _ = User.objects.get_or_create(email="admin@iitk.ac.in")
admin.set_password("admin123")
admin.is_superuser = True
admin.is_staff = True
admin.is_active = True
admin.save()
print(f"Updated Admin: {admin.email} -> admin123")

print("\n✅ ALL TESTING CREDENTIALS SUCCESSFULLY SYNCED TO THE DOCUMENT!")
