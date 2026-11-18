-- RELEASE HARDENING WAVE 1
-- Close direct PostgREST privilege holes on project membership and commercial writes.

-- ---------------------------------------------------------------------------
-- project_members: block authenticated identity/role escalation
-- ---------------------------------------------------------------------------

create or replace function public.enforce_project_members_privilege_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_tenant_admin boolean;
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
     or new.tenant_id is distinct from old.tenant_id
     or new.project_id is distinct from old.project_id then
    raise exception 'project_members identity columns are immutable for authenticated clients';
  end if;

  if new.role is not distinct from old.role then
    return new;
  end if;

  is_tenant_admin := exists (
    select 1 from public.tenants t
    where t.id = new.tenant_id and t.user_id = (select auth.uid())
  ) or exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = new.tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner', 'admin')
  );

  if not is_tenant_admin then
    raise exception 'project_members.role change requires tenant owner/admin';
  end if;

  return new;
end;
$$;

drop trigger if exists project_members_enforce_privilege_change on public.project_members;
create trigger project_members_enforce_privilege_change
  before update on public.project_members
  for each row
  execute function public.enforce_project_members_privilege_change();

revoke all on function public.enforce_project_members_privilege_change() from public;

comment on function public.enforce_project_members_privilege_change() is
  'Blocks PostgREST self-promotion of project_members.role; tenant owner/admin may change roles.';

-- Project managers can assign operational roles but cannot mint project-owner access.
drop policy if exists project_members_insert_scoped on public.project_members;
create policy project_members_insert_scoped on public.project_members
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    and public.can_manage_project_membership(tenant_id, project_id)
    and (
      role in ('worker', 'contractor', 'manager')
      or exists (
        select 1 from public.tenants t
        where t.id = tenant_id and t.user_id = (select auth.uid())
      )
      or exists (
        select 1 from public.tenant_members tm
        where tm.tenant_id = project_members.tenant_id
          and tm.user_id = (select auth.uid())
          and tm.role in ('owner', 'admin')
      )
    )
  );

-- ---------------------------------------------------------------------------
-- proof_pack_shares: bearer tokens are secrets; manager cohort only
-- ---------------------------------------------------------------------------

drop policy if exists proof_pack_shares_internal on public.proof_pack_shares;
drop policy if exists proof_pack_shares_select_manage on public.proof_pack_shares;
drop policy if exists proof_pack_shares_insert_manage on public.proof_pack_shares;
drop policy if exists proof_pack_shares_update_manage on public.proof_pack_shares;
drop policy if exists proof_pack_shares_delete_manage on public.proof_pack_shares;

create policy proof_pack_shares_select_manage on public.proof_pack_shares
  for select
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id));

create policy proof_pack_shares_insert_manage on public.proof_pack_shares
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.tenant_id = proof_pack_shares.tenant_id
    )
  );

create policy proof_pack_shares_update_manage on public.proof_pack_shares
  for update
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id))
  with check (public.can_manage_project_membership(tenant_id, project_id));

create policy proof_pack_shares_delete_manage on public.proof_pack_shares
  for delete
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id));

-- ---------------------------------------------------------------------------
-- Shared helper: row tenant must match project tenant
-- ---------------------------------------------------------------------------

create or replace function public.project_belongs_to_tenant(p_project_id uuid, p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.tenant_id = p_tenant_id
  );
$$;

revoke all on function public.project_belongs_to_tenant(uuid, uuid) from public;
grant execute on function public.project_belongs_to_tenant(uuid, uuid) to authenticated, service_role;

comment on function public.project_belongs_to_tenant(uuid, uuid) is
  'True when projects.id belongs to the given tenant_id; blocks cross-tenant FK writes.';

-- ---------------------------------------------------------------------------
-- Change orders + events: write requires project manage cohort + tenant match
-- ---------------------------------------------------------------------------

drop policy if exists change_orders_write_internal_insert on public.project_change_orders;
drop policy if exists change_orders_write_internal_update on public.project_change_orders;
drop policy if exists change_orders_write_internal_delete on public.project_change_orders;

create policy change_orders_write_internal_insert on public.project_change_orders
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy change_orders_write_internal_update on public.project_change_orders
  for update
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id))
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy change_orders_write_internal_delete on public.project_change_orders
  for delete
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id));

drop policy if exists change_order_events_insert_internal on public.project_change_order_events;
create policy change_order_events_insert_internal on public.project_change_order_events
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

-- ---------------------------------------------------------------------------
-- Commercial items: same manage cohort + tenant match
-- ---------------------------------------------------------------------------

drop policy if exists project_commercial_items_write_internal on public.project_commercial_items;
drop policy if exists project_commercial_items_internal_insert on public.project_commercial_items;
drop policy if exists project_commercial_items_internal_update on public.project_commercial_items;
drop policy if exists project_commercial_items_internal_delete on public.project_commercial_items;

create policy project_commercial_items_internal_insert on public.project_commercial_items
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_commercial_items_internal_update on public.project_commercial_items
  for update
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id))
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_commercial_items_internal_delete on public.project_commercial_items
  for delete
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id));

drop policy if exists project_commercial_item_events_insert_internal on public.project_commercial_item_events;
create policy project_commercial_item_events_insert_internal on public.project_commercial_item_events
  for insert
  to authenticated
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

-- ---------------------------------------------------------------------------
-- Defects: preserve portal open-defect insert; internal writes require manage cohort
-- ---------------------------------------------------------------------------

drop policy if exists project_defects_insert on public.project_defects;
create policy project_defects_insert on public.project_defects
  for insert
  to authenticated
  with check (
    public.project_belongs_to_tenant(project_id, tenant_id)
    and (
      public.can_manage_project_membership(tenant_id, project_id)
      or (
        public.is_portal_stakeholder_for_project(project_id)
        and created_by = (select auth.uid())
        and status = 'open'::text
        and assigned_to is null
      )
    )
  );

drop policy if exists project_defects_write_internal_update on public.project_defects;
drop policy if exists project_defects_write_internal_delete on public.project_defects;

create policy project_defects_write_internal_update on public.project_defects
  for update
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id))
  with check (
    public.can_manage_project_membership(tenant_id, project_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
  );

create policy project_defects_write_internal_delete on public.project_defects
  for delete
  to authenticated
  using (public.can_manage_project_membership(tenant_id, project_id));
