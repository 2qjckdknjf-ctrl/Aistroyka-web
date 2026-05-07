-- Phase 2: customer portal commercial visibility hardening.
--
-- Customers may see only intentionally issued customer-facing commercial records.
-- Draft/cancelled commercial records and commercial event actor history remain internal.

drop policy if exists project_commercial_items_select on public.project_commercial_items;
drop policy if exists project_commercial_items_write_internal on public.project_commercial_items;
drop policy if exists project_commercial_item_events_select on public.project_commercial_item_events;
drop policy if exists project_commercial_item_events_insert_internal on public.project_commercial_item_events;

create policy project_commercial_items_internal_select on public.project_commercial_items
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  );

create policy project_commercial_items_portal_select on public.project_commercial_items
  for select using (
    public.is_portal_stakeholder_for_project(project_id)
    and status in ('issued', 'due', 'overdue', 'paid')
  );

create policy project_commercial_items_internal_insert on public.project_commercial_items
  for insert with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  );

create policy project_commercial_items_internal_update on public.project_commercial_items
  for update using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  ) with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  );

create policy project_commercial_items_internal_delete on public.project_commercial_items
  for delete using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  );

create policy project_commercial_item_events_select_internal on public.project_commercial_item_events
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  );

create policy project_commercial_item_events_insert_internal on public.project_commercial_item_events
  for insert with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  );
