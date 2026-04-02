import django
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.users.models import User, Student, Role

def create_student():
    # Find the student role
    student_role = Role.objects.filter(role_name='student').first()
    if not student_role:
        role_type = 'student'
        student_role, _ = Role.objects.get_or_create(role_name=role_type)

    email = 'student1@test.com'
    
    # Check if user already exists
    user = User.objects.filter(email=email).first()
    if not user:
        user = User.objects.create_user(
            email=email,
            password='password123',
            role=student_role,
            is_active=True,
            is_verified=True
        )
        print(f"Created user {email} with password 'password123'")
    else:
        # Reset password just in case
        user.set_password('password123')
        user.save()
        print(f"User {email} already exists. Password reset to 'password123'")

    # Ensure they have a student profile with Hall 1
    student_profile = getattr(user, 'student_profile', None)
    if not student_profile:
        Student.objects.create(
            user=user,
            full_name='Test Student',
            roll_number='210000',
            hostel_name='Hall 1'
        )
        print("Created student profile for Hall 1.")
    else:
        student_profile.hostel_name = 'Hall 1'
        student_profile.save()
        print("Updated student profile to belong to Hall 1.")

if __name__ == "__main__":
    create_student()
