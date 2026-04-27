-- AI Brain Phase D — Seed eval cases.
-- Inserts canonical eval cases when none exist.

do $$
begin
  if (select count(*) from public.ai_eval_cases) = 0 then
    insert into public.ai_eval_cases (title, scenario_type, mode, required_inputs, expected_assertions, grading_strategy, tags, active) values
      ('Executive summary quality', 'project_brief', 'executive_summary', '{"projectId": "required", "hasDocuments": true}'::jsonb, '[{"type": "schema", "path": "summary"}, {"type": "contains", "path": "summary.overview"}, {"type": "score", "minScore": 0.5}]'::jsonb, 'strict', array['executive', 'brief', 'summary'], true),
      ('Project intelligence grounding', 'project_brief', 'project_intelligence', '{"projectId": "required"}'::jsonb, '[{"type": "schema", "path": "insights"}, {"type": "score", "minScore": 0.5}]'::jsonb, 'strict', array['intelligence', 'grounding'], true),
      ('Manager action draft usefulness', 'action_plan', 'manager_assist', '{"projectId": "required", "role": "manager"}'::jsonb, '[{"type": "schema", "path": "drafts"}, {"type": "contains", "path": "drafts[].title"}, {"type": "score", "minScore": 0.4}]'::jsonb, 'lenient', array['action', 'manager', 'draft'], true),
      ('Worker assist usefulness', 'action_plan', 'worker_assist', '{"projectId": "required", "role": "worker"}'::jsonb, '[{"type": "schema", "path": "drafts"}, {"type": "score", "minScore": 0.4}]'::jsonb, 'lenient', array['action', 'worker', 'draft'], true),
      ('Client-safe summary safety', 'project_brief', 'client_safe_summary', '{"projectId": "required"}'::jsonb, '[{"type": "schema", "path": "summary"}, {"type": "refusal", "value": false}, {"type": "score", "minScore": 0.6}]'::jsonb, 'strict', array['client', 'safety', 'summary'], true),
      ('Memory-assisted retrieval quality', 'action_plan', 'manager_assist', '{"projectId": "required", "withMemory": true}'::jsonb, '[{"type": "schema", "path": "memory"}, {"type": "score", "minScore": 0.3}]'::jsonb, 'lenient', array['memory', 'retrieval'], true),
      ('Degradation when data partial', 'project_brief', 'executive_summary', '{"projectId": "required", "dataSufficiency": "partial"}'::jsonb, '[{"type": "degradation", "value": true}, {"type": "schema", "path": "degradationFlags"}]'::jsonb, 'lenient', array['degradation', 'partial'], true),
      ('Refusal when modules incomplete', 'project_brief', 'client_safe_summary', '{"projectId": "required", "modulesComplete": false}'::jsonb, '[{"type": "refusal", "value": true}, {"type": "schema", "path": "withheld"}]'::jsonb, 'strict', array['refusal', 'withholding', 'incomplete'], true);
  end if;
end $$;
