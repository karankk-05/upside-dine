from django.core.management.base import BaseCommand
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from apps.users.models import User, Role, Staff
import secrets
import string


class Command(BaseCommand):
    help = 'Create a manager account (Mess Manager or Canteen Manager)'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, required=True, help='Manager email')
        parser.add_argument('--name', type=str, required=True, help='Manager full name')
        parser.add_argument('--role', type=str, required=True, choices=['mess_manager', 'canteen_manager', 'admin_manager'], help='Manager role')
        parser.add_argument('--canteen-id', type=int, help='Canteen ID (for canteen manager)')
        parser.add_argument('--phone', type=str, default='', help='Phone number')

    def handle(self, *args, **options):
        email = options['email'].lower()
        name = options['name']
        role_name = options['role']
        canteen_id = options.get('canteen_id')
        phone = options.get('phone', '')

        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))

        try:
            with transaction.atomic():
                role, _ = Role.objects.get_or_create(role_name=role_name)

                if User.objects.filter(email=email).exists():
                    self.stdout.write(self.style.ERROR(f'User with email {email} already exists'))
                    return

                employee_code = f"{role_name.upper()[:3]}{secrets.token_hex(4).upper()}"
                while Staff.objects.filter(employee_code=employee_code).exists():
                    employee_code = f"{role_name.upper()[:3]}{secrets.token_hex(4).upper()}"

                user = User.objects.create_user(
                    email=email,
                    password=temp_password,
                    phone=phone,
                    role=role,
                    is_verified=True,
                    is_active=True,
                )

                staff = Staff.objects.create(
                    user=user,
                    full_name=name,
                    employee_code=employee_code,
                    canteen_id=canteen_id if role_name == 'canteen_manager' else None,
                    is_mess_staff=(role_name == 'mess_manager'),
                )

                try:
                    subject = f'Your {role.get_role_name_display()} Account - Upside Dine'
                    message = f'''Hello {name},

Your {role.get_role_name_display()} account has been created successfully.

Login Credentials:
==================
Email: {email}
Temporary Password: {temp_password}
Employee Code: {employee_code}

Login URL: http://localhost:3000/auth

IMPORTANT: Please change your password immediately after your first login.

Best regards,
Upside Dine Team'''
                    
                    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@upsidedine.local")
                    send_mail(subject, message, from_email, [email], fail_silently=False)
                    
                    self.stdout.write(self.style.SUCCESS(f'\n{"="*60}'))
                    self.stdout.write(self.style.SUCCESS('Manager account created successfully!'))
                    self.stdout.write(self.style.SUCCESS(f'{"="*60}'))
                    self.stdout.write(self.style.SUCCESS(f'Email: {email}'))
                    self.stdout.write(self.style.SUCCESS(f'Temporary Password: {temp_password}'))
                    self.stdout.write(self.style.SUCCESS(f'Employee Code: {employee_code}'))
                    self.stdout.write(self.style.SUCCESS(f'Role: {role_name}'))
                    self.stdout.write(self.style.SUCCESS(f'{"="*60}'))
                    self.stdout.write(self.style.SUCCESS(f'\n✅ Credentials sent to {email}'))
                    
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'\n⚠️ Account created but email failed: {str(e)}'))
                    self.stdout.write(self.style.SUCCESS(f'\nEmail: {email}'))
                    self.stdout.write(self.style.SUCCESS(f'Password: {temp_password}'))
                    self.stdout.write(self.style.SUCCESS(f'Employee Code: {employee_code}'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
