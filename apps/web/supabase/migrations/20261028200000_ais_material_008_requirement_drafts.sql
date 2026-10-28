-- AIS-MATERIAL-008 thin slice: material requirement drafts + dated supplier quote drafts.
-- Draft comparison only. No order, payment, or supplier messaging.
-- Contractor-internal. Never portal/customer-facing.

create table if not exists public.material_requirement_drafts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  acceptance_decision_id uuid not null
    references public.quantity_acceptance_decisions (id) on delete restrict,
  work_quantity text not null,
  consumption text,
  waste text,
  pack_coverage text,
  material_need text,
  pack_count text,
  purchase_quantity text,
  issues text[] not null default '{}'::text[],
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, project_id, acceptance_decision_id)
);

create index if not exists material_requirement_drafts_project_idx
  on public.material_requirement_drafts (tenant_id, project_id, created_at desc);

comment on table public.material_requirement_drafts is
  'AIS-MATERIAL-008 contractor-internal material need draft from accepted quantity; not an order.';

create table if not exists public.material_supplier_quote_drafts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  material_requirement_draft_id uuid not null
    references public.material_requirement_drafts (id) on delete cascade,
  supplier_name text not null check (char_length(supplier_name) between 1 and 200),
  sku text check (sku is null or char_length(sku) between 1 and 100),
  package_label text check (package_label is null or char_length(package_label) between 1 and 200),
  unit_price_minor text not null check (unit_price_minor ~ '^(0|[1-9][0-9]*)$'),
  currency text not null default 'EUR' check (currency = 'EUR'),
  coverage_quantity text,
  region text check (region is null or char_length(region) between 1 and 100),
  shipping_note text check (shipping_note is null or char_length(shipping_note) <= 500),
  stock_status text not null default 'unknown'
    check (stock_status in ('unknown', 'in_stock', 'out_of_stock', 'lead_time')),
  lead_time_days integer check (lead_time_days is null or lead_time_days >= 0),
  quote_dated_at date not null,
  quote_expires_at date,
  provenance_note text check (provenance_note is null or char_length(provenance_note) <= 500),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists material_supplier_quote_drafts_req_idx
  on public.material_supplier_quote_drafts (tenant_id, material_requirement_draft_id, created_at desc);

comment on table public.material_supplier_quote_drafts is
  'AIS-MATERIAL-008 dated supplier quote draft for comparison only; unknown stock must not imply available.';

alter table public.material_requirement_drafts enable row level security;
alter table public.material_supplier_quote_drafts enable row level security;

revoke all on table public.material_requirement_drafts from public, anon;
revoke all on table public.material_supplier_quote_drafts from public, anon;
grant select, insert on table public.material_requirement_drafts to authenticated;
grant select, insert on table public.material_supplier_quote_drafts to authenticated;
grant all on table public.material_requirement_drafts to service_role;
grant all on table public.material_supplier_quote_drafts to service_role;

drop policy if exists material_requirement_drafts_select on public.material_requirement_drafts;
create policy material_requirement_drafts_select on public.material_requirement_drafts
  for select using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists material_requirement_drafts_insert on public.material_requirement_drafts;
create policy material_requirement_drafts_insert on public.material_requirement_drafts
  for insert with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists material_supplier_quote_drafts_select on public.material_supplier_quote_drafts;
create policy material_supplier_quote_drafts_select on public.material_supplier_quote_drafts
  for select using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists material_supplier_quote_drafts_insert on public.material_supplier_quote_drafts;
create policy material_supplier_quote_drafts_insert on public.material_supplier_quote_drafts
  for insert with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
