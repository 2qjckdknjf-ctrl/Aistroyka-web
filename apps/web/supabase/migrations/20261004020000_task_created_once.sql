-- One task_created audit row per tenant and task.
-- tenant_id is part of the key so another tenant cannot consume this task id.
create unique index if not exists audit_logs_task_created_once
  on public.audit_logs (tenant_id, resource_id)
  where action = 'task_created'
    and resource_type = 'task'
    and resource_id is not null;
