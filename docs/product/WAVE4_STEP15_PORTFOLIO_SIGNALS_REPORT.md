# Wave 4 Step 15 — Portfolio signals

## Portfolio states

| State | Meaning |
|-------|---------|
| `healthy` | No material operational pressures under current rules. |
| `attention` | At least one meaningful signal (e.g. warning health, overdue milestones, handover blockers, pending approvals, client requests, aftercare). |
| `critical` | Budget over planned, **any** blocking punch defect, derived health critical, **≥3** overdue milestones, **≥3** handover blockers, or other critical-tier rules in `classifyPortfolioControlState`. |

## Classification rules (pure)

**File:** `lib/domain/portfolio/portfolio-control.signals.ts` — `classifyPortfolioControlState`

**Critical if any:** `budgetOverBudget`, `blockingDefectsCount > 0`, `derivedHealthLevel === "critical"`, `handoverBlockerCount >= 3`, `overdueMilestonesCount >= 3`.

**Attention if not critical and any:** `derivedHealthLevel === "warning"`, `handoverBlockerCount >= 1`, `overdueMilestonesCount >= 1`, `pendingApprovalsCount >= 1`, `pendingClientRequestsCount >= 1`, `activeAftercareCount >= 1`.

**Else:** `healthy`.

## Dominant focus (`topBlockerCategory`)

**File:** `pickTopBlockerCategory` — priority order (first match wins):

1. Budget (over or nearing limit)  
2. Punch list (blocking defects)  
3. Schedule (overdue milestones)  
4. Approvals (pending document decisions)  
5. Client requests  
6. Change orders (count from handover blockers)  
7. Discussions  
8. Handover pipeline (non-empty handover blocker list when nothing else matched earlier — **note:** category `handover_pipeline` when blockers exist but not yet categorized above)  
9. Aftercare  
10. Issues  
11. Reports  

## Human-readable reason

`primaryReasonForRow` — short string derived from state + category.

## Drilldown

`drilldownHrefForCategory` — maps category to manager dashboard path (`?tab=…`, `/client`, `/approvals`, etc.).
