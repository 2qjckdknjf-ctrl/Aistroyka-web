-- Keep internal/service-role tables fully private from anon/authenticated.
-- Service role bypasses RLS, so backend jobs/routes continue to work.

drop policy if exists ai_usage_deny_all on public.ai_usage;
create policy ai_usage_deny_all
  on public.ai_usage
  for all
  using (false)
  with check (false);

drop policy if exists tenant_billing_state_deny_all on public.tenant_billing_state;
create policy tenant_billing_state_deny_all
  on public.tenant_billing_state
  for all
  using (false)
  with check (false);

drop policy if exists contact_leads_deny_all on public.contact_leads;
create policy contact_leads_deny_all
  on public.contact_leads
  for all
  using (false)
  with check (false);

drop policy if exists rate_limit_slots_deny_all on public.rate_limit_slots;
create policy rate_limit_slots_deny_all
  on public.rate_limit_slots
  for all
  using (false)
  with check (false);

drop policy if exists job_sweep_log_deny_all on public.job_sweep_log;
create policy job_sweep_log_deny_all
  on public.job_sweep_log
  for all
  using (false)
  with check (false);
