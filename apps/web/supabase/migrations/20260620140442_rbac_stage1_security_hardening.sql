-- RBAC Stage 1: break-glass foundation + project-scoped project_members RLS.

-- ---------------------------------------------------------------------------
-- Platform break-glass grants (service role / server only; no client policies)
-- ---------------------------------------------------------------------------

create table if not exists public.platform_break_glass_grants (
  id uuid primary key default gen_random_uuid(),
  platform_user_id uuid not null references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  reason text not null,
  scope text not null check (scope in (
    'tenant_metadata',
    'tenant_members',
    'tenant_projects',
    'project_content',
    'support_content'
  )),
  expires_at timestamptz not null,
  approved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint platform_break_glass_grants_expires_after_created
    check (expires_at > created_at)
);

create index if not exists idx_platform_break_glass_active
  on public.platform_break_glass_grants (platform_user_id, tenant_id, expires_at desc)
  where revoked_at is null;

comment on table public.platform_break_glass_grants is
  'Time-bound platform operator access to tenant business content; insert/revoke via service role only.';

alter table public.platform_break_glass_grants enable row level security;

-- ---------------------------------------------------------------------------
-- Project membership visibility: scoped to assigned projects unless tenant admin
-- ---------------------------------------------------------------------------

create or replace function public.can_read_project_membership(p_tenant_id uuid, p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.tenants t
      where t.id = p_tenant_id and t.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.tenant_members tm
      where tm.tenant_id = p_tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
    or exists (
      select 1 from public.project_members pm
      where pm.tenant_id = p_tenant_id
        and pm.project_id = p_project_id
        and pm.user_id = (select auth.uid())
        and pm.status = 'active'
    );
$$;

comment on function public.can_read_project_membership(uuid, uuid) is
  'True for tenant owner/admin or active project member on the project; blocks cross-project enumeration.';

create or replace function public.can_manage_project_membership(p_tenant_id uuid, p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.tenants t
      where t.id = p_tenant_id and t.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.tenant_members tm
      where tm.tenant_id = p_tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
    or exists (
      select 1 from public.project_members pm
      where pm.tenant_id = p_tenant_id
        and pm.project_id = p_project_id
        and pm.user_id = (select auth.uid())
        and pm.status = 'active'
        and pm.role in ('manager', 'owner')
    );
$$;

comment on function public.can_manage_project_membership(uuid, uuid) is
  'True for tenant owner/admin or project manager/owner on the project.';

revoke all on function public.can_read_project_membership(uuid, uuid) from public;
revoke all on function public.can_manage_project_membership(uuid, uuid) from public;
grant execute on function public.can_read_project_membership(uuid, uuid) to authenticated;
grant execute on function public.can_manage_project_membership(uuid, uuid) to authenticated;

drop policy if exists project_members_internal on public.project_members;

create policy project_members_select_scoped on public.project_members
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_read_project_membership(tenant_id, project_id)
  );

create policy project_members_insert_scoped on public.project_members
  for insert with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_manage_project_membership(tenant_id, project_id)
  );

create policy project_members_update_scoped on public.project_members
  for update using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_manage_project_membership(tenant_id, project_id)
  ) with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_manage_project_membership(tenant_id, project_id)
  );

create policy project_members_delete_scoped on public.project_members
  for delete using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_manage_project_membership(tenant_id, project_id)
  );
