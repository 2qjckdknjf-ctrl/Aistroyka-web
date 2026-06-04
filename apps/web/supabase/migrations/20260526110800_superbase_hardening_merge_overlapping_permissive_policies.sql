-- Consolidate overlapping permissive policies to reduce policy fan-out.

-- customer_estimates
-- Replace ALL + extra SELECT policies with explicit CUD + single SELECT(OR).
drop policy if exists customer_estimates_internal_write on public.customer_estimates;
drop policy if exists customer_estimates_internal_select on public.customer_estimates;
drop policy if exists customer_estimates_portal_select on public.customer_estimates;

create policy customer_estimates_select_combined
  on public.customer_estimates
  for select
  using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or (
      public.is_portal_stakeholder_for_project(project_id)
      and status = any (array['sent', 'approved', 'rejected', 'expired'])
    )
  );

create policy customer_estimates_insert_internal
  on public.customer_estimates
  for insert
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy customer_estimates_update_internal
  on public.customer_estimates
  for update
  using (public.is_internal_tenant_reader_for_tenant(tenant_id))
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy customer_estimates_delete_internal
  on public.customer_estimates
  for delete
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

-- customer_estimate_items
-- Replace ALL + extra SELECT policies with explicit CUD + single SELECT(OR).
drop policy if exists customer_estimate_items_internal_write on public.customer_estimate_items;
drop policy if exists customer_estimate_items_internal_select on public.customer_estimate_items;
drop policy if exists customer_estimate_items_portal_select on public.customer_estimate_items;

create policy customer_estimate_items_select_combined
  on public.customer_estimate_items
  for select
  using (
    exists (
      select 1
      from public.customer_estimates e
      where e.id = customer_estimate_items.estimate_id
        and public.is_internal_tenant_reader_for_tenant(e.tenant_id)
    )
    or exists (
      select 1
      from public.customer_estimates e
      where e.id = customer_estimate_items.estimate_id
        and public.is_portal_stakeholder_for_project(e.project_id)
        and e.status = any (array['sent', 'approved', 'rejected', 'expired'])
    )
  );

create policy customer_estimate_items_insert_internal
  on public.customer_estimate_items
  for insert
  with check (
    exists (
      select 1
      from public.customer_estimates e
      where e.id = customer_estimate_items.estimate_id
        and public.is_internal_tenant_reader_for_tenant(e.tenant_id)
    )
  );

create policy customer_estimate_items_update_internal
  on public.customer_estimate_items
  for update
  using (
    exists (
      select 1
      from public.customer_estimates e
      where e.id = customer_estimate_items.estimate_id
        and public.is_internal_tenant_reader_for_tenant(e.tenant_id)
    )
  )
  with check (
    exists (
      select 1
      from public.customer_estimates e
      where e.id = customer_estimate_items.estimate_id
        and public.is_internal_tenant_reader_for_tenant(e.tenant_id)
    )
  );

create policy customer_estimate_items_delete_internal
  on public.customer_estimate_items
  for delete
  using (
    exists (
      select 1
      from public.customer_estimates e
      where e.id = customer_estimate_items.estimate_id
        and public.is_internal_tenant_reader_for_tenant(e.tenant_id)
    )
  );

-- project_commercial_items (SELECT duplicate)
drop policy if exists project_commercial_items_internal_select on public.project_commercial_items;
drop policy if exists project_commercial_items_portal_select on public.project_commercial_items;

create policy project_commercial_items_select_combined
  on public.project_commercial_items
  for select
  using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or (
      public.is_portal_stakeholder_for_project(project_id)
      and status = any (array['issued', 'due', 'overdue', 'paid'])
    )
  );

-- project_stakeholder_discussion_entries (INSERT duplicate)
drop policy if exists stakeholder_discussion_entries_insert_internal on public.project_stakeholder_discussion_entries;
drop policy if exists stakeholder_discussion_entries_insert_portal on public.project_stakeholder_discussion_entries;

create policy stakeholder_discussion_entries_insert_combined
  on public.project_stakeholder_discussion_entries
  for insert
  with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or (
      public.is_portal_stakeholder_for_project(project_id)
      and author_user_id = (select auth.uid())
    )
  );

-- stakeholder_notifications (SELECT duplicate)
drop policy if exists stakeholder_notifications_select_internal on public.stakeholder_notifications;
drop policy if exists stakeholder_notifications_select_own on public.stakeholder_notifications;

create policy stakeholder_notifications_select_combined
  on public.stakeholder_notifications
  for select
  using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or (
      recipient_user_id is not null
      and recipient_user_id = (select auth.uid())
    )
  );

-- tenant_daily_metrics (SELECT duplicate)
drop policy if exists tenant_daily_metrics_admin on public.tenant_daily_metrics;
drop policy if exists tenant_daily_metrics_org_admin on public.tenant_daily_metrics;

create policy tenant_daily_metrics_select_combined
  on public.tenant_daily_metrics
  for select
  using (
    tenant_id in (
      select tm.tenant_id
      from public.tenant_members tm
      where tm.user_id = (select auth.uid())
        and tm.role = any (array['owner', 'admin'])
    )
    or tenant_id in (
      select ot.tenant_id
      from public.organization_tenants ot
      join public.organization_members om
        on om.organization_id = ot.organization_id
      where om.user_id = (select auth.uid())
        and om.org_role = any (array['org_owner', 'org_admin'])
    )
  );
