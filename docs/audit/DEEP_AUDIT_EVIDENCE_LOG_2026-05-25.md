# Deep Audit Evidence Log — 2026-05-25

## Metadata

- Date: 2026-05-25
- Environment: staging + production
- Operator: Cursor agent + release owner
- Branch/Ref: `main`
- Workflow run URL(s):
  - https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26402956304
  - https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26403104100
  - https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26406727533

## Risk entries covered

- [ ] C-01
- [x] C-02
- [ ] C-03
- [ ] C-04
- [ ] H-01
- [x] H-02
- [ ] H-03
- [x] H-04

## Evidence records

### Record 1

- Risk ID: C-02
- Action performed: Verified staged promotion path from staging into production.
- Command / workflow: Deploy Cloudflare staging `26402956304` and production `workflow_run` `26403104100`.
- Expected result: Production starts only after successful staging.
- Actual result: Production run was triggered as `workflow_run` from successful staging.
- Artifact link (logs/screenshots): https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26403104100
- Verdict: `pass`
- Notes: Production guard proved promotion dependency.

### Record 2

- Risk ID: H-02
- Action performed: Verified staging blocking jobs in hardened workflow.
- Command / workflow: Deploy Cloudflare staging `26402956304`.
- Expected result: Blocking pilot smoke and pilot E2E gate enforce release path.
- Actual result: `pilot-smoke` and `pilot-e2e-audit` jobs completed successfully (E2E job conditionally executed with secret detection and did not fail open).
- Artifact link (logs/screenshots): https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26402956304
- Verdict: `pass`
- Notes: AI Phase 5 gate remains intentionally non-blocking by policy.

### Record 3

- Risk ID: H-04
- Action performed: Verified production cron secret enforcement with configured secret.
- Command / workflow: Manual production deploy run `26406727533`.
- Expected result: Fail-fast guard passes, production deploy proceeds, blocking pilot smoke and stakeholder finance sanity pass.
- Actual result: All checks passed including `Require CRON_SECRET for production rollout`, `pilot-smoke`, and `stakeholder-finance-sanity`.
- Artifact link (logs/screenshots): https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26406727533
- Verdict: `pass`
- Notes: Prior fail-fast run (`26403104100`) correctly failed when secret was absent.

### Record 4

- Risk ID: C-04
- Action performed: Re-ran full staging->production deploy chain to validate migrations preflight evidence.
- Command / workflow: staging `26410298260`, production `26410422613`.
- Expected result: migration preflight env check executes (not skipped) and passes in both workflows.
- Actual result: migrations preflight job succeeded, but `Check env/config (migrations)` step remained skipped in both runs.
- Artifact link (logs/screenshots): https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26410298260, https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/26410422613
- Verdict: `blocked`
- Notes: `SUPABASE_ACCESS_TOKEN` and/or `SUPABASE_PROJECT_REF` are still absent at workflow runtime.

### Record 5

- Risk ID: H-03
- Action performed: Probed production webhook endpoint without signature.
- Command / workflow: `curl -X POST https://aistroyka.ai/api/v1/webhooks/incoming` with JSON body and no signature headers.
- Expected result: fail-closed rejection for unsigned webhook traffic.
- Actual result: `HTTP 503` with body `Webhook signature enforcement enabled but WEBHOOK_INCOMING_SECRET is not configured`.
- Artifact link (logs/screenshots): production live probe output + endpoint response body.
- Verdict: `pass`
- Notes: Misconfiguration does not degrade to unsigned acceptance; endpoint fails closed.

## Status update proposal

- Risk IDs proposed to move to `closed`: `C-02`, `H-02`, `H-03`, `H-04`
- Rationale: Live run evidence confirms hardened behavior in real deploy workflows.
- Remaining blockers (if any): `C-01`, `C-03`, `C-04`, `H-01`.

## Signoff

- Reviewer: release/security owner
- Approved: pending
- Date: pending
