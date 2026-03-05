-- Billing (Stripe) and entitlements as source of truth (Phase 5.2).

create table if not exists public.billing_customers (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  tier text not null default 'FREE',
  ai_budget_usd numeric,
  max_projects int,
  max_workers int,
  storage_limit_gb int,
  updated_at timestamptz not null default now()
);

create index if not exists idx_billing_customers_stripe_customer on public.billing_customers(stripe_customer_id) where stripe_customer_id is not null;

alter table public.billing_customers enable row level security;
alter table public.entitlements enable row level security;

create policy billing_customers_own on public.billing_customers for select using (
  tenant_id in (select id from public.tenants where user_id = auth.uid())
  or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner','admin'))
);
create policy entitlements_own on public.entitlements for select using (
  tenant_id in (select id from public.tenants where user_id = auth.uid())
  or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

-- Writes only via service_role (webhook / admin).
create policy billing_customers_admin on public.billing_customers for all using (false);
create policy entitlements_admin on public.entitlements for all using (false);
