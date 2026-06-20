# Frontend External Branch Comparison — 2026-06-20

| Branch | Files changed | Routes changed | Components changed | Design system | Public site | Dashboard | Owner/customer/stakeholder | AI/admin surfaces | API assumptions | Risk | Recommendation |
|---|---:|---:|---:|---|---|---|---|---|---|---|---|
| `release/web-pilot-rc` | 172 | 54 | 61 | Liquid Glass/AppGlassRoot/design components | YES | YES | YES/PARTIAL | admin AI panels | mixed, includes backend/API-adjacent assumptions | P1 | `manual_port_later`; strongest source for expected visible UI |
| `design/liquid-glass-public-shell-lg2a` | 159 | 27 | 27 | Liquid Glass public/design components | YES | limited admin AI | limited | Expert Review/Training Consent pages | AI migrations/routes required for admin AI | P1/P0 for AI pieces | `safe_reference` for public/design only |
| `feature/unified-product-design-certification` | 261 | 61 | 62 | broad Liquid Glass web/mobile/design | YES | YES | YES/PARTIAL | AI/admin and mobile | mixed broad branch | P0/P1 | `manual_port_later`; too broad as source |
| `release/mobile-pilot-rc` | 18 | 2 | 2 | messages and small web support | NO/PARTIAL | report/upload touchups | no | no | mobile/report API assumptions | P1 | `manual_review_later`; not frontend primary |
| `ai/gold-memory-mvp` | 159 | 27 | 27 | Liquid Glass copied with AI work | YES | admin AI | no | Gold Memory/Expert Review | AI migrations required | P0 | `unsafe_for_frontend_now`; use design branch instead |
| `ai/expert-review-queue-mvp` | 81 | 5 | 0 | messages only | NO | admin AI only | no | Expert Review/Training Consent | AI migrations required | P0 | `defer` |

## Most Likely Source Of “Visible UI”
- `release/web-pilot-rc`

## Notes
- `release/web-pilot-rc` includes both public site redesign and dashboard surface changes, including owner/client portal panels and DashboardShell/Nav changes.
- Liquid Glass assets are present in design branches but not current integration branch beyond basic tokens/components.
- AI/admin Expert Review and Training Consent UI exists only outside current branch and must remain blocked until AI schema/runtime is reviewed.
