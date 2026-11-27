-- Close direct PostgREST paths identified in PR463/466/469/476/481/483 reviews.
-- Additive authorization repair; never edit applied historical migrations.
-- Keep authenticated reads and intended application write paths.

drop policy if exists quantity_work_specifications_insert on public.quantity_work_specifications;
create policy quantity_work_specifications_insert on public.quantity_work_specifications
  for insert to authenticated with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
    and created_by = (select auth.uid())
  );

drop policy if exists quantity_input_snapshots_insert on public.quantity_input_snapshots;
create policy quantity_input_snapshots_insert on public.quantity_input_snapshots
  for insert to authenticated with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
    and created_by = (select auth.uid())
    and (public.is_tenant_owner_or_admin(tenant_id) or quantity_kind in ('reported', 'measured'))
    and (work_specification_id is null or exists (
      select 1 from public.quantity_work_specifications s
      where s.id = quantity_input_snapshots.work_specification_id
        and s.tenant_id = quantity_input_snapshots.tenant_id
        and s.project_id = quantity_input_snapshots.project_id
    ))
  );

drop policy if exists quantity_calculation_revisions_insert on public.quantity_calculation_revisions;
create policy quantity_calculation_revisions_insert on public.quantity_calculation_revisions
  for insert to authenticated with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.quantity_input_snapshots s
      where s.id = quantity_calculation_revisions.input_snapshot_id
        and s.tenant_id = quantity_calculation_revisions.tenant_id
        and s.project_id = quantity_calculation_revisions.project_id
    )
  );

drop policy if exists quantity_acceptance_decisions_insert on public.quantity_acceptance_decisions;
create policy quantity_acceptance_decisions_insert on public.quantity_acceptance_decisions
  for insert to authenticated with check (
    public.is_tenant_owner_or_admin(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
    and decided_by = (select auth.uid())
    and exists (
      select 1 from public.quantity_calculation_revisions c
      where c.id = quantity_acceptance_decisions.calculation_revision_id
        and c.tenant_id = quantity_acceptance_decisions.tenant_id
        and c.project_id = quantity_acceptance_decisions.project_id
    )
  );

-- Correction provenance is written by the service-only atomic review RPC.
revoke insert, update, delete, truncate, references, trigger
  on public.ai_analysis_corrections from authenticated;
drop policy if exists ai_analysis_corrections_insert on public.ai_analysis_corrections;

drop policy if exists preproject_extraction_runs_insert on public.preproject_extraction_runs;
create policy preproject_extraction_runs_insert on public.preproject_extraction_runs
  for insert to authenticated with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and created_by = (select auth.uid())
    and (project_id is null or public.project_belongs_to_tenant(project_id, tenant_id))
    and (intake_draft_id is null or (project_id is not null and exists (
      select 1 from public.customer_intake_drafts d
      where d.id = preproject_extraction_runs.intake_draft_id
        and d.tenant_id = preproject_extraction_runs.tenant_id
        and (d.project_id is null or d.project_id = preproject_extraction_runs.project_id)
    )))
  );

-- Column privileges preserve original extraction identity/payload, including
-- for a user who legitimately belongs to more than one tenant/project.
revoke update on public.preproject_extraction_runs from authenticated;
grant update(status, error_code, updated_at) on public.preproject_extraction_runs to authenticated;
drop policy if exists preproject_extraction_runs_update on public.preproject_extraction_runs;
create policy preproject_extraction_runs_update on public.preproject_extraction_runs
  for update to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and (project_id is null or public.project_belongs_to_tenant(project_id, tenant_id))
    and (intake_draft_id is null or exists (
      select 1 from public.customer_intake_drafts d
      where d.id = preproject_extraction_runs.intake_draft_id
        and d.tenant_id = preproject_extraction_runs.tenant_id
        and (d.project_id is null or d.project_id = preproject_extraction_runs.project_id)
    ))
  );

drop policy if exists preproject_observations_insert on public.preproject_observations;
create policy preproject_observations_insert on public.preproject_observations
  for insert to authenticated with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and review_status = 'pending' and reviewed_by is null and reviewed_at is null and review_note is null
    and exists (
      select 1 from public.preproject_extraction_runs r
      where r.id = preproject_observations.run_id and r.tenant_id = preproject_observations.tenant_id
    )
  );
revoke update on public.preproject_observations from authenticated;
grant update(label, review_status, reviewed_by, reviewed_at, review_note, updated_at)
  on public.preproject_observations to authenticated;
drop policy if exists preproject_observations_update on public.preproject_observations;
create policy preproject_observations_update on public.preproject_observations
  for update to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and reviewed_by = (select auth.uid()) and reviewed_at is not null
    and review_status in ('accepted', 'rejected', 'edited')
    and exists (
      select 1 from public.preproject_extraction_runs r
      where r.id = preproject_observations.run_id and r.tenant_id = preproject_observations.tenant_id
    )
  );

drop policy if exists construction_completeness_evaluations_insert on public.construction_completeness_evaluations;
create policy construction_completeness_evaluations_insert on public.construction_completeness_evaluations
  for insert to authenticated with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
    and created_by = (select auth.uid())
  );

-- The account-wide suspension boundary applies to reads as well as writes.
drop policy if exists tender_reconciliation_findings_select on public.tender_reconciliation_findings;
create policy tender_reconciliation_findings_select on public.tender_reconciliation_findings
  for select to authenticated using (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and app_private.customer_intake_tenant_account_active(tenant_id)
  );

drop policy if exists tender_reconciliation_findings_insert on public.tender_reconciliation_findings;
create policy tender_reconciliation_findings_insert on public.tender_reconciliation_findings
  for insert to authenticated with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and app_private.customer_intake_tenant_account_active(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
    and created_by = (select auth.uid())
    and status = 'needs_review'
    and reviewed_by is null and reviewed_at is null and review_note is null
  );
revoke update on public.tender_reconciliation_findings from authenticated;
grant update(status, review_note, reviewed_by, reviewed_at, updated_at)
  on public.tender_reconciliation_findings to authenticated;
drop policy if exists tender_reconciliation_findings_update on public.tender_reconciliation_findings;
create policy tender_reconciliation_findings_update on public.tender_reconciliation_findings
  for update to authenticated
  using (public.is_internal_tenant_writer_for_tenant(tenant_id)
    and app_private.customer_intake_tenant_account_active(tenant_id)
    and status in ('open', 'needs_review'))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and app_private.customer_intake_tenant_account_active(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
    and reviewed_by = (select auth.uid()) and reviewed_at is not null
    and status in ('accepted', 'rejected')
  );

-- Trigger functions are not public RPC endpoints; trigger execution is retained.
revoke all on function public.enforce_quantity_work_specification_immutable() from public, anon, authenticated;
revoke all on function public.enforce_quantity_input_snapshot_immutable() from public, anon, authenticated;
revoke all on function public.enforce_quantity_calculation_revision_immutable() from public, anon, authenticated;
revoke all on function public.enforce_quantity_acceptance_decision_immutable() from public, anon, authenticated;
