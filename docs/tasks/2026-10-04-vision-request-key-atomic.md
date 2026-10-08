# Vision request_key atomic bind — 2026-10-04

Branch: `feature/vision-request-key-atomic-2026-10-04`. PR: [#385](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/385).

Goal: bind `analysis_jobs.request_key` inside `create_analysis_job` so vision idempotency is one RPC, not a post-insert service-role update.

Scope: 4-arg RPC (`p_request_key` default null), drop 3-arg overload, service_role execute only, vision create path + unit/migration tests. Do not apply `20261004180000_create_analysis_job_request_key.sql` to production in this PR (OWNER_GATE, staging-first).

Acceptance:

- Same key + media reuses the job; key already bound to other media returns 409.
- Concurrent bind of a null-key active job re-reads the winner; mismatched keys raise 23505.
- Exception handler does not return an active job keyed differently from the caller key.

Validation: `bun run --cwd apps/web test --` vision service + engine + this migration test; required CI `check`; non-author current-head approval before merge.
