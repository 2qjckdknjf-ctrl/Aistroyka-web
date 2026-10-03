-- Customer intake drafts: structured request state, no AI output.
-- RLS: internal readers may list tenant drafts; portal/customers may see only
-- their own rows, and only while they still have current tenant/project access.

create table if not exists public.customer_intake_drafts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text not null,
  site_context text,
  location jsonb not null default '{}'::jsonb,
  requested_work_type text,
  budget_range text,
  desired_start date,
  desired_end date,
  media_refs jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_intake_tenant_creator
  on public.customer_intake_drafts (tenant_id, created_by);

alter table public.customer_intake_drafts enable row level security;

create or replace function public.customer_intake_has_current_tenant_access(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_internal_tenant_reader_for_tenant(p_tenant_id)
  or exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = (select auth.uid())
  );
$$;

comment on function public.customer_intake_has_current_tenant_access(uuid) is
  'True when auth user currently owns or belongs to the tenant. Used only with created_by = auth.uid(); not a tenant-wide read grant.';

revoke all on function public.customer_intake_has_current_tenant_access(uuid) from public;
grant execute on function public.customer_intake_has_current_tenant_access(uuid) to authenticated;

create or replace function public.customer_intake_project_scope_ok(p_project_id uuid, p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_project_id is null
    or (
      public.project_belongs_to_tenant(p_project_id, p_tenant_id)
      and (
        public.is_internal_tenant_reader_for_tenant(p_tenant_id)
        or public.is_portal_stakeholder_for_project(p_project_id)
      )
    );
$$;

comment on function public.customer_intake_project_scope_ok(uuid, uuid) is
  'Null project is allowed; otherwise the project must belong to the tenant and the caller must be an internal reader or active portal stakeholder on that project.';

revoke all on function public.customer_intake_project_scope_ok(uuid, uuid) from public;
grant execute on function public.customer_intake_project_scope_ok(uuid, uuid) to authenticated;

create or replace function public.customer_intake_drafts_immutable_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if new.tenant_id is distinct from old.tenant_id then
    raise exception 'customer_intake_drafts.tenant_id is immutable';
  end if;
  if new.created_by is distinct from old.created_by then
    raise exception 'customer_intake_drafts.created_by is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists customer_intake_drafts_immutable_identity on public.customer_intake_drafts;
create trigger customer_intake_drafts_immutable_identity
  before update on public.customer_intake_drafts
  for each row
  execute function public.customer_intake_drafts_immutable_identity();

drop policy if exists customer_intake_drafts_select on public.customer_intake_drafts;
create policy customer_intake_drafts_select on public.customer_intake_drafts
  for select
  to authenticated
  using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or (
      created_by = (select auth.uid())
      and public.customer_intake_has_current_tenant_access(tenant_id)
      and public.customer_intake_project_scope_ok(project_id, tenant_id)
    )
  );

drop policy if exists customer_intake_drafts_insert on public.customer_intake_drafts;
create policy customer_intake_drafts_insert on public.customer_intake_drafts
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and public.customer_intake_has_current_tenant_access(tenant_id)
    and public.customer_intake_project_scope_ok(project_id, tenant_id)
  );

drop policy if exists customer_intake_drafts_update on public.customer_intake_drafts;
create policy customer_intake_drafts_update on public.customer_intake_drafts
  for update
  to authenticated
  using (
    created_by = (select auth.uid())
    and public.customer_intake_has_current_tenant_access(tenant_id)
    and public.customer_intake_project_scope_ok(project_id, tenant_id)
  )
  with check (
    created_by = (select auth.uid())
    and public.customer_intake_has_current_tenant_access(tenant_id)
    and public.customer_intake_project_scope_ok(project_id, tenant_id)
  );
