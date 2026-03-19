# Step 10A — Gap Review

**Date:** 2026-03-18

| Gap | Issue | Impact | Severity | Fix now / defer | Blocker |
|-----|-------|--------|----------|-----------------|---------|
| AlertFeed entity links | `alerts` table has no resource_id | No project/task URLs | High product | **Defer** until migration | Not a Step 10A code blocker |
| AlertFeed dead ends | Generic “Open related” only | Manager confusion | Medium | **Fix** — linkage model + primary CTA to anchored list | — |
| Hash scroll before paint | React Query loads after first effect | Missed scroll to alert | Medium | **Fix** — retries after data load | — |
| Unknown alert types | Fall through to vague destination | Weak drill-down | Medium | **Fix** — list_anchor_only + honesty copy | — |
| Vitest local | esbuild platform mismatch | Can’t run `npm test` on some hosts | Low env | **Document** + `bun test` / `test:manager-layer` | Env, not product |
| Full root build | Long / not always run in session | Confidence gap | Medium | **Confirm** `next build` in apps/web + contracts pre-step | — |
| CTA duplication | Unknown type: two links to same page | Minor clutter | Low | **Fix** — single primary “Open on alerts list” for unknown | — |
| Workflow E2E | No automated Playwright for alerts path | Manual only | Low | Defer | — |

**Summary:** Gaps 2–4 and 7 addressed in Step 10A. Gap 1 explicitly deferred with documented proof. Gap 5–6 documented with reliable commands.
