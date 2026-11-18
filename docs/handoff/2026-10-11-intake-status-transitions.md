# Handoff — intake status transitions

Branch: fix/customer-intake-status-transitions-2026-10-11, based on origin/main 31b21bd4. New additive migration: apps/web/supabase/migrations/20261011080113_harden_customer_intake_status_transitions.sql. Generated with Supabase CLI migration new.

Baseline direct-write bypass reproduced locally, then prevented after applying the new migration in in-memory PostgreSQL. 34 checks PASS; harness scripts/ops/verify_intake_lifecycle_postgres.mjs and evidence docs/reports/intake-lifecycle-2026-10-11/results.json. Remote database untouched.

Existing docs PR #410 contains refreshed intake contract, local SQL evidence and included-PR closures #347/#351. #410 and this runtime fix require independent reviewer approval on current HEAD; Chrome is blocked by locked Mac. Permission for an isolated Supabase test branch is also pending. Do not apply to shared production project until separate gate passes.
