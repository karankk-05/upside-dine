import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import Role, Staff, Student, MessAccount
from apps.mess.models import Mess, MessStaffAssignment
from apps.canteen.models import Canteen

User = get_user_model()

# Roles
R_STUDENT, _ = Role.objects.get_or_create(role_name='student')
R_MESS_MANAGER, _ = Role.objects.get_or_create(role_name='mess_manager')
R_MESS_WORKER, _ = Role.objects.get_or_create(role_name='mess_worker')
R_CANTEEN_MANAGER, _ = Role.objects.get_or_create(role_name='canteen_manager')
R_DELIVERY_PERSON, _ = Role.objects.get_or_create(role_name='delivery_person')
R_ADMIN, _ = Role.objects.get_or_create(role_name='admin_manager')

# 1. Superadmin
print("Creating superadmin...")
superadmin = User.objects.create_superuser('superadmin@iitk.ac.in', 'h1n1@coronavirus')

# 2. Admin Manager
admin_user = User.objects.create_user('admin@iitk.ac.in', 'admin123')
admin_user.role = R_ADMIN; admin_user.is_active=True; admin_user.is_verified=True; admin_user.save()
Staff.objects.get_or_create(user=admin_user, defaults={'full_name':'Admin Owner', 'employee_code':'AD001'})

# 3. Canteens (Mapping to standard names injected by seed_data.py)
print("Configuring Canteens...")
cant1, _ = Canteen.objects.get_or_create(name='CCD', defaults={'location':'Faculty Lounge, Academic Area'})
cant2, _ = Canteen.objects.get_or_create(name='Hall 1 Canteen', defaults={'location':'Hall-I'})

# Canteen 1 Manager & Delivery
c1_mgr_u = User.objects.create_user('ccd_mgr@iitk.ac.in', 'canteen123')
c1_mgr_u.role = R_CANTEEN_MANAGER; c1_mgr_u.is_active=True; c1_mgr_u.is_verified=True; c1_mgr_u.save()
Staff.objects.get_or_create(user=c1_mgr_u, defaults={'full_name':'Rahul CCD', 'employee_code':'C1M', 'canteen':cant1})

c1_del1 = User.objects.create_user('ccd_del1@iitk.ac.in', 'delivery123')
c1_del1.role = R_DELIVERY_PERSON; c1_del1.is_active=True; c1_del1.is_verified=True; c1_del1.save()
Staff.objects.get_or_create(user=c1_del1, defaults={'full_name':'Ramu Delivery', 'employee_code':'C1D1', 'canteen':cant1})

c1_del2 = User.objects.create_user('ccd_del2@iitk.ac.in', 'delivery123')
c1_del2.role = R_DELIVERY_PERSON; c1_del2.is_active=True; c1_del2.is_verified=True; c1_del2.save()
Staff.objects.get_or_create(user=c1_del2, defaults={'full_name':'Shyamu Delivery', 'employee_code':'C1D2', 'canteen':cant1})

# Canteen 2 Manager & Delivery
c2_mgr_u = User.objects.create_user('yashoda_mgr@iitk.ac.in', 'canteen123')
c2_mgr_u.role = R_CANTEEN_MANAGER; c2_mgr_u.is_active=True; c2_mgr_u.is_verified=True; c2_mgr_u.save()
Staff.objects.get_or_create(user=c2_mgr_u, defaults={'full_name':'Karan Yashoda', 'employee_code':'C2M', 'canteen':cant2})

c2_del1 = User.objects.create_user('yash_del1@iitk.ac.in', 'delivery123')
c2_del1.role = R_DELIVERY_PERSON; c2_del1.is_active=True; c2_del1.is_verified=True; c2_del1.save()
Staff.objects.get_or_create(user=c2_del1, defaults={'full_name':'Suraj Delivery', 'employee_code':'C2D1', 'canteen':cant2})

c2_del2 = User.objects.create_user('yash_del2@iitk.ac.in', 'delivery123')
c2_del2.role = R_DELIVERY_PERSON; c2_del2.is_active=True; c2_del2.is_verified=True; c2_del2.save()
Staff.objects.get_or_create(user=c2_del2, defaults={'full_name':'Vikram Delivery', 'employee_code':'C2D2', 'canteen':cant2})

