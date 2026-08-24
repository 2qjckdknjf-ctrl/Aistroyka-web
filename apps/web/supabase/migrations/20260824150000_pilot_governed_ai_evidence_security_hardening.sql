-- Forward-fix security hardening for staging (server-owned writes, visibility guard, policy split).

-- Remove legacy broad / client-writable policies if present from earlier staging apply.
drop policy if exists visual_evidence_tenant_internal on public.visual_evidence_records;
drop policy if exists ai_action_audit_tenant_insert on public.ai_action_audit_records;
drop policy if exists report_completeness_tenant on public.report_completeness_evaluations;
drop policy if exists report_completeness_tenant_write on public.report_completeness_evaluations;

drop policy if exists visual_evidence_internal_select on public.visual_evidence_records;
drop policy if exists visual_evidence_worker_insert on public.visual_evidence_records;
drop policy if exists visual_evidence_worker_update on public.visual_evidence_records;
drop policy if exists visual_evidence_manager_update on public.visual_evidence_records;
drop policy if exists visual_evidence_stakeholder_read on public.visual_evidence_records;
drop policy if exists ai_action_audit_tenant_read on public.ai_action_audit_records;
drop policy if exists ai_action_audit_service_role on public.ai_action_audit_records;
drop policy if exists report_completeness_tenant_read on public.report_completeness_evaluations;
drop policy if exists report_completeness_service_role on public.report_completeness_evaluations;

create policy visual_evidence_internal_select on public.visual_evidence_records
  for select to authenticated using (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'manager', 'member', 'worker')
    )
  );

create policy visual_evidence_worker_insert on public.visual_evidence_records
  for insert to authenticated with check (
    owner_visible = false
    and manager_verified = false
    and tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'manager', 'member', 'worker')
    )
  );

create policy visual_evidence_worker_update on public.visual_evidence_records
  for update to authenticated using (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'manager', 'member', 'worker')
    )
  ) with check (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'manager', 'member', 'worker')
    )
  );

create policy visual_evidence_manager_visibility_update on public.visual_evidence_records
  for update to authenticated using (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'manager')
    )
  ) with check (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'manager')
    )
  );

create policy visual_evidence_stakeholder_read on public.visual_evidence_records
  for select to authenticated using (
    owner_visible = true
    and internal_only = false
    and retention_state = 'active'
    and tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
    )
    and (
      project_id in (
        select ps.project_id from public.project_stakeholders ps
        where ps.user_id = (select auth.uid()) and ps.status = 'active'
      )
      or project_id in (
        select pm.project_id from public.project_members pm
        where pm.user_id = (select auth.uid()) and pm.role = 'owner'
      )
    )
  );

create policy ai_action_audit_tenant_read on public.ai_action_audit_records
  for select to authenticated using (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'manager')
    )
  );

create policy ai_action_audit_service_role on public.ai_action_audit_records
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy report_completeness_tenant_read on public.report_completeness_evaluations
  for select to authenticated using (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
    )
  );

create policy report_completeness_service_role on public.report_completeness_evaluations
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.guard_visual_evidence_visibility_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  is_manager boolean;
begin
  if auth.role() = 'service_role' then
    return NEW;
  end if;

  select exists (
    select 1 from public.tenant_members tm
    where tm.user_id = auth.uid()
      and tm.tenant_id = NEW.tenant_id
      and tm.role in ('owner', 'admin', 'manager')
  ) into is_manager;

  if TG_OP = 'INSERT' then
    if not is_manager then
      NEW.owner_visible := false;
      NEW.manager_verified := false;
    end if;
    return NEW;
  end if;

  if TG_OP = 'UPDATE' and not is_manager then
    if NEW.owner_visible is distinct from OLD.owner_visible
       or NEW.manager_verified is distinct from OLD.manager_verified then
      raise exception 'visual_evidence visibility columns are manager-controlled';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_visual_evidence_visibility_guard on public.visual_evidence_records;
create trigger trg_visual_evidence_visibility_guard
  before insert or update on public.visual_evidence_records
  for each row execute function public.guard_visual_evidence_visibility_columns();
