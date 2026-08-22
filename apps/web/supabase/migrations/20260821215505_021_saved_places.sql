-- Reconciliation: remote migration 021_saved_places (already applied on production).
-- Idempotent snapshot for repo ↔ live parity. Not referenced by apps/web runtime today.

create table if not exists public.saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  place_type text not null,
  lat double precision not null,
  lon double precision not null,
  timezone text,
  created_at timestamptz not null default now()
);

create index if not exists idx_saved_places_user_created
  on public.saved_places (user_id, created_at desc);

alter table public.saved_places enable row level security;

drop policy if exists saved_places_owner_select on public.saved_places;
create policy saved_places_owner_select on public.saved_places
  for select
  using ((auth.uid())::text = user_id);

drop policy if exists saved_places_owner_insert on public.saved_places;
create policy saved_places_owner_insert on public.saved_places
  for insert
  with check ((auth.uid())::text = user_id);

drop policy if exists saved_places_owner_delete on public.saved_places;
create policy saved_places_owner_delete on public.saved_places
  for delete
  using ((auth.uid())::text = user_id);
