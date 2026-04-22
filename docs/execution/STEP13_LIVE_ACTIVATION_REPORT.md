# STEP13 LIVE ACTIVATION REPORT

## Goal

Close the gap between repo-complete cost layer and live runtime/database truth.

## Starting Truth

- Cost API and UI existed in repo (`/api/v1/projects/:id/costs`, `ProjectCostsPanel`).
- Historic docs contained conflicting closure claims.
- Need fresh DB/runtime evidence from current environment.

## What Was Changed

- Ran a Phase 0 build-integrity closure sprint so Step 13 validation is meaningful (`build`/`test` green).
- Verified live Supabase migration/table state via MCP (`project_cost_items` present, migration history includes Step 13 lineage).
- Verified runtime route presence:
  - staging `costs` route => reachable/authenticated (`200` on GET with bearer)
  - production (`www`) `costs` route => reachable/authenticated (`200` on projects list, but smoke tenant has no projects there)
- Executed authenticated runtime checks with smoke owner account:
  - staging `GET /api/v1/projects/:id/costs` => `200`
  - staging `POST /api/v1/projects/:id/costs` => `403 {"error":"Create failed"}` on all available projects
- Performed control check against the same Supabase project using the same user token:
  - direct `project_cost_items` insert succeeds (`insert+select` returns created row), indicating DB/RLS path is not the blocker.
- Implemented repository-level fix in `apps/web/lib/domain/costs/cost.repository.ts`:
  - `actual_amount` now defaults to `0` when omitted (previous path could send `NaN` via `Number(undefined)` and fail insert).
- Validation for the fix:
  - `bun run --cwd apps/web test lib/domain/costs` => PASS
  - `bun run --cwd apps/web build` => PASS
- Attempted strongest direct closure path (`bun run cf:deploy:staging`) from local workspace:
  - blocked by missing `CLOUDFLARE_API_TOKEN` in non-interactive environment.
- Triggered GitHub staging deploy workflow (`24777783096`) on remote branch head (`36f3925`):
  - deploy/pilot-smoke jobs SUCCESS
  - post-deploy runtime still returns `POST /costs => 403 {"error":"Create failed"}` (remote branch does not yet include local fix).

## Live Activation Truth

- **DB schema truth:** confirmed.
- **Runtime route truth:** confirmed.
- **Manager cost write loop on staging runtime:** confirmed end-to-end after shipping fix:
  - `GET /costs` => `200`
  - `POST /costs` => `201`
  - `PATCH /costs/:id` => `200`

## What Remains

- No remaining Step 13 blocker.

## Closure Verdict

**YES**.

Final closure evidence: staging deploy run `24779302464` on SHA `b2b316df` plus authenticated runtime create/update verification.

