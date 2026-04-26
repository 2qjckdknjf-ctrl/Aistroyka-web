# E2E Audit Report

## Environment

- Date: 2026-04-26T13:24:14.285Z
- Commit SHA: f261111bccad6b8469394ddcd4cc178232846d17
- Base URL: http://127.0.0.1:3105
- Artifact directory: docs/audit/artifacts/20260426T131620Z
- Requested command: `pnpm -w audit:e2e` (available (10.33.2))
- Lint: passed
- Build sanity: failed

## Summary

| Area | Total | Passed | Failed | Intentionally disabled |
| --- | ---: | ---: | ---: | ---: |
| Static dashboard CTA inventory | 909 | n/a | n/a | n/a |
| Runtime Playwright checks | 0 | 0 | 0 | 0 |
| Sync tests | 1 suite | 0 | 1 | 0 |

## Broken Buttons

Playwright button audit did not pass. Review artifacts under `docs/audit/artifacts/20260426T131620Z`, especially `playwright_button_audit.log` and Playwright traces/screenshots.

Inventory source: `docs/audit/button_inventory.json` and `docs/audit/button_inventory.csv`.

### Fixed Audit Infrastructure Issues

- Root cause: Playwright rejected `test.use({ trace, screenshot })` inside `describe` blocks. Fix: moved audit trace/screenshot settings to top-level test scope/config.
- Root cause: the runner stopped before report generation on failures. Fix: each step now records status, always writes the report, and exits non-zero after report generation when failures remain.

## Sync Findings

- Bootstrap shape verdict: FAIL or not completed
- Changes/ack stability: FAIL or not completed
- Idempotency verdict: FAIL or not completed
- Conflict behavior: best-effort cursor-ahead probe executed when sync suite reached that step; see redacted request evidence.
- Request evidence: `docs/audit/artifacts/20260426T131620Z/sync-e2e-requests.json`

### Sync Failure Statuses

- POST /api/v1/devices/register: 500
- GET /api/v1/sync/bootstrap: 500
- GET /api/v1/sync/changes?cursor=0&limit=25: 500
- POST /api/v1/worker/report/create: 500
- POST /api/v1/sync/ack: 500
- POST /api/v1/worker/report/create: 500
- POST /api/v1/worker/report/create: 500
- GET /api/v1/sync/changes?cursor=1000000&limit=25: 500

## Remaining Gaps / Next Steps

- Resolve failing audit items shown in the artifact logs.
- Re-run `pnpm -w audit:e2e`.

## Verdict

- BUTTON E2E: FAIL
- SYNC E2E: FAIL
- OVERALL: FAIL
