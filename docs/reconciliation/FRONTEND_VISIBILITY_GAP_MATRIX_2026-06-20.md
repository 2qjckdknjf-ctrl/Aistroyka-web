# Frontend Visibility Gap Matrix — 2026-06-20

| Surface | Route exists current | Component exists current | Nav visible current | API works current | Hidden by flag/auth | Only in external branch | Best source branch | Risk | Recommended action | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Public site | YES | YES | YES | mostly static | NO | redesign variants YES | `release/web-pilot-rc` | P1 | audit public visual delta, then port small public/brand slice | P1 |
| Login/auth | YES | YES | YES | YES | auth flow | Telegram polish external | `release/web-pilot-rc` | P2 | leave unless auth issue found | P2 |
| Dashboard shell | YES | YES | YES | YES | auth | shell redesign YES | `release/web-pilot-rc` | P1 | dashboard nav/reachability audit first | P1 |
| Projects | YES | YES | YES | YES | auth/data | list/card redesign YES | `release/web-pilot-rc` | P1 | no port until nav audit says needed | P2 |
| Reports list | YES | YES | YES | YES | auth/data | polish/mobile touches | `release/mobile-pilot-rc` / current | P2 | add export UI only after design decision | P1 |
| Report detail | YES | YES | indirect | YES | auth/data | mobile/report touchups | `release/mobile-pilot-rc` | P2 | no change now | P2 |
| Report review | YES | YES | indirect | YES | role/data | approval card polish | `release/mobile-pilot-rc` | P2 | side effects/UI later, tests locked | P2 |
| Reports export UI | NO | NO | NO | backend YES | owner/admin backend | NO | current backend | P1 | future tiny UI slice if desired | P1 |
| Documents | YES | YES | project-context | YES | auth/project | dashboard panel polish | `release/web-pilot-rc` | P2 | audit project nav visibility | P2 |
| Costs/budget | YES internal | YES/PARTIAL | project-context | YES | internal role | design polish | `release/web-pilot-rc` | P0 if customer exposed | keep internal; no customer UI | P0 |
| Schedule/milestones | YES | YES/PARTIAL | project-context | YES | auth/project | design polish | `release/web-pilot-rc` | P2 | audit project subnav | P2 |
| Approvals | YES | YES | YES | YES | auth/data | report approval card polish | `feature/unified-product-design-certification` | P2 | optional later | P2 |
| Owner/customer portal | YES | YES | indirect | YES/PARTIAL | role/project | redesigned panels YES | `release/web-pilot-rc` | P1/P0 finance | audit before port; finance-safe only | P1 |
| Stakeholder finance portal | PARTIAL | PARTIAL | limited | YES/PARTIAL | stakeholder/project | external unclear | current/release | P0 finance | audit separately; no finance exposure | P0 |
| AI/Copilot | YES/PARTIAL | YES | YES/public | PARTIAL | env/auth | AI admin/Flywheel external | AI branches/design | P0 | defer until AI migrations resolved | P0 |
| Admin AI/review surfaces | partial admin AI current; Expert Review external | external YES | mostly hidden | backend missing | admin/AI flags | YES | `ai/expert-review-queue-mvp` | P0 | defer | P0 |
| Settings | YES | YES | YES | YES | auth | no major external | current | P3 | keep | P3 |
| Brand/design | YES basic | YES | YES | n/a | NO | Liquid Glass external | `release/web-pilot-rc` | P1 | choose public/brand baseline or nav first | P1 |

## Highest Visibility Gaps
- Dashboard/admin/project routes exist but many are not exposed in primary navigation.
- Reports export backend exists but no UI affordance.
- Public/design Liquid Glass work is outside current branch.
- AI/admin Flywheel surfaces are outside current branch and blocked.
