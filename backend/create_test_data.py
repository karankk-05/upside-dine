import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User, Role, Student
from apps.mess.models import Mess
from apps.crowd.models import CameraFeed

def create_test_data():
    # 1. Create/Get Role
    role, _ = Role.objects.get_or_create(role_name='student', defaults={'description': 'Student Role'})

    # 2. Create/Get Mess
    mess, _ = Mess.objects.get_or_create(
        name="Test Hall 1 Mess",
        defaults={
            'location': 'Center Campus',
            'hall_name': 'Hall 1',
            'is_active': True
        }
    )

    # 3. Create User
    email = "test_student@iitk.ac.in"
    password = "testpass123"
    
    user = User.objects.filter(email=email).first()
    if not user:
        user = User.objects.create(
            email=email,
            role=role,
            is_active=True,
            is_verified=True
        )
        user.set_password(password)
        user.save()
        print(f"Created new user: {email}")
    else:
        user.set_password(password)
        user.is_active = True
        user.is_verified = True
        user.role = role
        user.save()
        print(f"Updated existing user: {email}")

    # 4. Create Student Profile
    student, _ = Student.objects.get_or_create(
        user=user,
        defaults={
            'roll_number': '123456',
            'full_name': 'Test Student',
            'hostel_name': 'Hall 1',
            'room_number': 'A-101'
        }
    )

    # 5. Create Camera Feed
    camera_url = "https://172.23.149.163:8080/video"
    
    # Remove existing feed with same URL if any, to avoid conflicts
    CameraFeed.objects.filter(camera_url=camera_url).delete()
    
    feed = CameraFeed.objects.create(
        mess_id=mess.id,
        camera_url=camera_url,
        is_active=True,
        location_description="Dining Hall Center"
    )

    print("-" * 40)
    print("SUCCESS! Test data created.")
    print(f"Mess ID: {mess.id}")
    print(f"Mess Name: {mess.name}")
    print(f"Student Email: {email}")
    print(f"Student Password: {password}")
    print(f"Camera URL Registered: {feed.camera_url}")
    print("-" * 40)

if __name__ == "__main__":
    create_test_data()
