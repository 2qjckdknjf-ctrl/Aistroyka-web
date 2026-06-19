# LG-4.7 Solutions Scope Audit

**Date:** 2026-06-19  
**Route:** `/[locale]/solutions`

## In scope

- Six role entry points: General Contractor, Project Manager, Site Manager, Worker, Owner, Stakeholder
- Per role: what they **see**, **do**, and **why it matters**
- Related links: Features, Platform, Pricing, Contact
- Pilot CTA band

## Out of scope

| Topic | Owner |
| --- | --- |
| Feature modules list | `/features` |
| Web/mobile/AI stack | `/platform` |
| Pilot pricing model | `/pricing` |
| Enterprise governance | `/enterprise` |
| Data isolation | `/security` |
| Construction AI pipeline | `/ai-construction-control` |
| Deployment phases | `/implementation` |
| Workflow automation readiness | `/workflows` |

## Role overlap resolution (pre-audit)

| Legacy key | Problem | LG-4.7 resolution |
| --- | --- | --- |
| `forDeveloper` | Overlapped Owner + GC portfolio narrative | Split → **Owner** role |
| `forContractor` | Overlapped GC and Worker | Removed; **Site Manager** + **Worker** |
| `forFieldTeams` | Bundled manager + worker | Split → **Site Manager** + **Worker** |
| `forGeneralContractor` | Kept but feature-heavy copy | **roleGeneralContractor** experience copy |
| `forProjectManager` | Feature catalog tone | **roleProjectManager** experience copy |

## Customer-finance boundary

- **Owner** and **Stakeholder** copy references configured commercial visibility only — no internal contractor costs, margin, or subcontractor finance (per mega-roadmap).

## Scope verdict

**SCOPE CLOSED** after LG-4.7 implementation.
