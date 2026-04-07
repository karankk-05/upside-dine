"""
Run inside Docker:
  docker cp backend/seed_canteen_users.py upside_dine_backend:/app/seed_canteen_users.py
  docker exec -it upside_dine_backend python manage.py shell -c "exec(open('seed_canteen_users.py').read())"
"""

from apps.users.models import User, Role, Staff
from apps.canteen.models import Canteen

PASSWORD = "upsidedine123"

ccd = Canteen.objects.filter(name__icontains='ccd').first() or Canteen.objects.filter(name__icontains='cafe').first()
if not ccd:
    print("ERROR: CCD canteen not found! Create it first.")
    exit()

print(f"Found canteen: {ccd.name} (ID: {ccd.id})")

# Roles
mgr_role, _ = Role.objects.get_or_create(role_name="canteen_manager")
del_role, _ = Role.objects.get_or_create(role_name="delivery_person")

# --- Canteen Manager ---
mgr_email = "manager_ccd@upsidedine.com"
mgr_user, created = User.objects.get_or_create(email=mgr_email, defaults={"role": mgr_role, "is_active": True, "is_verified": True})
if created:
    mgr_user.set_password(PASSWORD)
    mgr_user.save()
    Staff.objects.create(user=mgr_user, full_name="CCD Manager", employee_code="CCD_MGR_01", canteen=ccd)
    print(f"Created Canteen Manager: {mgr_email} / {PASSWORD}")
else:
    print(f"Already exists: {mgr_email}")

# --- Delivery Person ---
del_email = "delivery_ccd@upsidedine.com"
del_user, created = User.objects.get_or_create(email=del_email, defaults={"role": del_role, "is_active": True, "is_verified": True})
if created:
    del_user.set_password(PASSWORD)
    del_user.save()
    Staff.objects.create(user=del_user, full_name="CCD Delivery Boy", employee_code="CCD_DEL_01", canteen=ccd)
    print(f"Created Delivery Person: {del_email} / {PASSWORD}")
else:
    print(f"Already exists: {del_email}")

print("\n--- ALL DONE ---")
print(f"Canteen Manager:  {mgr_email}  /  {PASSWORD}")
print(f"Delivery Person:  {del_email}  /  {PASSWORD}")
