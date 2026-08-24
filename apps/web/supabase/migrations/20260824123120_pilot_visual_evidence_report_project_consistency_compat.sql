-- Staging compatibility: task-only project resolution for visual evidence (no day-level project column).

create or replace function public.validate_visual_evidence_project_consistency()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  report_project uuid;
begin
  if NEW.report_id is null then
    return NEW;
  end if;

  select wt.project_id into report_project
  from public.worker_reports wr
  inner join public.worker_tasks wt
    on wt.id = wr.task_id and wt.tenant_id = wr.tenant_id
  where wr.id = NEW.report_id
    and wr.tenant_id = NEW.tenant_id
    and wr.task_id is not null;

  if report_project is not null and report_project <> NEW.project_id then
    raise exception 'visual_evidence_records project mismatch for report %', NEW.report_id;
  end if;

  return NEW;
end;
$$;
