# Clickit

Home-services platform (Snabbit-style). Three panels: `/user`, `/staff`, `/superadmin`.

```
frontend/   React + Vite   (http://localhost:5180)
backend/    Node + Express (http://localhost:4000)
database/   clickit.sql    (the single DB file: schema + seed data)
```

## Run it

1. **Backend config** – copy `backend/.env.example` to `backend/.env`, then set `DB_PASSWORD` (your MySQL root password) and a long random `JWT_SECRET`.
2. **Create the database** (drops & recreates `clickit`):
   ```
   npm --prefix backend run db:init
   ```
   or run the file yourself: `mysql -u root -p < database/clickit.sql`
3. **Start the API:** `npm --prefix backend start`
4. **Start the website:** `npm --prefix frontend run dev` → open http://localhost:5180

## Logins

- `/superadmin`: `admin@clickit.com` (the password is the one set in `database/clickit.sql` as a bcrypt hash; to change it, replace the hash and re-run the file, or ask for a reset script).
- `/staff` and `/user`: nobody is pre-created. Staff register on `/staff` (then the admin approves them) or the admin adds them; customers sign up on `/user` or the admin adds them.

## Workflow

User requests a service → nearest online staff in the same city gets a popup → first to accept wins →
staff uploads **before** photo, starts, uploads **after** photo, completes → user rates →
super admin runs the **weekly settlement** (staff get 70%, set in the `settings` table).
Staff registrations (Mumbai / Delhi) must be approved by the super admin; sub-users get only the menus,
permissions (view / approve / reject / edit) and cities the super admin gives them.

## What each panel can do

**Super admin** (`/superadmin`)
- Dashboard: live stats, bar / line / donut charts, rankings, and pending staff registrations to approve or reject right away.
- Staff: approve / reject registrations, or create, edit and delete staff yourself (they log in with the mail id and password you set).
- Customers: create, edit and delete customer accounts.
- Services: add, edit, delete, with description and image upload. Hidden or deleted services disappear from the website and booking screen.
- Cities: add, edit, delete, enable, upload a photo and manage areas. Cities appear on the website automatically.
- Users and permissions: create panel users with their own mail id and password, then tick the menus, permissions (view / approve / reject / edit) and cities they may use. Edit them any time.
- Bookings, weekly settlements and feedback.

**Staff** (`/staff`): dashboard with earnings charts, job pop-ups, before and after photo upload, payouts, weekly settlements and their own customer feedback.

**User** (`/user`): dashboard with spending charts, booking, live tracking and feedback.

Feedback goes to both the staff member and the admin team.

Re-running `database/clickit.sql` resets everything to a clean database with only the super admin, cities and services.

## Notifications and payments

- Every panel has a bell in the top right. New events pop up as a toast and are stored in the bell's history (unread ones are highlighted; "Mark all read" clears the badge). Events covered: new bookings and job requests, accepted / started / completed jobs, delays, cancellations, payments, feedback, staff registrations and approvals, and weekly payouts.
- When a staff member completes a job, the customer sees **Payment due** with two options, **UPI** or **Cash**. Once paid, the staff member and the super admin both get a "Payment received" notification, and the booking shows **Paid · UPI** or **Paid · Cash** in their panels.
- UPI records the payment and a reference number; it is not connected to a real payment gateway yet.
- Weekly settlement only pays out jobs the customer has already paid for.
