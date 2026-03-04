-- Upload sessions for mobile: create session, client uploads to storage, finalize binds to entity.
create table if not exists public.upload_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  purpose text not null,
  status text not null default 'created' check (status in ('created','uploaded','finalized','expired')),
  object_path text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists idx_upload_sessions_tenant_user on public.upload_sessions(tenant_id, user_id);
create index if not exists idx_upload_sessions_expires on public.upload_sessions(expires_at) where status = 'created';

alter table public.upload_sessions enable row level security;
create policy upload_sessions_tenant on public.upload_sessions for all using (
  tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
