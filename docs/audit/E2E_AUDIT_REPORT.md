# E2E Audit Report

## Environment

- Date: 2026-04-26T14:00:16.243Z
- Commit SHA: 17b2b304f575cb14fb2037518683ab47ffcd6f92
- Base URL: https://staging.aistroyka.ai
- Artifact directory: docs/audit/artifacts/20260426T135907Z
- Requested command: `pnpm -w audit:e2e` (available (10.33.2))
- Lint: not run
- Build sanity: not run

## Summary

| Area | Total | Passed | Failed | Intentionally disabled |
| --- | ---: | ---: | ---: | ---: |
| Static dashboard CTA inventory | 909 | n/a | n/a | n/a |
| Runtime Playwright checks | 4 | 3 | 0 | 1 |
| Sync tests | 1 suite | 1 | 0 | 0 |

## Broken Buttons

No broken dashboard CTA failures were reported by the inventory-driven Playwright audit.

Inventory source: `docs/audit/button_inventory.json` and `docs/audit/button_inventory.csv`.

### Fixed Audit Infrastructure Issues

- Root cause: Playwright rejected `test.use({ trace, screenshot })` inside `describe` blocks. Fix: moved audit trace/screenshot settings to top-level test scope/config.
- Root cause: the runner stopped before report generation on failures. Fix: each step now records status, always writes the report, and exits non-zero after report generation when failures remain.

## Sync Findings

- Bootstrap shape verdict: PASS
- Changes/ack stability: PASS
- Idempotency verdict: PASS for report create and ack duplicate-key semantics
- Conflict behavior: best-effort cursor-ahead probe executed when sync suite reached that step; see redacted request evidence.
- Request evidence: `docs/audit/artifacts/20260426T135907Z/sync-e2e-requests.json`



## Remaining Gaps / Next Steps

- No blocking gaps remain from this audit run.

## Verdict

- BUTTON E2E: PASS
- SYNC E2E: PASS
- OVERALL: PASS
