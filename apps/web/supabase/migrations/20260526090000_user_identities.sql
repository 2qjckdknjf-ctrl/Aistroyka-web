-- Multi-provider identity links for auth providers (Apple, Telegram).

create table if not exists public.user_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('apple', 'telegram')),
  provider_user_id text not null,
  email text,
  username text,
  full_name text,
  avatar_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);

create index if not exists idx_user_identities_user_id
  on public.user_identities(user_id);

create index if not exists idx_user_identities_provider_user
  on public.user_identities(provider, provider_user_id);

alter table public.user_identities enable row level security;

drop policy if exists user_identities_select_own on public.user_identities;
create policy user_identities_select_own
  on public.user_identities
  for select
  using (user_id = auth.uid());

drop policy if exists user_identities_insert_own on public.user_identities;
create policy user_identities_insert_own
  on public.user_identities
  for insert
  with check (user_id = auth.uid());

drop policy if exists user_identities_update_own on public.user_identities;
create policy user_identities_update_own
  on public.user_identities
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists user_identities_delete_own on public.user_identities;
create policy user_identities_delete_own
  on public.user_identities
  for delete
  using (user_id = auth.uid());

create or replace function public.set_user_identities_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_identities_updated_at on public.user_identities;
create trigger user_identities_updated_at
before update on public.user_identities
for each row execute function public.set_user_identities_updated_at();
