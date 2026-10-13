# Task: authorized database post-apply tails

Baseline 2e2f07da (merged #415). Owner explicitly granted autonomous operational work on 2026-10-11. Intake base/lifecycle, request-key RPC and private helpers are already applied and verified. Security advisors returned to their prior baseline after #415; intake API create/edit/submit/withdraw and negative/idempotent probes passed with exact synthetic-row cleanup.

This focused follow-up pins the existing field daily log timestamp trigger to pg_catalog and covers two new intake foreign keys with leading-column indexes. No policy, billing, auth, or product behavior changes. Read actual live definitions/indexes and verify the new table is small before apply. Preserve existing indexes and migration history. Protected PR, current-head non-author approval and required CI precede live apply.

Acceptance: timestamp trigger uses server time under a hostile caller search_path and retains trigger identity; both intake foreign keys have valid covering indexes; table contents and RLS bindings remain unchanged; advisors no longer report these findings; update operational truth pointers after application.
