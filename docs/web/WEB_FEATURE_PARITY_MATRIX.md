# WEB Feature Parity Matrix

**Date:** 2026-06-20  
**Compare:** Live production (`ff537c8`) vs `release/web-pilot-rc` (`9d6a7812`) vs product expectations

Legend: **Expected** = pilot-ready product intent; **Code exists** = on `release/web-pilot-rc`; **Live visible** = verified on `aistroyka.ai` runtime; **API wired** = route/handler present on RC branch.

| Surface | Expected | Code exists (RC) | Live visible | API wired | Missing | Severity |
|---------|----------|------------------|--------------|-----------|---------|----------|
| **Public: landing** | LG hero, metrics, CTA | Yes | Pre-LG shell | N/A | Liquid Glass public shell | **P0** |
| **Public: pricing / pilot CTA** | Pricing + contact CTA | Yes (redesign) | Legacy layout | N/A | LG pricing page | **P0** |
| **Public: contact / lead form** | Working lead capture | Yes | Works (pre-LG UI) | `/api/contact`, `/api/v1/contact` | LG visual parity | P1 |
| **Public: language switching** | en/ru/es/it | Yes | Yes | N/A | — | — |
| **Public: brand/logo/design** | LG + tokens | Yes | P1 tokens only | N/A | Full LG brand pass | **P0** |
| **Public: legal links** | privacy, terms | Yes | Yes | N/A | — | — |
| **Auth: login** | Email/social/Telegram | Yes | Yes | Supabase auth | LG auth layout (RC only) | P1 |
| **Auth: signup/onboarding** | Tenant signup flow | Yes | Yes | `/api/v1/onboarding/*` | Account workspace Stage 2.2 partial | P2 |
| **Auth: tenant creation** | Workspace + tenant | Yes (main) | Yes | tenant APIs | Stage 2.5 stash not merged | P2 |
| **Auth: client/contractor persona** | Role-based UX | Yes | Yes | middleware + RLS | — | — |
| **Dashboard: projects** | List + detail | Yes | Yes (auth) | `/api/v1/projects/*` | LG dashboard chrome | P1 |
| **Dashboard: tasks** | Task views | Yes | Yes | worker/manager APIs | — | — |
| **Dashboard: reports** | Reports + approval | Yes | Yes | `/api/v1/reports/*` | — | — |
| **Dashboard: documents** | Project documents tab | Yes | Yes | documents APIs | Tab visibility UX | P2 |
| **Dashboard: costs** | Internal costs (contractor) | Yes | Yes (RLS) | costs APIs | Customer isolation verified | P2 |
| **Dashboard: notifications** | In-app notifications | Yes | Yes | notifications APIs | — | — |
| **Dashboard: AI/Copilot** | Copilot chat | Yes | Yes | SSE stream route | Flywheel feedback excluded | P2 |
| **Dashboard: timeline** | Project timeline | Yes | Yes | — | — | — |
| **Dashboard: attention** | Attention block | Yes | Yes | — | — | — |
| **Dashboard: team** | Team management | Yes | Yes | `/api/v1/team/*` | — | — |
| **Admin: tenant admin** | Admin home | Yes | Yes (auth) | `/api/v1/admin/*` | LG admin polish | P2 |
| **Admin: leads** | Lead inbox | Yes | Yes | admin leads API | — | — |
| **Admin: AI governance** | AI overview/security | Yes | Yes | admin AI routes | Expert review (excluded) | P2 |
| **Admin: jobs** | Background jobs | Yes | Yes | jobs API | — | — |
| **Admin: billing pilot** | Pilot billing surface | Yes | Yes | billing routes | Stage 2.5 cutover not merged | P2 |
| **Admin: operator tools** | Exports scaffold | Yes (placeholder handler) | Yes | `/api/v1/admin/exports` | Full export generation (local WIP only) | P2 |
| **Owner: platform console** | Owner UI | Yes | Gate 403 anon | `/api/v1/owner/*` | — | — |
| **Owner: tenants/users** | Cross-tenant admin | Yes | Auth required | owner APIs | — | — |
| **Owner: diagnostics/support/audit** | Ops surfaces | Yes | Auth required | owner APIs | — | — |
| **Portal: stakeholder portal** | Client portal list | Yes | Auth redirect | `/api/v1/portal/*` | — | — |
| **Portal: project summary** | Client project view | Yes | Yes | portal project routes | — | — |
| **Portal: client documents** | Client-visible docs | Yes | Yes | portal documents API | — | — |
| **Portal: finance isolation** | No internal costs to client | Yes (RLS + UI) | Yes | portal routes | Ongoing audit | P1 |
| **Security: stakeholder middleware** | `/portal` protected | Yes | Yes | middleware | — | — |
| **Security: owner gate** | `/owner` 403 without grant | Yes | **Verified 403** | owner middleware | — | — |
| **Security: internal business scope** | Contractor vs client | Yes | Yes | RLS | — | — |
| **Security: API auth envelope** | Session + lite allow-list | Yes | Yes | middleware | — | — |

---

## Summary by pilot surface

| Surface | Live pilot-ready? | Blocker |
|---------|-------------------|---------|
| Public site | **NO** | LG redesign not deployed |
| Dashboard | **PARTIAL** | Functional on main; LG product surface on RC only |
| Admin | **PARTIAL** | Core works; visual/product polish on RC |
| Owner | **YES** (gate verified) | Requires grant for full test |
| Portal | **PARTIAL** | Auth + APIs on main; finance isolation needs authenticated E2E |

Primary gap is **design/product surface deployment**, not missing backend on main.
