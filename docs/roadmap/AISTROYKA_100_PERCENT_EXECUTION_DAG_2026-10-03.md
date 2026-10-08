# AISTROYKA 100% Execution DAG — 2026-10-03

Status values: TODO | IN_PROGRESS | WAITING_EXTERNAL | REVIEW | PASS | FAIL | BLOCKED_EXTERNAL | OWNER_GATE | PROVEN

Independent lanes may proceed when a node is WAITING_EXTERNAL.

## Lane A — backend/domain/security

| ID | State | Depends | Scope | DB | API | Tests |
|----|-------|---------|-------|----|-----|-------|
| A1 video project authz | IN_PROGRESS | — | analyze-video-daily | no | yes | route.test.ts |
| A2 stakeholder transition trigger | IN_PROGRESS | — | project_stakeholders | yes | PostgREST | membership-privilege-escalation.rls.test.ts |
| A3 field daily log RLS | IN_PROGRESS | — | field_daily_logs | yes | service | rls + service tests |
| A4 approvals submitted visibility | IN_PROGRESS | — | pending approvals | no | yes | pending-approvals.service.test.ts |
| A5 project summary submitted | IN_PROGRESS | — | project summary | no | yes | project-summary.repository.test.ts |
| A6 apply migrations staging | TODO | A2 A3 REVIEW | remote apply | yes | — | live PostgREST negatives |
| A7 portal finance isolation re-proof | TODO | A6 | AIS-OWNER-001 | no | portal | customer-finance tests + E2E |

## Lane B — web

| ID | State | Depends |
|----|-------|---------|
| B1 approvals UI | IN_PROGRESS | A4 |
| B2 remaining cabinet P1s (PR353 daily-log draft persist) | TODO | A3 |
| B3 customer intake UI | TODO | A7 + C1 contracts |

## Lane C — iOS

| ID | State | Depends |
|----|-------|---------|
| C0 Manager/Worker compile+UITest | TODO | A1 merge |
| C1 Customer iOS ADR + target | TODO | A7 |
| C2 Customer intake screens | TODO | C1 + B3 |

## Lane D — Android

| ID | State | Depends |
|----|-------|---------|
| D1 audit exact parity vs supported flows | TODO | — |
| D2 implement critical gaps only | TODO | D1 |
| First-pilot Android | DEFERRED_BY_DECISION | owner |

## Lane E — AI / vision / graph

| ID | State | Depends |
|----|-------|---------|
| E1 live provider smoke | TODO | secrets |
| E2 VISION job lifecycle | TODO | A1 |
| E3 GRAPH schema | TODO | E2 evidence chain |

## Lane F — tests / ROMA

| ID | State | Depends |
|----|-------|---------|
| F1 this-slice vitest | IN_PROGRESS | A1–A5 |
| F2 ROMA-VER-009 schemas advisory | TODO | — (independent) |

## Lane G — deploy / live

| ID | State | Depends |
|----|-------|---------|
| G1 PR CI | TODO | F1 |
| G2 non-author APPROVED | WAITING_EXTERNAL | G1 |
| G3 staging deploy | TODO | merge |
| G4 staging smoke + migration | TODO | G3 A6 |
| G5 production | TODO | G4 |

## Lane H — docs / evidence

| ID | State | Depends |
|----|-------|---------|
| H1 audit+matrix | IN_PROGRESS | — |
| H2 STATUS/truth index | IN_PROGRESS | H1 |
| H3 post-audit after merge | TODO | G4 |

## Blocked / gated (do not stop other lanes)

| Item | State |
|------|-------|
| LEGAL counsel text | BLOCKED_EXTERNAL |
| GROWTH_BASELINE rates | WAITING_EXTERNAL (instrument only) |
| TestFlight / Play upload | OWNER_GATE |
| Entitlement account-first cutover | OWNER_GATE |
| Live intake provider selection | TODO after Graph; no fake live AI |
| Parallel autonomous agents | DEFERRED until ADR |
