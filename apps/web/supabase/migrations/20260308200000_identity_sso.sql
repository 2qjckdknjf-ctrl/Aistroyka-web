-- Enterprise identity: OIDC/SAML and SSO sessions (Phase 5.3).

create table if not exists public.identity_providers (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  type text not null check (type in ('oidc', 'saml')),
  issuer text,
  client_id text,
  metadata jsonb,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.sso_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  state text not null,
  nonce text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists idx_sso_sessions_state on public.sso_sessions(state);
create index if not exists idx_sso_sessions_expires on public.sso_sessions(expires_at);

alter table public.identity_providers enable row level security;
alter table public.sso_sessions enable row level security;

create policy identity_providers_read on public.identity_providers for select using (
  tenant_id in (select id from public.tenants where user_id = auth.uid())
  or tenant_id in (select tenant_id from public.tenant_members where user_id = auth.uid())
);
create policy sso_sessions_service on public.sso_sessions for all using (false);
