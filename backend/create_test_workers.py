import django
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.hashers import make_password
from apps.users.models import User, Staff, Role
from apps.mess.models import Mess, MessStaffAssignment

def create_accounts():
    # Helper to get roles
    def get_role(name):
        role, _ = Role.objects.get_or_create(role_name=name)
        return role

    # 1. Mess Worker
    worker_role = get_role('mess_worker')
    worker_user = User.objects.filter(email='worker@test.com').first()
    if not worker_user:
        worker_user = User.objects.create(
            email='worker@test.com',
            password=make_password('worker123'),
            role=worker_role,
            is_active=True,
            is_verified=True
        )
        print("Created User worker@test.com (password: worker123)")
    else:
        worker_user.password = make_password('worker123')
        worker_user.role = worker_role
        worker_user.is_verified = True
        worker_user.save()
        print("Updated User worker@test.com (password: worker123)")

    worker_staff, _ = Staff.objects.get_or_create(
        user=worker_user,
        defaults={
            'full_name': 'Test Mess Worker',
            'employee_code': 'MWK-TEST',
            'is_mess_staff': True
        }
    )

    mess = Mess.objects.filter(hall_name__icontains='Hall 1').first() or Mess.objects.first()
    if mess:
        # Get or update strictly to 'worker'
        assign, created = MessStaffAssignment.objects.get_or_create(
            staff=worker_staff,
            mess=mess,
            defaults={'is_active': True, 'assignment_role': 'worker'}
        )
        if not created and assign.assignment_role != 'worker':
            assign.assignment_role = 'worker'
            assign.save()
        print(f"Assigned Worker to Mess: {mess.name}")


    # 2. Delivery Coordinator
    delivery_role = get_role('delivery_person')
    del_user = User.objects.filter(email='delivery@test.com').first()
    if not del_user:
        del_user = User.objects.create(
            email='delivery@test.com',
            password=make_password('delivery123'),
            role=delivery_role,
            is_active=True
        )
        print("Created User delivery@test.com (password: delivery123)")
    else:
        del_user.password = make_password('delivery123')
        del_user.role = delivery_role
        del_user.save()
        print("Updated User delivery@test.com (password: delivery123)")

    Staff.objects.get_or_create(
        user=del_user,
        defaults={
            'full_name': 'Test Delivery Coordinator',
            'employee_code': 'DEL-TEST',
            'is_mess_staff': False
        }
    )
    print("Test users generation complete!")
    

if __name__ == "__main__":
    create_accounts()
