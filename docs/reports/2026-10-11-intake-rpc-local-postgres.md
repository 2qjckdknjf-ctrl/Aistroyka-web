# Local PostgreSQL verification — 2026-10-11

22 sequential checks PASS using PGlite 0.5.8 in-memory PostgreSQL and synthetic prerequisite tables. Actual repository helper definitions and the two unchanged migration files were executed. No remote database write occurred.

## Evidence

[Harness](local-intake-rpc-evidence-2026-10-11/verify.mjs) · [Results](local-intake-rpc-evidence-2026-10-11/results.json).

RPC: four-argument identity replaces the old overload; legacy three-argument calls remain valid; a request key binds to an existing active job; retry returns the same job; another media or conflicting key raises 23505; cross-tenant media is rejected; anon/authenticated cannot execute.

Intake: active stakeholder creates and reads own draft; another creator cannot read it; viewer and cross-tenant project writes fail; creator identity is immutable; invalid location fails; revoked grants and suspended accounts deny access; anonymous reads return no rows.

The synthetic prerequisites model the real default table/function grants observed read-only on AISTROYKA. The prerequisite schema is deliberately minimal. This does not certify full live schema parity, PostgREST/RPC cache behavior, device scenarios or concurrency. PGlite has one exclusive connection; concurrent same-key tests still require an isolated multi-connection PostgreSQL environment.

## Reproduce

Copy verify.mjs into an empty temporary directory outside the repository, install `@electric-sql/pglite@0.5.8` there, then run `bun verify.mjs /absolute/path/to/repository`. The harness only uses its local in-memory database and writes results.json beside itself. No credentials are required.

## Runtime and remaining gate

Read-only health observation: staging and production both HTTP 200, buildStamp.sha7=813c6ae. #411 is deployed. Live AISTROYKA RPC remains 3-arg and customer_intake_drafts is absent. Staging's public client points at that same production project; no Supabase development branch was present. Remote test-branch creation and live migration application require the outstanding owner decision. Local PASS is not permission to apply live migrations.
