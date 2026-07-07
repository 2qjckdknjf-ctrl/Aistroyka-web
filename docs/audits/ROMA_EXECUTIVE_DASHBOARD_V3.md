# ROMA Executive Dashboard V3

**Date:** 2026-07-07  
**Branch:** `security/platform-admin-separation`  
**Route:** `/[locale]/platform-admin/testing` (preferred host: `admin.aistroyka.ai`)  
**Verdict:** World-class executive operations center — product/UX only, zero backend changes

---

## Design goals

Answer four questions in **15–20 seconds**:

1. **Is my platform healthy?** → Executive hero + platform health grid  
2. **Can I safely release today?** → Release center verdict  
3. **What requires my attention first?** → Next actions (max 5, prioritized)  
4. **What changed since yesterday?** → Recent changes timeline  

ROMA should feel like **Linear · Datadog · Vercel · Stripe Dashboard** — not an internal developer console.

---

## Before vs after

| V2 (engineering console) | V3 (executive operations center) |
|--------------------------|-----------------------------------|
| 11-card overview grid + inline diagnostics | **8-metric executive hero** only |
| Action center as equal-weight link grid | **Next actions** — numbered priorities with effort/impact |
| Executive summary bullet paragraph | Removed from primary view (release center replaces it) |
| Current risks in 3 columns | Risks folded into release center + next actions |
| Flat audit list | **Recent changes timeline** |
| “Coverage” terminology | **Decision confidence** with expandable blind spots |
| Probe dump in middle of page | **Technical diagnostics** collapsed at bottom |
| Flat grouped nav (always expanded) | **Collapsible nav groups** with persisted state |
| Dense borders | Larger spacing, softer surfaces, large type |

---

## Information hierarchy (top → bottom)

| # | Section | Executive purpose |
|---|---------|-------------------|
| 1 | **Executive hero** | Platform status, release status, confidence, blockers, warnings, last audit, refresh, next action |
| 2 | **Next actions** | ROMA-prioritized safe workflows (≤5) |
| 3 | **Release center** | Single large verdict + plain-English why |
| 4 | **Platform health** | 10 components, sorted critical → healthy |
| 5 | **Business impact** | Affected first, unknown next, healthy collapsed |
| 6 | **Recent changes** | Timeline (audits, refresh, recommendation shifts) |
| 7 | **Decision confidence** | HIGH + 96% + live source count; blind spots hidden |
| 8 | **Technical diagnostics** | SHA, probes, evidence — engineers only |

---

## Design principles

- **No paragraphs above the fold** — numbers and labels only in hero  
- **No UUIDs in executive view** — build SHA only under technical diagnostics  
- **Terminology shift:** Coverage → Decision confidence; Critical blockers → Release blockers; Why this decision → Why ROMA recommends this  
- **UI composition only** — reuses `buildRomaQualityDashboard`, `buildRomaEngineeringIntelligence`, `listAuditRunSummaries`  
- **No new fetches** on dashboard client — server page loads existing services  
- **Accessibility:** focus-visible outlines on links/actions; semantic sections with `aria-labelledby`; keyboard-navigable nav toggles  
- **Responsive:** hero wraps on iPad; health grid 2–3 columns; mobile nav horizontal scroll  

---

## Navigation (V3)

Collapsible groups with `localStorage` key `roma-qa-nav-groups-expanded`:

```
Overview      → Dashboard
Operations    → Safe Audit, Audit History
Quality       → Graph, Catalog, Change Intelligence
Execution     → Planner, Engine
Platform      → Web, Mobile, Backend, AI, Security
```

All routes unchanged — IA grouping only.

---

## Reused modules

| Module | V3 usage |
|--------|----------|
| `buildRomaQualityDashboard()` | Hero, health, timeline, diagnostics |
| `buildRomaEngineeringIntelligence()` | Release center, actions, impact |
| `listAuditRunSummaries(admin, 5)` | Timeline + last audit hero stat |
| `executive-dashboard-ui.ts` | Prioritized actions, health sort, timeline, plain-English why |
| `quality-dashboard-ui.ts` | Badges and formatting |

**No** new APIs · **No** new DB · **No** execution · **No** security changes

---

## Future roadmap (not in V3)

- Owner-completed smoke on `admin.aistroyka.ai` with saved audit timeline entries  
- Optional sparkline for confidence trend (requires history — already have audit runs)  
- i18n for executive copy (currently English operator labels)  
- Dark-mode contrast pass on health dot colors  

---

## Validation

```bash
bun test lib/platform-admin/executive-dashboard-ui.test.ts
bun test lib/platform-admin/roma-quality-dashboard.page.test.ts
bun test lib/platform-admin/roma-qa-center.test.ts
```

---

## Flags

| Flag | Value |
|------|-------|
| `EXECUTIVE_DASHBOARD_V3_READY` | **YES** |
| `UX_SCORE_TARGET` | **10/10** (design target) |
| Backend changes | **NO** |
