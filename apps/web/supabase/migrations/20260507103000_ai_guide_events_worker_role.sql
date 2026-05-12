-- Allow Worker app telemetry to record role "worker" distinctly from manager dashboard users.

alter table public.ai_guide_events
  drop constraint if exists ai_guide_events_role_check;

alter table public.ai_guide_events
  add constraint ai_guide_events_role_check
  check (role in ('manager', 'admin', 'client', 'owner', 'worker'));
