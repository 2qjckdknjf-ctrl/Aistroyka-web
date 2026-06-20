-- Stage 2.1: additive accounts foundation.
-- One contractor account per existing tenant; account_members from non-stakeholder tenant_members.
-- Does not change tenant_id RLS, tenant_members, project_members, or project_stakeholders.

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  account_type text not null check (account_type in ('platform', 'contractor', 'client')),
  display_name text not null,
  slug text,
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists idx_accounts_slug_unique
  on public.accounts (slug)
  where slug is not null;

create index if not exists idx_accounts_account_type
  on public.accounts (account_type);

create index if not exists idx_accounts_status
  on public.accounts (status)
  where status = 'active';

comment on table public.accounts is
  'Top-level business identity (platform / contractor / client). Stage 2.1 backfills contractor accounts for existing tenants.';

comment on column public.accounts.account_type is
  'platform = SaaS operator metadata only; contractor = construction company; client = property owner (future).';

-- ---------------------------------------------------------------------------
-- account_members
-- ---------------------------------------------------------------------------

create table if not exists public.account_members (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, user_id)
);

create index if not exists idx_account_members_user_id
  on public.account_members (user_id);

create index if not exists idx_account_members_account_id
  on public.account_members (account_id);

create index if not exists idx_account_members_account_user_active
  on public.account_members (account_id, user_id)
  where status = 'active';

comment on table public.account_members is
  'Account-level membership. Stakeholders are not account members unless explicitly upgraded later.';

-- ---------------------------------------------------------------------------
-- tenants.account_id (nullable during backfill)
-- ---------------------------------------------------------------------------

alter table public.tenants
  add column if not exists account_id uuid references public.accounts (id) on delete restrict;

create index if not exists idx_tenants_account_id
  on public.tenants (account_id);

comment on column public.tenants.account_id is
  'Parent account for this workspace. Stage 2.1: one contractor account per tenant.';

-- ---------------------------------------------------------------------------
-- Backfill: one contractor account per tenant without account_id
-- ---------------------------------------------------------------------------

insert into public.accounts (id, account_type, display_name, slug, status, metadata)
select
  gen_random_uuid(),
  'contractor',
  coalesce(nullif(trim(t.name), ''), 'Workspace'),
  't-' || replace(t.id::text, '-', ''),
  'active',
  jsonb_build_object('backfill_source', 'stage2_1', 'tenant_id', t.id)
from public.tenants t
where t.account_id is null
  and not exists (
    select 1
    from public.accounts a
    where a.slug = 't-' || replace(t.id::text, '-', '')
  );

update public.tenants t
set account_id = a.id
from public.accounts a
where t.account_id is null
  and a.slug = 't-' || replace(t.id::text, '-', '')
  and a.account_type = 'contractor';

-- ---------------------------------------------------------------------------
-- Backfill account_members from tenant_members (exclude stakeholder)
-- ---------------------------------------------------------------------------

insert into public.account_members (account_id, user_id, role, status)
select
  t.account_id,
  tm.user_id,
  tm.role,
  'active'
from public.tenant_members tm
join public.tenants t on t.id = tm.tenant_id
where t.account_id is not null
  and tm.role in ('owner', 'admin', 'member', 'viewer')
on conflict (account_id, user_id) do nothing;

-- Legacy tenants.user_id owner pointer (may not have tenant_members row)
insert into public.account_members (account_id, user_id, role, status)
select
  t.account_id,
  t.user_id,
  'owner',
  'active'
from public.tenants t
where t.account_id is not null
  and t.user_id is not null
on conflict (account_id, user_id) do update
  set role = 'owner',
      status = 'active',
      updated_at = now();

-- ---------------------------------------------------------------------------
-- Enforce NOT NULL when every tenant is linked
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from public.tenants where account_id is null) then
    raise exception 'stage2_1_accounts_foundation: tenants.account_id backfill incomplete';
  end if;

  alter table public.tenants
    alter column account_id set not null;
end $$;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_accounts_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists accounts_updated_at on public.accounts;
create trigger accounts_updated_at
  before update on public.accounts
  for each row execute function public.set_accounts_updated_at();

create or replace function public.set_account_members_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists account_members_updated_at on public.account_members;
create trigger account_members_updated_at
  before update on public.account_members
  for each row execute function public.set_account_members_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.accounts enable row level security;
alter table public.account_members enable row level security;

drop policy if exists accounts_select_member on public.accounts;
create policy accounts_select_member on public.accounts
  for select to authenticated
  using (
    id in (
      select am.account_id
      from public.account_members am
      where am.user_id = (select auth.uid())
        and am.status = 'active'
    )
  );

drop policy if exists accounts_service_all on public.accounts;
create policy accounts_service_all on public.accounts
  for all to authenticated
  using (false)
  with check (false);

drop policy if exists account_members_select_own on public.account_members;
create policy account_members_select_own on public.account_members
  for select to authenticated
  using (user_id = (select auth.uid()) and status = 'active');

drop policy if exists account_members_service_all on public.account_members;
create policy account_members_service_all on public.account_members
  for all to authenticated
  using (false)
  with check (false);

comment on policy accounts_select_member on public.accounts is
  'Users read accounts where they are active account_members. Writes via service role only.';

comment on policy account_members_select_own on public.account_members is
  'Users read only their own active account_membership rows. Writes via service role only.';
