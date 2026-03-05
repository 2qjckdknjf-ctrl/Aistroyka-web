-- Event stream and analytics (Phase 5.5). Append-only events.

create table if not exists public.events (
  id bigserial primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid,
  trace_id text,
  client_profile text,
  event text not null,
  ts timestamptz not null default now(),
  props jsonb
);

create index if not exists idx_events_tenant_ts on public.events(tenant_id, ts desc);
create index if not exists idx_events_event_ts on public.events(event, ts desc);

alter table public.events enable row level security;

create policy events_admin on public.events for select using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner','admin'))
  or tenant_id in (select id from public.tenants where user_id = auth.uid())
);

-- Insert via service_role only (app emits events).
create policy events_insert on public.events for insert with check (false);
