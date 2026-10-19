-- Allow active employees to submit schedules for their own employee record.
-- Administrators can still create schedules for any employee.
-- Run this in Supabase SQL Editor after reviewing your current policies.

drop policy if exists "schedules admin insert" on public.schedules;
drop policy if exists "schedules admin or employee own insert" on public.schedules;

create policy "schedules admin or employee own insert"
on public.schedules
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'
  or (
    employee_id = public.current_employee_id()
    and exists (
      select 1
      from public.employees e
      where e.employee_id = public.schedules.employee_id
        and e.user_id = auth.uid()
        and e.status = 'Active'
    )
  )
);
