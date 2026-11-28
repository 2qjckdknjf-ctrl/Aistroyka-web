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

## Not done / blocked

| Item | Status | Owner action |
|---|---|---|
| Hosted DB migrations from #553/#554/#556 | OWNER_GATE | Fresh migration-history export + `migration_receipts_preflight.py --candidate` then apply |
| Gemini video key / ZDR / Mode B / device | OWNER_GATE | Provide keys/certs/device |
| GigaAM / d1.3 install | RESEARCH_DEFER | License + Silicon + Arena budget |
| Formal GitHub APPROVED | REVIEW_PENDING | Non-author review on PR |
| Independent VERIFIED | REVIEW_PENDING | Separate reviewer identity |

## Continuation

`docs/reports/plan-exec-delta-2026-11-28/` + this RESULT; next after merge: ready/merge #530 Dependabot Bun; migration receipts when owner authorizes.
