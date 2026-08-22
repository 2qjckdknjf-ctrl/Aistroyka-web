-- Reconciliation: remote migration 022_protected_day_events (already applied on production).
-- Idempotent snapshot for repo ↔ live parity. Not referenced by apps/web runtime today.

create table if not exists public.protected_day_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  profile_id text not null,
  event_type text not null,
  event_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_protected_day_events_profile_date
  on public.protected_day_events (profile_id, event_date desc);

alter table public.protected_day_events enable row level security;

drop policy if exists protected_day_events_owner_select on public.protected_day_events;
create policy protected_day_events_owner_select on public.protected_day_events
  for select
  using ((auth.uid())::text = user_id);

drop policy if exists protected_day_events_owner_insert on public.protected_day_events;
create policy protected_day_events_owner_insert on public.protected_day_events
  for insert
  with check ((auth.uid())::text = user_id);
