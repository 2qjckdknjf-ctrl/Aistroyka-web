# Integration Checkpoint Risk Review — 2026-06-20

## P0 Risks

| Risk | Status | Impact | Next action |
|---|---|---|---|
| Tenant/auth leakage | Mitigated for implemented slices | Export/review routes are tenant-scoped and tested | Keep route tests in full suite. |
| CSV finance leakage | Mitigated | Export emits fixed safe columns only | Do not add finance/customer/stakeholder export without separate design. |
| Cross-tenant review/export | Mitigated by tests and tenant-scoped queries | Data isolation protected for implemented routes | Add live smoke later when env is available. |
| Build/deploy broken | No evidence | `build` and `cf:build` pass | Continue validating after each slice. |
| Migrations accidentally changed | None | No DB mutation risk from this branch | Keep migrations blocked. |

## P1 Risks

| Risk | Status | Impact | Next action |
|---|---|---|---|
| Missing live smoke | Open | Local pilot smoke not run due no server/env | Run once local/staging env is available. |
| Frontend not wired to export | Expected | New backend route exists without UI | Frontend visibility audit should decide if/where UI wiring belongs. |
| Report review side effects deferred | Expected | Notifications/sync not implemented | Plan separate tests before any side effects. |
| AI migrations unresolved | Open | AI branches still blocked | Do not start AI yet. |
| Mobile API assumptions unresolved | Open | Mobile release branches still deferred | Audit mobile API compatibility later. |

## P2 Risks

| Risk | Status | Impact | Next action |
|---|---|---|---|
| Docs heavy | Accepted | Large review payload | Keep docs under reconciliation; summarize in PR. |
| `smoke:frontend` unavailable | Open | No frontend smoke script | Document as unavailable. |
| `smoke:pilot` needs local server/env | Open | Smoke cannot run from current shell | Start app/load env before future smoke. |

## Risk Verdict
- No open P0 risks from implemented slices.
- P1/P2 risks remain expected and tracked.
