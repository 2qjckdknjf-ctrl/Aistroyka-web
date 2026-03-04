-- B2B organization layer: master account can link multiple tenants (Phase 3.3).

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_tenants (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  primary key (organization_id, tenant_id)
);
create index if not exists idx_org_tenants_org on public.organization_tenants(organization_id);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  org_role text not null check (org_role in ('org_owner', 'org_admin', 'org_viewer')),
  primary key (organization_id, user_id)
);
create index if not exists idx_org_members_org on public.organization_members(organization_id);
create index if not exists idx_org_members_user on public.organization_members(user_id);

alter table public.organizations enable row level security;
alter table public.organization_tenants enable row level security;
alter table public.organization_members enable row level security;

-- Org members can read their org and linked tenants (enforced in app; RLS allows read for members).
create policy org_members_select on public.organizations for select using (
  id in (select organization_id from public.organization_members where user_id = auth.uid())
);
create policy org_tenants_select on public.organization_tenants for select using (
  organization_id in (select organization_id from public.organization_members where user_id = auth.uid())
);
create policy org_members_self on public.organization_members for select using (user_id = auth.uid());

-- Allow org admins to read tenant_daily_metrics for tenants linked to their org.
create policy tenant_daily_metrics_org_admin on public.tenant_daily_metrics for select using (
  tenant_id in (
    select ot.tenant_id from public.organization_tenants ot
    join public.organization_members om on om.organization_id = ot.organization_id and om.user_id = auth.uid()
    where om.org_role in ('org_owner', 'org_admin')
  )
);
