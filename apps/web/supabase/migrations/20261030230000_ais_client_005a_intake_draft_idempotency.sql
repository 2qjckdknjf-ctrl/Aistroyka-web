-- AIS-CLIENT-005A: one extraction run per tenant intake draft (when draft id present).
-- Prevents duplicate rooms/work suggestions on repeated confirmation.

create unique index if not exists preproject_extraction_runs_intake_draft_uidx
  on public.preproject_extraction_runs (tenant_id, intake_draft_id)
  where intake_draft_id is not null;

comment on index public.preproject_extraction_runs_intake_draft_uidx is
  'AIS-CLIENT-005A idempotent extraction: at most one run per tenant intake_draft_id.';
