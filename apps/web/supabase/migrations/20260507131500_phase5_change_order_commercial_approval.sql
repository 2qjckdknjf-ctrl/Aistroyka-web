-- Phase 5: customer-facing change order commercial approval fields.
-- Internal implementation cost remains in project_cost_items and is not exposed to customers.

alter table public.project_change_orders
  add column if not exists reason text,
  add column if not exists customer_amount_delta numeric(14,2) check (customer_amount_delta is null or customer_amount_delta >= 0),
  add column if not exists currency text not null default 'RUB',
  add column if not exists linked_customer_estimate_id uuid references public.customer_estimates(id) on delete set null,
  add column if not exists internal_cost_item_id uuid references public.project_cost_items(id) on delete set null,
  add column if not exists approved_by_customer uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz;

comment on column public.project_change_orders.customer_amount_delta is
  'Customer-facing commercial change amount. Never internal implementation cost.';

comment on column public.project_change_orders.internal_cost_item_id is
  'Internal manager-only cost linkage. Must not be exposed to customer APIs.';
