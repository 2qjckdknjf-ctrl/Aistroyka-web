-- Wave 4 Step 10: structured stakeholder discussions / resolution (not chat).

create table if not exists public.project_stakeholder_discussions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in (
    'document_clarification',
    'milestone_decision',
    'request_followup',
    'general'
  )),
  status text not null default 'open' check (status in (
    'open',
    'awaiting_stakeholder',
    'awaiting_manager',
    'resolved',
    'closed'
  )),
  title text not null,
  context text,
  linked_entity_type text check (linked_entity_type is null or linked_entity_type in ('document', 'milestone', 'client_request')),
  linked_entity_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  resolved_at timestamptz,
  resolution_summary text,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_stakeholder_discussion_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  discussion_id uuid not null references public.project_stakeholder_discussions(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  entry_kind text not null check (entry_kind in (
    'question',
    'clarification',
    'option_selected',
    'feedback',
    'resolution_note'
  )),
  body text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_stakeholder_discussions_project
  on public.project_stakeholder_discussions(tenant_id, project_id, updated_at desc);
create index if not exists idx_stakeholder_discussion_entries_discussion
  on public.project_stakeholder_discussion_entries(discussion_id, created_at asc);

comment on table public.project_stakeholder_discussions is
  'Structured resolution threads (Wave 4 Step 10); not a chat product.';
comment on table public.project_stakeholder_discussion_entries is
  'Auditable structured updates within a stakeholder discussion.';

alter table public.project_stakeholder_discussions enable row level security;
alter table public.project_stakeholder_discussion_entries enable row level security;

-- Discussions: read for internal workspace or portal stakeholders on project
create policy stakeholder_discussions_select on public.project_stakeholder_discussions
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or public.is_portal_stakeholder_for_project(project_id)
  );

-- Create / update / resolve: internal only (application may use service role for controlled stakeholder-driven status updates)
create policy stakeholder_discussions_write_internal on public.project_stakeholder_discussions
  for all using (public.is_internal_tenant_reader_for_tenant(tenant_id))
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

-- Entries: read same cohort as discussions
create policy stakeholder_discussion_entries_select on public.project_stakeholder_discussion_entries
  for select using (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
    or public.is_portal_stakeholder_for_project(project_id)
  );

-- Entries: insert by internal, or by portal stakeholder as themselves
create policy stakeholder_discussion_entries_insert_internal on public.project_stakeholder_discussion_entries
  for insert with check (
    public.is_internal_tenant_reader_for_tenant(tenant_id)
  );

create policy stakeholder_discussion_entries_insert_portal on public.project_stakeholder_discussion_entries
  for insert with check (
    public.is_portal_stakeholder_for_project(project_id)
    and author_user_id = (select auth.uid())
  );
