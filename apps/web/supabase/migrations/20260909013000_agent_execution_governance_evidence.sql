-- Agentic Governance P0: persist deterministic authorization/evidence trace per skill step.
-- Additive only. Do not apply independently of the Agentic Foundation migration.

alter table public.agent_run_steps
  add column if not exists governance_evidence jsonb;

comment on column public.agent_run_steps.governance_evidence is
  'Versioned AgentExecutionEvidencePack: policy version, effective capabilities, operation-bound approval and supporting evidence. No secrets or signed URLs.';
