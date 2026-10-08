-- Agent request idempotency reservation.
-- Prevents concurrent retries with the same scoped key from both reaching a paid provider.
-- Code-only migration in this PR: do not apply without the normal owner migration gate.

create table if not exists public.agent_idempotency_claims (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  claim_token uuid not null,
  claimed_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (tenant_id, project_id, actor_user_id, idempotency_key)
);

create index if not exists idx_agent_idempotency_claims_expires
  on public.agent_idempotency_claims(expires_at);

alter table public.agent_idempotency_claims enable row level security;
revoke all on table public.agent_idempotency_claims from public, anon, authenticated;
grant select, insert, update, delete on table public.agent_idempotency_claims to service_role;

create or replace function public.claim_agent_idempotency_key(
  p_tenant_id uuid,
  p_project_id uuid,
  p_actor_user_id uuid,
  p_idempotency_key text,
  p_ttl_seconds integer default 86400
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid := gen_random_uuid();
  v_acquired uuid;
begin
  if p_tenant_id is null or p_project_id is null or p_actor_user_id is null then
    raise exception 'agent_idempotency_scope_required';
  end if;
  if p_idempotency_key is null or btrim(p_idempotency_key) = '' then
    raise exception 'agent_idempotency_key_required';
  end if;
  if p_ttl_seconds <= 0 or p_ttl_seconds > 86400 then
    raise exception 'agent_idempotency_ttl_invalid';
  end if;

  insert into public.agent_idempotency_claims (
    tenant_id,
    project_id,
    actor_user_id,
    idempotency_key,
    claim_token,
    claimed_at,
    expires_at
  ) values (
    p_tenant_id,
    p_project_id,
    p_actor_user_id,
    p_idempotency_key,
    v_token,
    now(),
    now() + make_interval(secs => p_ttl_seconds)
  )
  on conflict (tenant_id, project_id, actor_user_id, idempotency_key)
  do update set
    claim_token = excluded.claim_token,
    claimed_at = excluded.claimed_at,
    expires_at = excluded.expires_at
  where public.agent_idempotency_claims.expires_at <= now()
  returning claim_token into v_acquired;

  return v_acquired;
end;
$$;

create or replace function public.release_agent_idempotency_key(
  p_tenant_id uuid,
  p_project_id uuid,
  p_actor_user_id uuid,
  p_idempotency_key text,
  p_claim_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.agent_idempotency_claims
  where tenant_id = p_tenant_id
    and project_id = p_project_id
    and actor_user_id = p_actor_user_id
    and idempotency_key = p_idempotency_key
    and claim_token = p_claim_token;
  get diagnostics v_deleted = row_count;
  return v_deleted = 1;
end;
$$;

revoke all on function public.claim_agent_idempotency_key(uuid, uuid, uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.claim_agent_idempotency_key(uuid, uuid, uuid, text, integer)
  to service_role;

revoke all on function public.release_agent_idempotency_key(uuid, uuid, uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function public.release_agent_idempotency_key(uuid, uuid, uuid, text, uuid)
  to service_role;

comment on table public.agent_idempotency_claims is
  'Service-role-only reservation preventing concurrent paid Agentic Foundation retries for the same scoped idempotency key.';
