-- Device liveness for ops: last_seen updated on sync (ack/changes). Used for devices_offline metric.
alter table public.device_tokens
  add column if not exists last_seen timestamptz not null default now();

create index if not exists idx_device_tokens_tenant_last_seen
  on public.device_tokens(tenant_id, last_seen);
