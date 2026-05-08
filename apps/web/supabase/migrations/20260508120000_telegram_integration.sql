-- Phase 10: Telegram notification layer (linking + delivery audit). Service-role only; no authenticated RLS policies.

create table if not exists public.telegram_link_tokens (
  token text primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_telegram_link_tokens_expires
  on public.telegram_link_tokens(expires_at);

comment on table public.telegram_link_tokens is
  'Short-lived deep-link tokens for associating a Telegram chat with an authenticated user (POST /start TOKEN).';

create table if not exists public.user_telegram_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  telegram_user_id text not null,
  telegram_chat_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id),
  unique (telegram_user_id)
);

create index if not exists idx_user_telegram_links_tenant_user
  on public.user_telegram_links(tenant_id, user_id);

comment on table public.user_telegram_links is
  'Maps Supabase users to Telegram identities for customer-safe alerts (no internal finance in payloads).';

create table if not exists public.telegram_delivery_audit (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  recipient_user_id uuid,
  kind text not null,
  ok boolean not null,
  error_text text,
  created_at timestamptz not null default now()
);

create index if not exists idx_telegram_delivery_audit_tenant_created
  on public.telegram_delivery_audit(tenant_id, created_at desc);

comment on table public.telegram_delivery_audit is
  'Best-effort audit of outbound Telegram messages (link flow and notifications).';

alter table public.telegram_link_tokens enable row level security;
alter table public.user_telegram_links enable row level security;
alter table public.telegram_delivery_audit enable row level security;
