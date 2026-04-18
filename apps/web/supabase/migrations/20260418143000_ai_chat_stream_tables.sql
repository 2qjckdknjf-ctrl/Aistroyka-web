-- Phase 5: persistent copilot stream chat storage.
-- Required by POST /api/v1/projects/:id/copilot/chat/stream.

create table if not exists public.ai_chat_threads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid,
  title text,
  status text not null default 'active' check (status in ('active', 'archived')),
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_chat_threads_tenant_project_updated
  on public.ai_chat_threads(tenant_id, project_id, updated_at desc);

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  thread_id uuid not null references public.ai_chat_threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  request_id text,
  error_kind text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_chat_messages_thread_created
  on public.ai_chat_messages(thread_id, created_at asc);

create index if not exists idx_ai_chat_messages_tenant_project_created
  on public.ai_chat_messages(tenant_id, project_id, created_at desc);

alter table public.ai_chat_threads enable row level security;
alter table public.ai_chat_messages enable row level security;

drop policy if exists ai_chat_threads_tenant on public.ai_chat_threads;
create policy ai_chat_threads_tenant on public.ai_chat_threads
for all
using (
  tenant_id in (
    select tm.tenant_id
    from public.tenant_members tm
    where tm.user_id = auth.uid()
  )
  or tenant_id in (
    select t.id
    from public.tenants t
    where t.user_id = auth.uid()
  )
)
with check (
  tenant_id in (
    select tm.tenant_id
    from public.tenant_members tm
    where tm.user_id = auth.uid()
  )
  or tenant_id in (
    select t.id
    from public.tenants t
    where t.user_id = auth.uid()
  )
);

drop policy if exists ai_chat_messages_tenant on public.ai_chat_messages;
create policy ai_chat_messages_tenant on public.ai_chat_messages
for all
using (
  tenant_id in (
    select tm.tenant_id
    from public.tenant_members tm
    where tm.user_id = auth.uid()
  )
  or tenant_id in (
    select t.id
    from public.tenants t
    where t.user_id = auth.uid()
  )
)
with check (
  tenant_id in (
    select tm.tenant_id
    from public.tenant_members tm
    where tm.user_id = auth.uid()
  )
  or tenant_id in (
    select t.id
    from public.tenants t
    where t.user_id = auth.uid()
  )
);
