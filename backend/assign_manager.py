import django
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.users.models import User, Staff, Role
from apps.mess.models import Mess, MessStaffAssignment

def assign_manager():
    # Get Hall 1 mess
    mess = Mess.objects.filter(hall_name__icontains='Hall 1').first()
    if not mess:
        print('Hall 1 mess not found!')
        return

    # Find the mess manager user
    manager_role = Role.objects.filter(role_name='mess_manager').first()
    if not manager_role:
        print('Mess manager role not found!')
        return

    manager_users = User.objects.filter(role=manager_role)
    if not manager_users.exists():
        print('No mess manager users found!')
        return

    manager_user = manager_users.latest('id')
    staff_profile = getattr(manager_user, 'staff_profile', None)
    if not staff_profile:
        print(f'Staff profile not found for user {manager_user.email}')
        staff_profile = Staff.objects.create(
            user=manager_user, 
            employee_code='M-TEST', 
            full_name='Test Manager', 
            is_mess_staff=True
        )

    # Create assignment
    assignment, created = MessStaffAssignment.objects.get_or_create(
        staff=staff_profile,
        mess=mess,
        assignment_role='manager',
        defaults={'is_active': True}
    )
    if created:
        print(f'Created assignment for {manager_user.email} to mess {mess.name} ({mess.hall_name})')
    else:
        print(f'Assignment already exists for {manager_user.email} to mess {mess.name} ({mess.hall_name})')

if __name__ == "__main__":
    assign_manager()
