# Step 9A — Gap review (closure hardening)

**Date:** 2026-03-16

| # | Issue | Impact | Priority | Fix now / defer | Blocker? |
|---|--------|--------|----------|-----------------|----------|
| G1 | Manager: thin data vs product failure still easy to confuse | Trust | P0 | **Fix:** state labels + trust_summary wording (9A) | Was soft |
| G2 | Manager: truncated ref only | Escalation | P1 | **Fix:** copy full request_id button | No |
| G3 | Next steps order arbitrary | Actionability | P1 | **Fix:** priority order ME → risks → recs | No |
| G4 | Operator: empty window looks like broken panel | Ops UX | P1 | **Fix:** explicit empty-state card | No |
| G5 | Full `next build` never proven on agent | Closure | P0 | **Validate:** run build — **FAIL: SWC native** | **Env, not code** |
| G6 | No E2E for Step 9 flows | Confidence | P2 | Defer | No |
| G7 | Intelligence tab only; rest of dashboard | Scope | P2 | Defer by charter | No |
| G8 | low_confidence vs partial_data wording | State | P1 | **Fix:** distinct trust_summary branch | No |

## Blocker analysis

- **Production bundle on this host:** fails loading `next.config` / SWC native binding — **pre-existing environment issue**, documented in prior phases.
- **Code-level closure:** not blocked.
