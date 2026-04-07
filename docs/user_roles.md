# User Roles and Authentication System

This document outlines the hierarchy of user roles within Upside Dine and explains the workflows for authentication and account creation across different permission levels.

## 1. Defined Roles
The system enforces Role-Based Access Control (RBAC). Roles are stored in the database under the `Role` model:

- `student`: Standard user role for ordering from the canteen or interacting with the mess.
- `canteen_manager`: Manages canteen inventory, orders, and delivery personnel.
- `mess_manager`: Manages mess operations, menus, and staff.
- `admin_manager`: Oversees the platform alongside the superadmin.
- `delivery_person`: Handles order deliveries.
- `mess_worker`: Staff assisting in the mess.

*Note: There is also an implicit **Superadmin** role, granted to any `User` with `is_superuser=True`.*

---

## 2. Authentication Workflow

Upside Dine uses **JWT (JSON Web Tokens)** for session management combined with **OTP-based email verification** for account security.

### Public Registration
To prevent unauthorized access to privileged dashboards, **only Students can register publicly**.

1. **Sign Up (`/register`)**: Student submits their details. The system creates an inactive user and emails them an OTP.
2. **Verify (`/verify-otp`)**: Student submits their email and OTP. Their account is activated (`is_verified=True`, `is_active=True`).

### Logging In & Sessions
1. **Login (`/login`)**: User submits email and password to receive an `access` and `refresh` token. The login response also includes the user's `role`, enabling the frontend to route them to the correct dashboard.
2. **Session Security**: Refresh tokens are tracked in the database (`UserToken`), alongside IP address and device info. When a user logs out (`/logout`), the refresh token is blacklisted and revoked.
3. **Password Management**: Handled via OTP verification (`/forgot-password` and `/reset-password`). Users can also securely delete their accounts (`/delete-account`) by providing their current password.

---

## 3. Manager Account Creation (Superadmin Workflow)

Staff and managerial roles (**Canteen Manager**, **Mess Manager**, **Admin Manager**) cannot register via the public frontend interface. They must be explicitly created by the system administrator to guarantee security.

### The `create_manager` Command
Manager accounts must be provisioned securely from the backend terminal using the built-in Django management command. 

**Usage:**
```bash
python manage.py create_manager --email="admin@example.com" --name="John Doe" --role="admin_manager"
```

**What this command automates:**
1. Generates a secure, random 12-character temporary password.
2. Generates a unique `EmployeeCode`.
3. Sets up both the base `User` table and the associated `Staff` profile in the database.
4. **Distributes Credentials:** Automatically emails the new manager (via Brevo SMTP) with their login URL, temporary password, and employee code.
5. **Terminal Fallback:** If the Brevo SMTP email fails to send, the credentials are safely printed into the server terminal so the Superadmin can manually securely message the new manager.

### The `EmployeeCode`
The system utilizes an `EmployeeCode` table. This tracks pre-generated codes assigned to specific roles to ensure that, moving forward, manager verification remains airtight. When a manager's account is created through the script, their unique `EmployeeCode` is marked as claimed.

### Hierarchical Delegation & Staff Creation
Upside Dine utilizes a **Delegated Administration** architecture to scale operations securely:
1. **Admin Managers:** Created by the Superadmin. They oversee the platform.
2. **Canteen Managers & Mess Managers:** Created by the Admin Manager through the dashboard API.
3. **Delivery Personnel:** Created by the Canteen Manager. The system automatically detects the creating manager's `canteen_id` and securely binds the new delivery person to that specific canteen.
4. **Mess Workers:** Created by the Mess Manager, similarly bound to their specific mess instance.

*Security Benefit:* This "chain of trust" prevents a bottleneck at the Superadmin level and enforces Context-Aware Security.

---

## 4. Operational Considerations
**Current State:** 
Creating managers via the SSH/terminal is highly secure as it completely separates the administrative setup from the public internet logic.

**Future Scaling:** 
If non-technical personnel (such as HR or a university administrator) need to onboard managers in the future, this backend Python script should be wrapped into a secure Superadmin UI Dashboard on the frontend.
