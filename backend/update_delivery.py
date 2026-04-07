import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

users = User.objects.filter(role__role_name='delivery_person')
for u in users:
    u.set_password('delivery123')
    u.save()
    print(f"Updated Delivery Coordinator: {u.email} -> delivery123")
