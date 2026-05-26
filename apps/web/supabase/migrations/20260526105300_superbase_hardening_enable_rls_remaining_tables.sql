-- Enable RLS and add minimal safe policies for previously RLS-disabled tables.

-- RBAC dictionaries: authenticated read-only
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

drop policy if exists roles_select_authenticated on public.roles;
create policy roles_select_authenticated
  on public.roles
  for select
  to authenticated
  using (true);

drop policy if exists permissions_select_authenticated on public.permissions;
create policy permissions_select_authenticated
  on public.permissions
  for select
  to authenticated
  using (true);

drop policy if exists role_permissions_select_authenticated on public.role_permissions;
create policy role_permissions_select_authenticated
  on public.role_permissions
  for select
  to authenticated
  using (true);

-- Circuit breaker health table: service-role only
alter table public.ai_provider_health enable row level security;
drop policy if exists ai_provider_health_deny_all on public.ai_provider_health;
create policy ai_provider_health_deny_all
  on public.ai_provider_health
  for all
  using (false)
  with check (false);

-- Eval registry/results: authenticated access (no anon); keeps existing eval routes functional.
alter table public.ai_eval_cases enable row level security;
drop policy if exists ai_eval_cases_select_authenticated on public.ai_eval_cases;
create policy ai_eval_cases_select_authenticated
  on public.ai_eval_cases
  for select
  to authenticated
  using (true);

alter table public.ai_eval_results enable row level security;
drop policy if exists ai_eval_results_select_authenticated on public.ai_eval_results;
create policy ai_eval_results_select_authenticated
  on public.ai_eval_results
  for select
  to authenticated
  using (true);

drop policy if exists ai_eval_results_insert_authenticated on public.ai_eval_results;
create policy ai_eval_results_insert_authenticated
  on public.ai_eval_results
  for insert
  to authenticated
  with check (true);

-- Optimization tables: tenant-scoped via linked proposal tenant.
alter table public.ai_optimization_packages enable row level security;
drop policy if exists ai_opt_packages_tenant_select on public.ai_optimization_packages;
create policy ai_opt_packages_tenant_select
  on public.ai_optimization_packages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.ai_optimization_proposals p
      where p.id = proposal_id
        and (
          p.tenant_id is null
          or p.tenant_id in (
            select tm.tenant_id from public.tenant_members tm where tm.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists ai_opt_packages_tenant_insert on public.ai_optimization_packages;
create policy ai_opt_packages_tenant_insert
  on public.ai_optimization_packages
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.ai_optimization_proposals p
      where p.id = proposal_id
        and (
          p.tenant_id is null
          or p.tenant_id in (
            select tm.tenant_id from public.tenant_members tm where tm.user_id = auth.uid()
          )
        )
    )
  );

alter table public.ai_optimization_experiments enable row level security;
drop policy if exists ai_opt_experiments_tenant_select on public.ai_optimization_experiments;
create policy ai_opt_experiments_tenant_select
  on public.ai_optimization_experiments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.ai_optimization_packages pk
      join public.ai_optimization_proposals p on p.id = pk.proposal_id
      where pk.id = package_id
        and (
          p.tenant_id is null
          or p.tenant_id in (
            select tm.tenant_id from public.tenant_members tm where tm.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists ai_opt_experiments_tenant_insert on public.ai_optimization_experiments;
create policy ai_opt_experiments_tenant_insert
  on public.ai_optimization_experiments
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.ai_optimization_packages pk
      join public.ai_optimization_proposals p on p.id = pk.proposal_id
      where pk.id = package_id
        and (
          p.tenant_id is null
          or p.tenant_id in (
            select tm.tenant_id from public.tenant_members tm where tm.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists ai_opt_experiments_tenant_update on public.ai_optimization_experiments;
create policy ai_opt_experiments_tenant_update
  on public.ai_optimization_experiments
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.ai_optimization_packages pk
      join public.ai_optimization_proposals p on p.id = pk.proposal_id
      where pk.id = package_id
        and (
          p.tenant_id is null
          or p.tenant_id in (
            select tm.tenant_id from public.tenant_members tm where tm.user_id = auth.uid()
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.ai_optimization_packages pk
      join public.ai_optimization_proposals p on p.id = pk.proposal_id
      where pk.id = package_id
        and (
          p.tenant_id is null
          or p.tenant_id in (
            select tm.tenant_id from public.tenant_members tm where tm.user_id = auth.uid()
          )
        )
    )
  );

alter table public.ai_optimization_comparisons enable row level security;
drop policy if exists ai_opt_comparisons_tenant_select on public.ai_optimization_comparisons;
create policy ai_opt_comparisons_tenant_select
  on public.ai_optimization_comparisons
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.ai_optimization_experiments ex
      join public.ai_optimization_packages pk on pk.id = ex.package_id
      join public.ai_optimization_proposals p on p.id = pk.proposal_id
      where ex.id = experiment_id
        and (
          p.tenant_id is null
          or p.tenant_id in (
            select tm.tenant_id from public.tenant_members tm where tm.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists ai_opt_comparisons_tenant_insert on public.ai_optimization_comparisons;
create policy ai_opt_comparisons_tenant_insert
  on public.ai_optimization_comparisons
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.ai_optimization_experiments ex
      join public.ai_optimization_packages pk on pk.id = ex.package_id
      join public.ai_optimization_proposals p on p.id = pk.proposal_id
      where ex.id = experiment_id
        and (
          p.tenant_id is null
          or p.tenant_id in (
            select tm.tenant_id from public.tenant_members tm where tm.user_id = auth.uid()
          )
        )
    )
  );

alter table public.ai_optimization_decisions enable row level security;
drop policy if exists ai_opt_decisions_tenant_select on public.ai_optimization_decisions;
create policy ai_opt_decisions_tenant_select
  on public.ai_optimization_decisions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.ai_optimization_proposals p
      where p.id = proposal_id
        and (
          p.tenant_id is null
          or p.tenant_id in (
            select tm.tenant_id from public.tenant_members tm where tm.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists ai_opt_decisions_tenant_insert on public.ai_optimization_decisions;
create policy ai_opt_decisions_tenant_insert
  on public.ai_optimization_decisions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.ai_optimization_proposals p
      where p.id = proposal_id
        and (
          p.tenant_id is null
          or p.tenant_id in (
            select tm.tenant_id from public.tenant_members tm where tm.user_id = auth.uid()
          )
        )
    )
  );

-- Tenant concurrency: access only via SECURITY DEFINER RPCs.
alter table public.tenant_concurrency enable row level security;
drop policy if exists tenant_concurrency_deny_all on public.tenant_concurrency;
create policy tenant_concurrency_deny_all
  on public.tenant_concurrency
  for all
  using (false)
  with check (false);
