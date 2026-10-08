-- One first-open row per tenant, user, and notification.
create unique index if not exists audit_logs_notification_opened_once
  on public.audit_logs (tenant_id, user_id, resource_id)
  where action = 'notification_opened' and resource_id is not null;
