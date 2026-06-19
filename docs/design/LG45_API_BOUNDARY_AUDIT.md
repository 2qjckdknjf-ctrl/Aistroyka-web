# LG-4.5 API Boundary Audit

**Date:** 2026-06-19  
**Page:** `/[locale]/api`  
**Question owned:** *How can developers and systems connect to AISTROYKA programmatically?*

## Ownership verdict

| Page | Owns | Must NOT own |
| --- | --- | --- |
| **/api** | Developer connectivity, `/api/v1` scope, auth model, readiness matrix, developer journey | Connector catalog (Integrations), product module list (Features), enterprise evaluation narrative (Enterprise), security depth (Security) |
| **/integrations** | Connector categories, import/export, ERP/BIM readiness | REST route catalog |
| **/platform** | Stack narrative (web + mobile + AI + approvals) | Developer DX program |
| **/features** | Capability catalog | API route inventory |
| **/security** | Isolation, permissions, compliance posture | API examples |
| **/enterprise** | Org-scale evaluation | API self-serve claims |

## Duplication removed in LG-4.5

| Removed from /api | Redirected to |
| --- | --- |
| Generic “available via API” bullet list without readiness | Category grid with LIVE/PARTIAL/PLANNED |
| “API keys where enabled” overclaim | authProgram: keys PLANNED |
| Sandbox direction without qualifier | Matrix PLANNED + billing sandbox not conflated |
| ERP/BIM/webhook marketplace language | Integrations page |
| Enterprise governance copy | Enterprise + Security related links |

## Boundary enforcement

- Hero question: **“How can systems connect to AISTROYKA?”**
- Positioning states product REST is LIVE; public developer program is PLANNED.
- Related links: Integrations, Security, Enterprise, Contact only (no Features/Platform duplication).

## Verdict

**BOUNDARY CLEAR** — `/api` owns developer connectivity only.
