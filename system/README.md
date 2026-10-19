# ShiftFlow — Employee Scheduling System

This project uses plain HTML, CSS, JavaScript, and Supabase. Keep the folder structure intact when you copy it to your editor or web host.

## Folder structure

- `index.html` — startup page; always opens the login UI
- `dashboard.html` — dashboard, schedule overview, employee overview
- `schedule.html` — admins assign schedules; active employees submit their own schedules; admins approve/reject/cancel shifts
- `employees.html` — add employees and activate/deactivate records
- `page/login.html` — Supabase email/password login
- `page/register.html` — employee self-registration (creates an employee account; admin activation is required before scheduling)
- `css/style.css` — shared dashboard styling
- `database/supabase.js` — Supabase client and authentication helpers
- `database/setup.sql` — starting database schema and Row Level Security policies
- `script/employee.js` — employee management page behavior
- `script/script.js` and `script/schedule.js` — older unused scripts retained for reference. The current dashboard and schedule page use inline scripts; do not add these legacy files as additional `<script>` tags because they expect a different HTML layout and could bind duplicate or missing events.

## Setup checklist

1. **Back up your existing Supabase project first.** The SQL file creates missing tables and adds some missing columns, then replaces policies with the named ShiftFlow policies. Review it before running against a database that already contains important data.
2. Open Supabase Dashboard → SQL Editor. Review and run `database/setup.sql`.
3. Create an account in Supabase Dashboard → Authentication → Users (or add a registration page if your project requires public sign-up). The current login page intentionally only logs in existing accounts.
4. In Supabase SQL Editor, promote the intended administrator account. Replace the email with the real admin email:

   ```sql
   update public.profiles p
   set role = 'admin'
   from auth.users u
   where p.id = u.id
     and lower(u.email) = lower('admin@example.com');
   ```

5. Open `index.html` to show the login UI first, then sign in using `page/login.html`. After successful login, the app opens `dashboard.html`.
6. Employees may register at `page/register.html`, or an administrator may add them from Employees. Self-registered employee records are created as `Inactive`; an administrator must activate the employee record after verifying registration. Active employees can submit their own schedules; those requests start as `Pending`. Do not link all employees to the administrator account.
7. Create a schedule, verify that overlapping times for the same employee and date are blocked, and approve or reject the pending schedule.
8. Test with an active employee account: it should be able to submit a schedule only for its own employee record. Employees cannot approve/reject/cancel schedules; administrators retain those controls.

## Expected database columns

- `profiles`: `id` (matches `auth.users.id`), `full_name`, `role` (`admin` or `employee`)
- `employees`: `employee_id`, `user_id` (nullable Auth UUID), `full_name`, `position`, `department`, `status` (`Active` or `Inactive`)
- `schedules`: `schedule_id`, `employee_id`, `work_date`, `start_time`, `end_time`, `shift`, `status` (`Pending`, `Approved`, `Cancelled`, or `Rejected`)

The web app expects these table and column names. If your existing database uses different names or column types, adjust the SQL and queries to match instead of blindly running schema changes.

## Security notes

- The Supabase publishable/anon key is intended for browser use. Never put a `service_role` key or any secret key in client-side JavaScript.
- Row Level Security is required; the browser interface is not a security boundary by itself.
- Overlap checks in the browser reduce accidental conflicts but do not prevent two administrators from submitting overlapping shifts at exactly the same time. A database-side constraint or transaction/RPC is recommended for production use.
- Existing duplicate schedules are not automatically deleted. Review them manually in Supabase before removing records.

## Verification performed

The JavaScript files and inline page scripts were checked for syntax errors, and key page IDs and paths were reviewed. A live Supabase login, permissions, and CRUD test cannot be guaranteed from this offline project review; complete the setup and checklist above in your own Supabase project.


## Employee schedule access update

The schedule page now permits both `admin` and `employee` roles. Employees are restricted to their own active employee record in the form, and schedule submissions are marked `Pending`. To enforce this in the database, run the updated `database/setup.sql` in Supabase SQL Editor after backing up/reviewing your existing policies. Run `database/employee_schedule_access.sql` in Supabase SQL Editor to update only the schedule-insert policy; it allows an employee to insert only a schedule linked to their own active employee record. The full `database/setup.sql` is not required just for this permission change.
