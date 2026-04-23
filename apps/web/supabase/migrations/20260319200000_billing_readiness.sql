-- Billing readiness architecture (Step 12).
-- Additive only. No changes to legacy billing_customers or entitlements.
-- These tables are readiness-only; they do NOT enforce production billing.

-- Provider-agnostic billing customer (readiness layer).
create table if not exists public.billing_readiness_customers (
  workspace_id uuid primary key references public.tenants(id) on delete cascade,
  provider_customer_ref text,
  billing_email text,
  status text not null default 'none',
  meta jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.billing_readiness_customers is 'Billing readiness: provider-agnostic customer. Readiness-only; no production billing enforcement.';

-- Billing subscriptions (readiness layer).
create table if not exists public.billing_readiness_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.tenants(id) on delete cascade,
  canonical_plan_code text not null,
  billing_provider text not null default 'none',
  provider_subscription_ref text,
  status text not null default 'unknown',
  billing_cycle text not null default 'monthly',
  trial_status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_billing_readiness_subscriptions_workspace
  on public.billing_readiness_subscriptions(workspace_id);
create index if not exists idx_billing_readiness_subscriptions_status
  on public.billing_readiness_subscriptions(workspace_id, status) where ended_at is null;

comment on table public.billing_readiness_subscriptions is 'Billing readiness: provider-agnostic subscription. Readiness-only; no production billing enforcement.';

-- Checkout sessions (readiness layer).
create table if not exists public.billing_readiness_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.tenants(id) on delete cascade,
  target_plan_code text not null,
  requested_billing_cycle text not null default 'monthly',
  status text not null default 'created',
  provider_session_ref text,
  return_url text not null,
  cancel_url text not null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'
);

create index if not exists idx_billing_readiness_checkout_sessions_workspace
  on public.billing_readiness_checkout_sessions(workspace_id);
create index if not exists idx_billing_readiness_checkout_sessions_status
  on public.billing_readiness_checkout_sessions(workspace_id, status);

comment on table public.billing_readiness_checkout_sessions is 'Billing readiness: checkout session records. Readiness-only; no real provider checkout.';

-- Billing events (webhook/ingestion readiness).
create table if not exists public.billing_readiness_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.tenants(id) on delete set null,
  billing_provider text not null default 'none',
  provider_event_ref text,
  event_type text not null,
  event_payload_snapshot jsonb not null default '{}',
  processing_status text not null default 'pending',
  processed_at timestamptz,
  received_at timestamptz not null default now(),
  error_info text
);

create index if not exists idx_billing_readiness_events_workspace
  on public.billing_readiness_events(workspace_id);
create index if not exists idx_billing_readiness_events_processing
  on public.billing_readiness_events(processing_status) where processing_status = 'pending';
create unique index if not exists idx_billing_readiness_events_provider_ref
  on public.billing_readiness_events(billing_provider, provider_event_ref)
  where provider_event_ref is not null;

comment on table public.billing_readiness_events is 'Billing readiness: event ingestion. Idempotency via provider_event_ref. Readiness-only.';

-- Trial state (separate table for clarity).
create table if not exists public.billing_readiness_trial_state (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.tenants(id) on delete cascade,
  kind text not null default 'subscription_trial',
  status text not null default 'not_started',
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  source text not null default 'manual',
  trial_plan_code text not null,
  converted_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_billing_readiness_trial_state_workspace
  on public.billing_readiness_trial_state(workspace_id);

comment on table public.billing_readiness_trial_state is 'Billing readiness: trial lifecycle. Readiness-only; no real trial activation in UI.';

-- RLS: read for tenant members; writes via service_role only (no user policies for insert/update).
alter table public.billing_readiness_customers enable row level security;
alter table public.billing_readiness_subscriptions enable row level security;
alter table public.billing_readiness_checkout_sessions enable row level security;
alter table public.billing_readiness_events enable row level security;
alter table public.billing_readiness_trial_state enable row level security;

create policy billing_readiness_customers_select on public.billing_readiness_customers for select using (
  workspace_id in (select id from public.tenants where user_id = auth.uid())
  or workspace_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy billing_readiness_customers_all on public.billing_readiness_customers for all using (false);

create policy billing_readiness_subscriptions_select on public.billing_readiness_subscriptions for select using (
  workspace_id in (select id from public.tenants where user_id = auth.uid())
  or workspace_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy billing_readiness_subscriptions_all on public.billing_readiness_subscriptions for all using (false);

create policy billing_readiness_checkout_sessions_select on public.billing_readiness_checkout_sessions for select using (
  workspace_id in (select id from public.tenants where user_id = auth.uid())
  or workspace_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy billing_readiness_checkout_sessions_all on public.billing_readiness_checkout_sessions for all using (false);

create policy billing_readiness_events_select on public.billing_readiness_events for select using (
  workspace_id is null or workspace_id in (select id from public.tenants where user_id = auth.uid())
  or workspace_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy billing_readiness_events_all on public.billing_readiness_events for all using (false);

create policy billing_readiness_trial_state_select on public.billing_readiness_trial_state for select using (
  workspace_id in (select id from public.tenants where user_id = auth.uid())
  or workspace_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy billing_readiness_trial_state_all on public.billing_readiness_trial_state for all using (false);
