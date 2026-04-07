import sys
import os
import django

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

for role, pw in [("mess_worker", "worker123"), ("mess_manager", "manager123"), ("student", "student123")]:
    users = User.objects.filter(role__role_name=role)
    for u in users:
        u.set_password(pw)
        u.save()
        print(f"{role}: {u.email} | Password: {pw}")
print("ALL PASSWORDS SUCCESSFULLY RESET")
