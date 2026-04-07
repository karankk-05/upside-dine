import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

u, created = User.objects.get_or_create(email='supersi@iitk.ac.in')
u.set_password('admin123')
u.is_superuser = True
u.is_staff = True
u.is_active = True
u.save()

print(f"✅ SUPERADMIN {'CREATED' if created else 'UPDATED AND ACTIVATED'}! Email: {u.email} | Password: admin123")
