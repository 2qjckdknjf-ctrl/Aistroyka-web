-- Subscription tier per tenant. Used by subscription.service (getTierForTenant).
alter table public.tenants add column if not exists plan text not null default 'FREE';
comment on column public.tenants.plan is 'Subscription tier: FREE, PRO, ENTERPRISE';
