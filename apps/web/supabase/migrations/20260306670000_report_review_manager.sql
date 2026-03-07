-- Manager report review: reviewed_at, reviewed_by, manager_note; extend status for approved/reviewed/changes_requested.

alter table public.worker_reports
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists manager_note text;

alter table public.worker_reports drop constraint if exists worker_reports_status_check;
alter table public.worker_reports add constraint worker_reports_status_check
  check (status in ('draft','submitted','approved','reviewed','changes_requested'));

create index if not exists idx_worker_reports_reviewed_at on public.worker_reports(reviewed_at) where reviewed_at is not null;
comment on column public.worker_reports.reviewed_at is 'Set when manager sets status to approved/reviewed/changes_requested';
comment on column public.worker_reports.reviewed_by is 'Manager user_id who performed the review';
comment on column public.worker_reports.manager_note is 'Optional note from manager (e.g. request changes reason)';
