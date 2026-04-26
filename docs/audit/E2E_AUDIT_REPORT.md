# E2E Audit Report

## Environment

- Date: 2026-04-26T13:51:23.879Z
- Commit SHA: 08ae2c9400c974c7fb9b9fa43092a9bea3e7a382
- Base URL: local http://127.0.0.1:3000
- Artifact directory: docs/audit/artifacts/20260426T134017Z
- Requested command: `pnpm -w audit:e2e` (available (10.33.2))
- Lint: passed
- Build sanity: failed

## Summary

| Area | Total | Passed | Failed | Intentionally disabled |
| --- | ---: | ---: | ---: | ---: |
| Static dashboard CTA inventory | 909 | n/a | n/a | n/a |
| Runtime Playwright checks | 15 | 11 | 3 | 1 |
| Sync tests | 1 suite | 1 | 0 | 0 |

## Broken Buttons

Playwright button audit did not pass. Review artifacts under `docs/audit/artifacts/20260426T134017Z`, especially `playwright_button_audit.log` and Playwright traces/screenshots.

Inventory source: `docs/audit/button_inventory.json` and `docs/audit/button_inventory.csv`.

### Fixed Audit Infrastructure Issues

- Root cause: Playwright rejected `test.use({ trace, screenshot })` inside `describe` blocks. Fix: moved audit trace/screenshot settings to top-level test scope/config.
- Root cause: the runner stopped before report generation on failures. Fix: each step now records status, always writes the report, and exits non-zero after report generation when failures remain.

## Sync Findings

- Bootstrap shape verdict: PASS
- Changes/ack stability: PASS
- Idempotency verdict: PASS for report create and ack duplicate-key semantics
- Conflict behavior: best-effort cursor-ahead probe executed when sync suite reached that step; see redacted request evidence.
- Request evidence: `docs/audit/artifacts/20260426T134017Z/sync-e2e-requests.json`



## Remaining Gaps / Next Steps

- Resolve failing audit items shown in the artifact logs.
- Re-run `pnpm -w audit:e2e`.

## Verdict

- BUTTON E2E: FAIL
- SYNC E2E: PASS
- OVERALL: FAIL
