-- Forward-fix: wrap auth.role() in service_role RLS policies for initplan performance (additive).
-- Do NOT re-apply migration 20260824150000. Remote apply requires separate owner approval.

drop policy if exists ai_action_audit_service_role on public.ai_action_audit_records;
create policy ai_action_audit_service_role on public.ai_action_audit_records
  for all using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

drop policy if exists report_completeness_service_role on public.report_completeness_evaluations;
create policy report_completeness_service_role on public.report_completeness_evaluations
  for all using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');
