-- Phase 6: proof pack share links.
-- Tokenized, project-scoped, revocable. Payload is assembled in app code with customer-safe projections.

create table if not exists public.proof_pack_shares (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  token text not null unique,
  title text,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_proof_pack_shares_project
  on public.proof_pack_shares(tenant_id, project_id, created_at desc);

create index if not exists idx_proof_pack_shares_token
  on public.proof_pack_shares(token)
  where revoked_at is null;

alter table public.proof_pack_shares enable row level security;

drop policy if exists proof_pack_shares_internal on public.proof_pack_shares;

create policy proof_pack_shares_internal on public.proof_pack_shares
  for all using (public.is_internal_tenant_reader_for_tenant(tenant_id))
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

comment on table public.proof_pack_shares is
  'Tokenized Proof Pack share links. Public token route must return customer-safe projections only.';
