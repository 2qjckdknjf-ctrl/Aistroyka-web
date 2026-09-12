-- Align persisted agent-run idempotency with the canonical 24h replay TTL.
-- The original permanent uniqueness constraint prevents legitimate key reuse after
-- expiry. HTTP idempotency remains the response replay layer; run lookup selects the
-- newest fresh completed row and expired matching rows are cleaned before persistence.
-- Code-only migration in this PR: do not apply without the normal owner migration gate.

alter table public.agent_runs
  drop constraint if exists agent_runs_idempotency_unique;

create index if not exists idx_agent_runs_idempotency_lookup
  on public.agent_runs (
    tenant_id,
    project_id,
    actor_user_id,
    idempotency_key,
    created_at desc
  )
  where idempotency_key is not null;

comment on index public.idx_agent_runs_idempotency_lookup is
  'Lookup index for TTL-bounded agent run replay; intentionally non-unique so expired keys can be reused.';
