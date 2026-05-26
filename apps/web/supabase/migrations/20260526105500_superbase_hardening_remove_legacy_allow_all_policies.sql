-- Remove legacy permissive ALL policies that bypass RLS.

-- 1) Drop dangerous legacy allow-all policies

drop policy if exists "Allow all for ai_analysis" on public.ai_analysis;
drop policy if exists "Allow all for analysis_jobs" on public.analysis_jobs;
drop policy if exists "Allow all for job_events" on public.job_events;
drop policy if exists "Allow all for media" on public.media;
drop policy if exists "Allow all for projects" on public.projects;
drop policy if exists "Allow all for tenants" on public.tenants;

drop policy if exists "Allow all for ai_cost_events" on public.ai_cost_events;
drop policy if exists "Allow all for billing_snapshots" on public.billing_snapshots;
drop policy if exists "Allow all for payments" on public.payments;
drop policy if exists "Allow all for plans" on public.plans;
drop policy if exists "Allow all for pricing_rules" on public.pricing_rules;
drop policy if exists "Allow all for region_capacity" on public.region_capacity;
drop policy if exists "Allow all for regions" on public.regions;
drop policy if exists "Allow all for system_capacity" on public.system_capacity;
drop policy if exists "Allow all for usage_events" on public.usage_events;
drop policy if exists "Allow all for worker_heartbeat" on public.worker_heartbeat;
drop policy if exists "Allow all for workers" on public.workers;

-- 2) Replace broad *service* placeholders with strict authenticated self-service semantics.

drop policy if exists tenants_insert_service on public.tenants;
drop policy if exists tenants_update_service on public.tenants;

create policy tenants_insert_self
  on public.tenants
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy tenants_update_self
  on public.tenants
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists tenant_members_insert_service on public.tenant_members;
drop policy if exists tenant_members_update_service on public.tenant_members;

create policy tenant_members_insert_self_or_invited
  on public.tenant_members
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      tenant_id in (
        select t.id from public.tenants t where t.user_id = auth.uid()
      )
      or exists (
        select 1
        from public.tenant_invitations ti
        where ti.tenant_id = tenant_members.tenant_id
          and lower(ti.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          and ti.expires_at > now()
      )
    )
  );

create policy tenant_members_update_self
  on public.tenant_members
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists projects_insert_service on public.projects;
drop policy if exists projects_update_service on public.projects;

-- 3) Internal ops/billing/system tables: explicit deny-all (service role bypasses RLS)

drop policy if exists ai_cost_events_deny_all on public.ai_cost_events;
create policy ai_cost_events_deny_all
  on public.ai_cost_events
  for all
  using (false)
  with check (false);

drop policy if exists billing_snapshots_deny_all on public.billing_snapshots;
create policy billing_snapshots_deny_all
  on public.billing_snapshots
  for all
  using (false)
  with check (false);

drop policy if exists payments_deny_all on public.payments;
create policy payments_deny_all
  on public.payments
  for all
  using (false)
  with check (false);

drop policy if exists plans_deny_all on public.plans;
create policy plans_deny_all
  on public.plans
  for all
  using (false)
  with check (false);

drop policy if exists pricing_rules_deny_all on public.pricing_rules;
create policy pricing_rules_deny_all
  on public.pricing_rules
  for all
  using (false)
  with check (false);

drop policy if exists region_capacity_deny_all on public.region_capacity;
create policy region_capacity_deny_all
  on public.region_capacity
  for all
  using (false)
  with check (false);

drop policy if exists regions_deny_all on public.regions;
create policy regions_deny_all
  on public.regions
  for all
  using (false)
  with check (false);

drop policy if exists system_capacity_deny_all on public.system_capacity;
create policy system_capacity_deny_all
  on public.system_capacity
  for all
  using (false)
  with check (false);

drop policy if exists usage_events_deny_all on public.usage_events;
create policy usage_events_deny_all
  on public.usage_events
  for all
  using (false)
  with check (false);

drop policy if exists worker_heartbeat_deny_all on public.worker_heartbeat;
create policy worker_heartbeat_deny_all
  on public.worker_heartbeat
  for all
  using (false)
  with check (false);

drop policy if exists workers_deny_all on public.workers;
create policy workers_deny_all
  on public.workers
  for all
  using (false)
  with check (false);
