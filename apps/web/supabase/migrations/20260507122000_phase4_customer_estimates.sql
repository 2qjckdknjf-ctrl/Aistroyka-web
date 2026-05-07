-- Phase 4: customer-facing estimates / commercial approvals.
-- Separate from internal project_cost_items and AI cost estimate results.

create table if not exists public.customer_estimates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'approved', 'rejected', 'expired', 'cancelled', 'superseded')),
  total_amount numeric(14,2) not null check (total_amount >= 0),
  currency text not null default 'RUB',
  valid_until date,
  created_by uuid references auth.users(id) on delete set null,
  sent_to_customer_at timestamptz,
  approved_by_customer_at timestamptz,
  rejected_by_customer_at timestamptz,
  customer_note text,
  linked_document_id uuid references public.project_documents(id) on delete set null,
  linked_decision_request_id uuid references public.project_client_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.customer_estimates(id) on delete cascade,
  title text not null,
  description text,
  quantity numeric(14,2) not null default 1 check (quantity > 0),
  unit text not null default 'item',
  unit_price numeric(14,2) not null check (unit_price >= 0),
  total_price numeric(14,2) not null check (total_price >= 0),
  sort_order integer not null default 0
);

create index if not exists idx_customer_estimates_project
  on public.customer_estimates(tenant_id, project_id, updated_at desc);

create index if not exists idx_customer_estimate_items_estimate
  on public.customer_estimate_items(estimate_id, sort_order asc);

alter table public.customer_estimates enable row level security;
alter table public.customer_estimate_items enable row level security;

drop policy if exists customer_estimates_internal_select on public.customer_estimates;
drop policy if exists customer_estimates_portal_select on public.customer_estimates;
drop policy if exists customer_estimates_internal_write on public.customer_estimates;
drop policy if exists customer_estimate_items_internal_select on public.customer_estimate_items;
drop policy if exists customer_estimate_items_portal_select on public.customer_estimate_items;
drop policy if exists customer_estimate_items_internal_write on public.customer_estimate_items;

create policy customer_estimates_internal_select on public.customer_estimates
  for select using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy customer_estimates_portal_select on public.customer_estimates
  for select using (
    public.is_portal_stakeholder_for_project(project_id)
    and status in ('sent', 'approved', 'rejected', 'expired')
  );

create policy customer_estimates_internal_write on public.customer_estimates
  for all using (public.is_internal_tenant_reader_for_tenant(tenant_id))
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy customer_estimate_items_internal_select on public.customer_estimate_items
  for select using (
    exists (
      select 1 from public.customer_estimates e
      where e.id = estimate_id
        and public.is_internal_tenant_reader_for_tenant(e.tenant_id)
    )
  );

create policy customer_estimate_items_portal_select on public.customer_estimate_items
  for select using (
    exists (
      select 1 from public.customer_estimates e
      where e.id = estimate_id
        and public.is_portal_stakeholder_for_project(e.project_id)
        and e.status in ('sent', 'approved', 'rejected', 'expired')
    )
  );

create policy customer_estimate_items_internal_write on public.customer_estimate_items
  for all using (
    exists (
      select 1 from public.customer_estimates e
      where e.id = estimate_id
        and public.is_internal_tenant_reader_for_tenant(e.tenant_id)
    )
  ) with check (
    exists (
      select 1 from public.customer_estimates e
      where e.id = estimate_id
        and public.is_internal_tenant_reader_for_tenant(e.tenant_id)
    )
  );

create or replace function public.set_customer_estimates_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists customer_estimates_updated_at on public.customer_estimates;
create trigger customer_estimates_updated_at
  before update on public.customer_estimates
  for each row execute function public.set_customer_estimates_updated_at();

comment on table public.customer_estimates is 'Customer-facing commercial estimates/proposals. Not internal cost control.';
