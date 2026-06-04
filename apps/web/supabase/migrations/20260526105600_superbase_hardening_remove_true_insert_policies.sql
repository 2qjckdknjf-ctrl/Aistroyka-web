drop policy if exists ai_eval_results_insert_authenticated on public.ai_eval_results;
create policy ai_eval_results_insert_authenticated
  on public.ai_eval_results
  for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists ai_improvement_insert on public.ai_improvement_candidates;
create policy ai_improvement_insert
  on public.ai_improvement_candidates
  for insert
  to authenticated
  with check (
    tenant_id is null
    or tenant_id in (
      select tm.tenant_id from public.tenant_members tm where tm.user_id = auth.uid()
    )
  );

drop policy if exists ai_opt_proposals_insert on public.ai_optimization_proposals;
create policy ai_opt_proposals_insert
  on public.ai_optimization_proposals
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.ai_improvement_candidates c
      where c.id = source_candidate_id
        and (
          c.tenant_id is null
          or c.tenant_id in (
            select tm.tenant_id from public.tenant_members tm where tm.user_id = auth.uid()
          )
        )
    )
  );
