-- Step 11 closure: replace "reviewed" with "rejected" for explicit governance.
-- Migrate existing reviewed → rejected; update constraint.

update public.worker_reports set status = 'rejected' where status = 'reviewed';

alter table public.worker_reports drop constraint if exists worker_reports_status_check;
alter table public.worker_reports add constraint worker_reports_status_check
  check (status in ('draft','submitted','approved','rejected','changes_requested'));

comment on column public.worker_reports.reviewed_at is 'Set when manager sets status to approved/rejected/changes_requested';
