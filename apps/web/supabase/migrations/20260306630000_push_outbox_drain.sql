-- Push outbox: last_error, next_retry_at for drain job. device_tokens: disabled_at for token hygiene.

alter table public.push_outbox
  add column if not exists last_error text,
  add column if not exists next_retry_at timestamptz;

create index if not exists idx_push_outbox_next_retry
  on public.push_outbox(tenant_id, next_retry_at)
  where status = 'queued';

alter table public.device_tokens
  add column if not exists disabled_at timestamptz;
