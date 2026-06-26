# Web buildStamp / Deployment Evidence (2026-06-26)

The mobile apps target the web `/api/v1` backend. If a pilot claim depends on the web runtime, the **deployed** web SHA must be proven — not assumed equal to `main`.

## How to verify (no deploy in this PR)
- Query the health endpoint of the relevant environment: `GET /api/v1/health`.
  - Production canonical domain: `https://aistroyka.ai`.
  - Staging: `https://staging.aistroyka.ai`.
- Record the response fields.

## Expected fields to record
- **`buildStamp.sha7`** — short SHA actually deployed. Compare against the claimed `main` SHA (`17150a05` at time of writing).
- **deployment timestamp** — if present in the payload/headers.
- **environment** — production vs staging (do not conflate).

## Interpretation rule
- The latest `main` commit is **NOT** the deployed commit unless `buildStamp.sha7` (and/or a deployment run record on Cloudflare Workers / Vercel per `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`) confirms it.
- A matching `buildStamp.sha7` is **necessary** evidence for any "main is deployed" statement; a mismatch or missing field means **no deploy claim**.

## Guardrails
- **No deploy** is performed in this PR.
- No staging/production smoke is run here; follow `docs/ops/LIVE_STAGING_SMOKE_RUNBOOK.md` when operator-approved.
- No production GA claim from docs alone.
