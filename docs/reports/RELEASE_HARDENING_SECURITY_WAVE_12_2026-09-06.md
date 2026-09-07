# Release Hardening — Security Wave 12

Date: 2026-09-06
Scope: live-schema compatibility for `worker_day.project_id`
Master tracker: #282

## Confirmed live finding

Read-only production Supabase reconciliation found both of the following:

- repository migration `20260407120000_worker_day_project_id.sql` is absent from the live migration ledger;
- `public.worker_day.project_id` is absent from the live table.

The release-hardening candidate already contains `20260906110000_project_ops_tenant_consistency.sql`, which creates `worker_day` RLS policies that reference `project_id` directly. Without a forward compatibility migration, the release migration batch would fail at `110000`.

## Forward fix

Add `20260906109500_bootstrap_worker_day_project_id.sql`, deliberately ordered immediately before `110000`.

It performs only the historical schema delta in idempotent form:

- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS project_id ...`;
- `CREATE INDEX IF NOT EXISTS idx_worker_day_tenant_project ...`;
- column comment.

It does not replay the historical migration and does not create or replace any RLS policy.

## Why forward migration instead of ledger repair/replay

The production migration ledger is historically drifted: some repository migrations are absent even when their schema objects exist, while the aftercare audit found other absent migrations whose objects are genuinely missing. Blind replay based only on ledger absence is therefore unsafe.

This Wave repairs only the schema dependency that is proven missing live and required by the current candidate.

## Regression

`worker-day-project-schema-compat.hardening.test.ts` verifies:

- `109500 < 110000` ordering;
- the bootstrap contains the same idempotent column/index delta as the historical migration;
- it contains no policy changes;
- the later consistency migration really references `worker_day.project_id`.

## Safety

- no production mutation
- no migration apply
- no deploy
- no feature scope
- stacked Draft PR only
- cumulative validation required before release
