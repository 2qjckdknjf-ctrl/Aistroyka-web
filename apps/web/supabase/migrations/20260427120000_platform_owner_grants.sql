-- Platform OWNER role (Owner Cabinet): separate from tenant_members.role = 'owner'.
-- Grants are server-side only; no self-service insert/update for authenticated clients.

create table if not exists public.platform_owner_grants (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'OWNER' check (role = 'OWNER'),
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users (id) on delete set null,
  primary key (user_id, role)
);

comment on table public.platform_owner_grants is 'Platform-level OWNER cabinet access; assign only via service role / SQL.';

create index if not exists idx_platform_owner_grants_user on public.platform_owner_grants (user_id);

alter table public.platform_owner_grants enable row level security;

-- Authenticated users may read only their own grant row (used by middleware + server checks).
create policy platform_owner_grants_select_own on public.platform_owner_grants
  for select to authenticated
  using (auth.uid() = user_id);

-- No insert/update/delete for authenticated — grants via service role or migrations only.
