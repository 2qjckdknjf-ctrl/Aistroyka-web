-- Canonical tenant_invitations table (documented in scripts/team-migrations.sql and API routes)
-- but missing from the formal migration chain — base migration only created tenants/tenant_members/projects.

create table if not exists public.tenant_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member', 'viewer')),
  token uuid not null default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_tenant_invitations_token on public.tenant_invitations(token);
create unique index if not exists idx_tenant_invitations_tenant_email on public.tenant_invitations(tenant_id, lower(email));
create index if not exists idx_tenant_invitations_tenant_id on public.tenant_invitations(tenant_id);

alter table public.tenant_invitations enable row level security;

drop policy if exists "tenant_invitations_select" on public.tenant_invitations;
create policy "tenant_invitations_select" on public.tenant_invitations for select using (
  tenant_id in (select public.current_user_tenant_ids())
  or exists (
    select 1 from public.tenants t
    where t.id = tenant_invitations.tenant_id
      and t.user_id = auth.uid()
  )
  or lower(trim(coalesce(tenant_invitations.email, ''))) = lower(trim(coalesce((auth.jwt() ->> 'email')::text, '')))
);

drop policy if exists "tenant_invitations_insert" on public.tenant_invitations;
create policy "tenant_invitations_insert" on public.tenant_invitations for insert with check (
  (
    exists (
      select 1 from public.tenant_members tm
      where tm.tenant_id = tenant_invitations.tenant_id
        and tm.user_id = auth.uid()
        and tm.role in ('owner', 'admin')
    )
    or exists (
      select 1 from public.tenants t
      where t.id = tenant_invitations.tenant_id
        and t.user_id = auth.uid()
    )
  )
  and created_by = auth.uid()
);

drop policy if exists "tenant_invitations_delete" on public.tenant_invitations;
create policy "tenant_invitations_delete" on public.tenant_invitations for delete using (
  exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = tenant_invitations.tenant_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'admin')
  )
  or exists (
    select 1 from public.tenants t
    where t.id = tenant_invitations.tenant_id
      and t.user_id = auth.uid()
  )
  or lower(trim(coalesce(tenant_invitations.email, ''))) = lower(trim(coalesce((auth.jwt() ->> 'email')::text, '')))
);

grant select, insert, delete on public.tenant_invitations to authenticated;

comment on table public.tenant_invitations is
  'Pending email invitations to a tenant; POST /api/tenant/accept-invite upserts tenant_members and deletes the row.';
