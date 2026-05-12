-- Phase 0: customer finance isolation hardening.
--
-- Customer / owner / portal stakeholder surfaces must never read internal
-- project cost items. Commercial customer amounts must live in explicit
-- customer-facing estimate/change-order models, not project_cost_items.

update public.projects
set client_show_budget_summary = false
where client_show_budget_summary is true;

alter table public.projects
  alter column client_show_budget_summary set default false;

comment on column public.projects.client_show_budget_summary is
  'Deprecated by Phase 0 customer finance isolation. Customer portal must not expose internal planned/actual budget totals.';

drop policy if exists project_cost_items_select_portal on public.project_cost_items;
drop policy if exists project_cost_items_write_internal on public.project_cost_items;

create policy project_cost_items_internal_select on public.project_cost_items
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  );

create policy project_cost_items_internal_insert on public.project_cost_items
  for insert with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  );

create policy project_cost_items_internal_update on public.project_cost_items
  for update using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  ) with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  );

create policy project_cost_items_internal_delete on public.project_cost_items
  for delete using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  );
