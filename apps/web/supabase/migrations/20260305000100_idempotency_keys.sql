-- Idempotency: same key returns same response. TTL for cleanup.
create table if not exists public.idempotency_keys (
  key text not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  route text not null,
  response jsonb,
  status_code int,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (key)
);

create index if not exists idx_idempotency_keys_expires on public.idempotency_keys(expires_at);

alter table public.idempotency_keys enable row level security;
create policy idempotency_tenant on public.idempotency_keys for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

comment on table public.idempotency_keys is 'x-idempotency-key: return cached response when key matches. TTL cleanup via expires_at.';
