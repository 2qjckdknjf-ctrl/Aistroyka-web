-- Wave 4 Step 6: Client decisions / requests — persisted, auditable, tenant-scoped.

create table if not exists public.project_client_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in (
    'approve_or_reject',
    'feedback',
    'acknowledge',
    'choice',
    'document_review'
  )),
  action_mode text not null default 'action_required' check (action_mode in ('action_required', 'info_only')),
  status text not null default 'open' check (status in ('open', 'responded', 'completed', 'cancelled')),
  title text not null,
  instructions text,
  choice_options jsonb,
  linked_entity_type text check (linked_entity_type is null or linked_entity_type in ('document', 'milestone')),
  linked_entity_id uuid,
  requested_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  responded_by uuid references auth.users(id) on delete set null,
  response_value text,
  response_note text,
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_client_requests_project on public.project_client_requests(project_id);
create index if not exists idx_project_client_requests_tenant on public.project_client_requests(tenant_id);
create index if not exists idx_project_client_requests_status on public.project_client_requests(project_id, status);

create table if not exists public.project_client_request_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  request_id uuid not null references public.project_client_requests(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('created', 'responded', 'completed', 'cancelled', 'updated')),
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_client_request_events_request on public.project_client_request_events(request_id);

alter table public.project_client_requests enable row level security;
alter table public.project_client_request_events enable row level security;

create policy project_client_requests_tenant_member on public.project_client_requests for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);

create policy project_client_request_events_tenant_member on public.project_client_request_events for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);

create or replace function public.set_project_client_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists project_client_requests_updated_at on public.project_client_requests;
create trigger project_client_requests_updated_at before update on public.project_client_requests
  for each row execute function public.set_project_client_requests_updated_at();

comment on table public.project_client_requests is 'Explicit client/stakeholder requests (Wave 4 Step 6). Not chat/ticketing.';
comment on table public.project_client_request_events is 'Audit trail for client request state changes.';
