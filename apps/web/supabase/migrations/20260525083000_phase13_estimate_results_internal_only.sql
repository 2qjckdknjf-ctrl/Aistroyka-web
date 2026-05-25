-- Phase 13 hotfix: project_estimate_results are internal finance intelligence.
-- Stakeholder/customer surfaces must not read this table directly.

drop policy if exists project_estimate_results_tenant on public.project_estimate_results;
drop policy if exists project_estimate_results_select_portal on public.project_estimate_results;
drop policy if exists project_estimate_results_write_internal on public.project_estimate_results;

create policy project_estimate_results_select_internal
on public.project_estimate_results
for select
using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

create policy project_estimate_results_write_internal
on public.project_estimate_results
for all
using (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
)
with check (
  public.is_internal_tenant_reader_for_tenant(tenant_id)
);

comment on table public.project_estimate_results is
  'Internal estimate intelligence (manager/internal only).';
