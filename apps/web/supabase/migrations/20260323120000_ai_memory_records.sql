-- AI Brain Phase C: Scoped memory layer.
-- Additive table. Memory is assistive context, not canonical product truth.

create table if not exists public.ai_memory_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  memory_type text not null check (memory_type in ('session', 'project_working', 'user_preference', 'learning_candidate')),
  scope text not null check (scope in ('tenant', 'project', 'user', 'session')),
  source_kind text not null check (source_kind in ('system_derived', 'human_confirmed', 'ai_suggested', 'ai_inferred', 'action_outcome')),
  source_ref text,
  title text not null,
  body jsonb not null default '{}',
  facts_used text[] default '{}',
  grounding_refs text[] default '{}',
  confidence text not null check (confidence in ('high', 'medium', 'low')) default 'medium',
  expires_at timestamptz,
  status text not null check (status in ('active', 'stale', 'superseded', 'expired', 'rejected')) default 'active',
  superseded_by uuid references public.ai_memory_records(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_memory_records_tenant_project_type_status
  on public.ai_memory_records(tenant_id, project_id, memory_type, status)
  where status = 'active';

create index if not exists idx_ai_memory_records_tenant_user_type
  on public.ai_memory_records(tenant_id, user_id, memory_type)
  where status = 'active';

create index if not exists idx_ai_memory_records_expires
  on public.ai_memory_records(expires_at)
  where expires_at is not null and status = 'active';

alter table public.ai_memory_records enable row level security;

drop policy if exists ai_memory_records_select on public.ai_memory_records;
drop policy if exists ai_memory_records_insert on public.ai_memory_records;
drop policy if exists ai_memory_records_update on public.ai_memory_records;

create policy ai_memory_records_select on public.ai_memory_records for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

create policy ai_memory_records_insert on public.ai_memory_records for insert with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

create policy ai_memory_records_update on public.ai_memory_records for update using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
