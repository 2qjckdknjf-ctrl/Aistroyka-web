-- One task_created audit row per task. Other audit actions are unchanged.
create unique index if not exists audit_logs_task_created_once
  on public.audit_logs (resource_id)
  where action = 'task_created'
    and resource_type = 'task'
    and resource_id is not null;
