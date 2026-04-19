-- Wave 4 Step 11: formal change orders / variations (not ERP, not legal automation).

create table if not exists public.project_change_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in (
    'owner_variation',
    'manager_proposed',
    'document_linked',
    'decision_derived',
    'other'
  )),
  status text not null default 'draft' check (status in (
    'draft',
    'proposed',
    'under_review',
    'approved',
    'rejected',
    'implemented',
    'archived'
  )),
  title text not null,
  description text,
  schedule_impact_level text not null default 'none' check (schedule_impact_level in (
    'none',
    'minor_shift',
    'deadline_shift',
    'major_shift'
  )),
  budget_impact_level text not null default 'none' check (budget_impact_level in (
    'none',
    'minor_increase',
    'major_increase',
    'tbd'
  )),
  schedule_impact_summary text,
  budget_impact_summary text,
  schedule_delta_days integer,
  budget_delta_amount numeric(14, 2),
  linked_discussion_id uuid references public.project_stakeholder_discussions(id) on delete set null,
  linked_document_id uuid references public.project_documents(id) on delete set null,
  linked_request_id uuid references public.project_client_requests(id) on delete set null,
  linked_milestone_id uuid references public.project_milestones(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  implemented_at timestamptz,
  implemented_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_change_orders_project
  on public.project_change_orders(tenant_id, project_id, updated_at desc);

comment on table public.project_change_orders is
  'Formal change orders / variations (Wave 4 Step 11); controlled change-control, not ERP.';

create table if not exists public.project_change_order_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  change_order_id uuid not null references public.project_change_orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_change_order_events_order
  on public.project_change_order_events(change_order_id, created_at asc);

comment on table public.project_change_order_events is
  'Audit trail for change order status transitions.';

alter table public.project_change_orders enable row level security;
alter table public.project_change_order_events enable row level security;

create policy change_orders_select on public.project_change_orders
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or public.is_portal_stakeholder_for_project(project_id)
  );

create policy change_orders_write_internal on public.project_change_orders
  for all using (public.is_internal_tenant_reader_for_tenant(tenant_id))
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy change_order_events_select on public.project_change_order_events
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or public.is_portal_stakeholder_for_project(project_id)
  );

create policy change_order_events_insert_internal on public.project_change_order_events
  for insert with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  );
