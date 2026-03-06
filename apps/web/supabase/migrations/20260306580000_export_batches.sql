-- Data warehouse export pipeline (Phase 6.2). Batches and rows for sinks.

create table if not exists public.export_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  type text not null,
  sink text not null,
  status text not null check (status in ('pending', 'running', 'completed', 'failed')),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.export_rows (
  batch_id uuid not null references public.export_batches(id) on delete cascade,
  seq int not null,
  payload jsonb not null,
  primary key (batch_id, seq)
);

create index if not exists idx_export_batches_tenant_created on public.export_batches(tenant_id, created_at desc);

alter table public.export_batches enable row level security;
alter table public.export_rows enable row level security;

create policy export_batches_tenant on public.export_batches for select using (
  tenant_id in (select id from public.tenants where user_id = auth.uid())
  or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner','admin'))
);
create policy export_rows_via_batch on public.export_rows for select using (
  batch_id in (select id from public.export_batches where tenant_id in (
    select id from public.tenants where user_id = auth.uid()
  ) or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid()))
);

-- Inserts via service_role (export job).
create policy export_batches_insert on public.export_batches for insert with check (false);
create policy export_rows_insert on public.export_rows for insert with check (false);
