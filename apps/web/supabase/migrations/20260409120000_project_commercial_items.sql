-- Wave 4 Step 21 — commercial / billing control (not ERP, not tax engine).

create table if not exists public.project_commercial_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in (
    'invoice',
    'expected_revenue',
    'deposit',
    'credit_note',
    'other'
  )),
  title text not null,
  description text,
  amount numeric(14, 2) not null,
  currency text not null default 'RUB',
  due_date date,
  status text not null default 'draft' check (status in (
    'draft',
    'issued',
    'due',
    'overdue',
    'paid',
    'cancelled'
  )),
  paid_at timestamptz,
  linked_change_order_id uuid references public.project_change_orders(id) on delete set null,
  linked_document_id uuid references public.project_documents(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_commercial_items_project
  on public.project_commercial_items(tenant_id, project_id, updated_at desc);

create index if not exists idx_project_commercial_items_tenant_status
  on public.project_commercial_items(tenant_id, status);

comment on table public.project_commercial_items is
  'Project-scoped commercial / billing lines (Wave 4 Step 21); not general ledger.';

create table if not exists public.project_commercial_item_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  commercial_item_id uuid not null references public.project_commercial_items(id) on delete cascade,
  event_kind text not null check (event_kind in (
    'created',
    'status_change',
    'payment_recorded',
    'updated'
  )),
  from_status text,
  to_status text,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_commercial_item_events_item
  on public.project_commercial_item_events(commercial_item_id, created_at asc);

comment on table public.project_commercial_item_events is
  'Audit trail for commercial item lifecycle.';

alter table public.project_commercial_items enable row level security;
alter table public.project_commercial_item_events enable row level security;

create policy project_commercial_items_select on public.project_commercial_items
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or public.is_portal_stakeholder_for_project(project_id)
  );

create policy project_commercial_items_write_internal on public.project_commercial_items
  for all using (public.is_internal_tenant_reader_for_tenant(tenant_id))
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy project_commercial_item_events_select on public.project_commercial_item_events
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or public.is_portal_stakeholder_for_project(project_id)
  );

create policy project_commercial_item_events_insert_internal on public.project_commercial_item_events
  for insert with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

create or replace function public.set_project_commercial_items_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists project_commercial_items_updated_at on public.project_commercial_items;
create trigger project_commercial_items_updated_at
  before update on public.project_commercial_items
  for each row execute function public.set_project_commercial_items_updated_at();
