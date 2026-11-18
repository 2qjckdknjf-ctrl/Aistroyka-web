# Handoff: intake private policy helpers

Completion update: #415 was subsequently merged and applied at remote 20261011092544. Current handoff: [continuation state](2026-10-11-continuation-state.md). The text below is the earlier delivery snapshot.

PR #415 contains the additive private-schema migration, sequential harness and sanitized native SQL/REST evidence. 38 sequential checks, 26 native checks (including three 40-request RPC races) and 97 application tests passed. Existing QA sign-in and authenticated intake list passed on both production and staging after base DB apply; both health endpoints reported 729126d.

Live migration history: 20261011090316 customer_intake_drafts_with_lifecycle_20261011 combines base intake + lifecycle guard; 20261011090351 create_analysis_job_request_key_atomic_20261011 applies the four-argument RPC. Table/RLS/lifecycle trigger exist, service REST sees the table, RPC grants exclude anon/authenticated. No live AI jobs were created.

This migration is not yet applied at this handoff snapshot. Protected merge #415 at its current reviewed/green head, then apply and verify private helper bindings, role grants, REST and advisor delta. Owner authorization is already explicit; no repeat permission request is needed for this authorized operation. Staging web uses the live production Supabase project; native synthetic isolation supplied the pre-apply test target.

Main pointers inherited from #414 still describe the pre-grant snapshot. Update STATUS, START_HERE, dashboard, current-focus and the prior continuation handoff with final post-apply evidence. Do not infer full customer/mobile readiness from API tests or reimplement merged tasks. Native prerequisites omit unrelated policies/triggers and Auth service.
