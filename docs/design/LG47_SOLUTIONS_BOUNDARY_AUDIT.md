# LG-4.7 Solutions Boundary Audit

**Date:** 2026-06-19  
**Route:** `/[locale]/solutions`  
**Primary question:** Which AISTROYKA experience matches our role?

## Ownership verdict

| Page | Owns | Must NOT own |
| --- | --- | --- |
| **/solutions** | Role-based product **experience** — what each role sees, does, and why it matters | Module catalog (Features), stack narrative (Platform), commercial model (Pricing), enterprise evaluation (Enterprise), security depth (Security), AI pipeline (AI Control), rollout phases (Implementation) |
| **/features** | Capability catalog | Role entry narratives |
| **/platform** | Stack connectivity | Per-role UX |
| **/pricing** | Commercial engagement | Role cards |
| **/contact** | Intake / pilot request | Role duplication |

## Pre-LG-4.7 issues

| ID | Sev | Finding | Fix |
| --- | --- | --- | --- |
| BND-S1 | P1 | Plain `<h1>` — no `PublicPageHero`; weak canonical question | `PublicPageHero` with role-fit question |
| BND-S2 | P1 | Legacy roles: Developer + Contractor overlap GC/Owner; missing Site Manager, Worker, Owner, Stakeholder | Six-role inventory aligned to product contours |
| BND-S3 | P1 | Role copy duplicated Features catalog (“dashboards”, “AI insights”, “mobile reporting”) | See / Do / Matter experience copy only |
| BND-S4 | P2 | `forDeveloper` / `forContractor` redundant with GC and Owner | Removed legacy keys |
| BND-S5 | P2 | No glass-highlight discipline | One highlight: General Contractor |
| BND-S6 | P2 | metaDescription sent users to Features mid-sentence only — hero lacked explicit boundary | Positioning callout + hero subtitle |

## Duplication removed

| Removed from /solutions | Redirected to |
| --- | --- |
| Module list language in role cards | Features (related link + positioning) |
| Stack / multi-project architecture depth | Platform (related link) |
| Pilot commercial framing in role body | Pricing (related link) |
| “AI insights” as capability bullet | Experience outcome only; AI depth on AI Control |

## Post-fix boundary

**BOUNDARY CLEAR** — `/solutions` owns role experience fit only.
