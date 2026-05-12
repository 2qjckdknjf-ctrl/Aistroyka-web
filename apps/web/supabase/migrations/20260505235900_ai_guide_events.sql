-- AI Guide telemetry events (luxury guidance analytics).

create table if not exists public.ai_guide_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('open', 'ask', 'quick_prompt', 'action_click')),
  role text not null check (role in ('manager', 'admin', 'client', 'owner')),
  locale text not null check (locale in ('en', 'ru', 'es', 'it')),
  pathname text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_guide_events_tenant_created
  on public.ai_guide_events(tenant_id, created_at desc);

create index if not exists idx_ai_guide_events_tenant_type_created
  on public.ai_guide_events(tenant_id, event_type, created_at desc);

alter table public.ai_guide_events enable row level security;

drop policy if exists ai_guide_events_select on public.ai_guide_events;
drop policy if exists ai_guide_events_insert on public.ai_guide_events;

create policy ai_guide_events_select on public.ai_guide_events for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

create policy ai_guide_events_insert on public.ai_guide_events for insert with check (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);