# 4. Messes
print("Configuring Messes...")
m1, _ = Mess.objects.get_or_create(hall_name='Hall 1', defaults={'location':'Hall 1 Campus'})
m2, _ = Mess.objects.get_or_create(hall_name='Hall 5', defaults={'location':'Hall 5 Campus'})

# Mess 1 (Hall 1) Manager & 2 Workers
m1_mgr_u = User.objects.create_user('hall1_mgr@iitk.ac.in', 'mess123')
m1_mgr_u.role = R_MESS_MANAGER; m1_mgr_u.is_active=True; m1_mgr_u.is_verified=True; m1_mgr_u.save()
m1_staff, _ = Staff.objects.get_or_create(user=m1_mgr_u, defaults={'full_name':'Amit Hall1', 'employee_code':'M1M', 'is_mess_staff':True})

MessStaffAssignment.objects.filter(staff=m1_staff).delete()
Mess.objects.filter(hall_name='Hall M1M').delete()
MessStaffAssignment.objects.get_or_create(staff=m1_staff, mess=m1, defaults={'assignment_role':'manager'})

for i, name in enumerate(['Chhotu Worker', 'Motu Worker']):
    u = User.objects.create_user(f'hall1_w{i+1}@iitk.ac.in', 'worker123')
    u.role = R_MESS_WORKER; u.is_active=True; u.is_verified=True; u.save()
    st, _ = Staff.objects.get_or_create(user=u, defaults={'full_name':name, 'employee_code':f'M1W{i+1}', 'is_mess_staff':True})
    MessStaffAssignment.objects.get_or_create(staff=st, mess=m1, defaults={'assignment_role':'worker'})

# Mess 2 (Hall 5) Manager & 2 Workers
m2_mgr_u = User.objects.create_user('hall5_mgr@iitk.ac.in', 'mess123')
m2_mgr_u.role = R_MESS_MANAGER; m2_mgr_u.is_active=True; m2_mgr_u.is_verified=True; m2_mgr_u.save()
m2_staff, _ = Staff.objects.get_or_create(user=m2_mgr_u, defaults={'full_name':'Suresh Hall5', 'employee_code':'M2M', 'is_mess_staff':True})

MessStaffAssignment.objects.filter(staff=m2_staff).delete()
Mess.objects.filter(hall_name='Hall M2M').delete()
MessStaffAssignment.objects.get_or_create(staff=m2_staff, mess=m2, defaults={'assignment_role':'manager'})

for i, name in enumerate(['Golu Worker', 'Bholu Worker']):
    u = User.objects.create_user(f'hall5_w{i+1}@iitk.ac.in', 'worker123')
    u.role = R_MESS_WORKER; u.is_active=True; u.is_verified=True; u.save()
    st, _ = Staff.objects.get_or_create(user=u, defaults={'full_name':name, 'employee_code':f'M2W{i+1}', 'is_mess_staff':True})
    MessStaffAssignment.objects.get_or_create(staff=st, mess=m2, defaults={'assignment_role':'worker'})

# 5. Students
print("Configuring Students...")
students = [
    ('Ravi Kumar', 'hall1_s1@iitk.ac.in', 'Hall 1', 'student123'),
    ('Neha Sharma', 'hall1_s2@iitk.ac.in', 'Hall 1', 'student123'),
    ('Prakash Rai', 'hall5_s1@iitk.ac.in', 'Hall 5', 'student123'),
    ('Anjali Roy', 'hall5_s2@iitk.ac.in', 'Hall 5', 'student123'),
]

for i, (name, email, hall, pw) in enumerate(students):
    u = User.objects.create_user(email, pw)
    u.role = R_STUDENT; u.is_active=True; u.is_verified=True; u.save()
    st, _ = Student.objects.get_or_create(user=u, defaults={'full_name':name, 'roll_number':f'220{i+1}', 'hostel_name':hall})
    MessAccount.objects.get_or_create(student=st, defaults={'balance':5000})

print("Database Fully Seeded Custom Profiles smoothly matching existing infrastructure!")
