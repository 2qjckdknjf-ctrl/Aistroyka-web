# Plan-exec delta 2026-11-28 — RESULT

## Base

- Repo: `2qjckdknjf-ctrl/Aistroyka-web`
- Base SHA: `80ffa442` (`origin/main`)
- Branch: `cursor/weekly-delta-exec-2026-11-28`
- Planning: mega-roadmap § Cursor/Codex execution delta — 2026-11-28 (`aab7323a`)

## Done this slice

1. **P0** `replayProjectStateDifferential` — synthetic differential replay for permissions, customer budget, reports, project state; Action Boundary + evidence verdict; no side effects.
2. **P0** `assertCustomerProjectionAllowed` — wires Action Boundary into portal project GET and published-evidence projection (reuses finance key walk).
3. **P0 defects from #533** — portal overview-only nav, notification invalidate, task `returnTo` hardening (files from open PR, rebased onto current main work).
4. **P1** GigaAM + d1.3-ultra → `RESEARCH_DEFER` (no install).

## Tests

```bash
cd apps/web && bunx vitest run \
  lib/platform/ai-governance/differential-replay.test.ts \
  lib/security/customer-finance-guard.test.ts \
  components/canon/portal-navigation-notifications.behavior.test.ts \
  'app/[locale]/(dashboard)/dashboard/tasks/tasks-workspace.utils.test.ts'
```

## Merged

See `MERGE_RECEIPTS_2026-11-28.md`. #560 squash `b2929ef5`; #530 squash `7ffcd0c2`.

## Finish-up (same day, Mode B)

- Hosted integrity migrations **applied** (MCP remotes `20261128204817`–`029`) — see `MIGRATION_APPLY_RECEIPT_2026-11-28.md`.
- Portal/share Action Boundary extended — **#570** → `e53c82a6` (staging/prod Deploy Cloudflare SUCCESS).
- Mode B executed: iOS TestFlight upload SUCCEEDED (build `2026112801`); Android Play internal **draft** committed (`versionCode=2026112801`). Evidence: `MODE_B_UPLOAD_2026-11-28.md`.

## Not done / blocked

| Item | Status | Owner action |
|---|---|---|
| Hosted DB migrations from #553/#554/#556 | **APPLIED** | Receipts on disk |
| Mode B iOS upload | **DONE** (ASC processing async) | Confirm VALID in ASC UI when ready |
| Mode B Android | **DRAFT on internal** | Promote draft→completed in Play Console (completed API rejected) |
| Gemini video key / ZDR / device smoke | OWNER_GATE | Provide keys / ZDR / connect device |
| GigaAM / d1.3 install | RESEARCH_DEFER | License + Silicon + Arena budget |
| Dependabot majors | SKIP | Explicit per-PR review; do not blind-merge |

## Continuation

Promote Play drafts; ASC processing check; Gemini/ZDR/device when owner assets arrive. No further unblocked 2026-11-28 code P0.
