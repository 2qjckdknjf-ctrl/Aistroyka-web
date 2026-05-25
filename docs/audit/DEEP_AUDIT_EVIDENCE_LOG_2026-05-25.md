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

## Status update proposal

- Risk IDs proposed to move to `closed`: `C-02`, `H-02`, `H-04`
- Rationale: Live run evidence confirms hardened behavior in real deploy workflows.
- Remaining blockers (if any): `C-01`, `C-03`, `C-04`, `H-01`, `H-03`.

## Signoff

- Reviewer: release/security owner
- Approved: pending
- Date: pending
