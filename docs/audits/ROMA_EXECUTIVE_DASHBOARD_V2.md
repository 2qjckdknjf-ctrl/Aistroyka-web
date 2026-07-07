# ROMA Executive Dashboard V2

**Date:** 2026-07-07  
**Branch:** `security/platform-admin-separation`  
**Route:** `/[locale]/platform-admin/testing`  
**Verdict:** Executive operations dashboard — IA/UX restructure only, no new backend logic

---

## Why the dashboard changed

The previous ROMA homepage was **developer-oriented**: probe details, technical component IDs, and a collapsible “detailed probe dashboard” dominated the layout. Platform owners needed a **30-second executive read** — platform health, release posture, risks, business impact, and safe next actions — without wading through engineering diagnostics.

V2 reframes the same live data and rule engine into an **Executive Operations Dashboard** while preserving:

- Read-only posture (`executionEnabled: false`)
- Platform-owner-only access (unchanged auth stack)
- No new APIs, DB tables, or execution paths

---

## Information hierarchy (V2)

| Order | Section | Purpose |
|-------|---------|---------|
| 1 | **Platform overview** | Hero KPI grid + system health (AI, DB, storage, security) |
| 2 | **Action center** | Safe navigation links (audit refresh/save surfaces, history, release block) |
| 3 | **Executive summary** | Bullet narrative from `buildExecutiveSummaryNarrative()` + assessment |
| 4 | **Current risks** | Critical / warnings / informational columns from `decisionReasons` |
| 5 | **Business impact** | Existing `affectedProductAreas` impact model |
| 6 | **Recent audits** | Latest 5 rows via existing `listAuditRunSummaries()` |
| 7 | **Release readiness** | Large verdict card from engineering intelligence |
| 8 | **System map** (nav) | Grouped left navigation replacing flat 19-item list |

Technical identifiers (UUIDs, full deploy SHA) are **hidden by default** — SHA appears only under expandable diagnostics.

---

## Mapping from old UI

| Old (V1) | New (V2) |
|----------|----------|
| “Owner operator summary” single card | **Platform overview** + **Release readiness** |
| “Why this decision?” list | **Current risks** (grouped) + release “Why” subsection |
| “Business impact by product area” | **Business impact** (same data) |
| Collapsible “Detailed probe dashboard” | Removed from primary view; diagnostics `<details>` on overview |
| Flat nav (19 items incl. empty placeholders) | **System map** groups — empty/placeholder sections hidden |
| No audit history on home | **Recent audits** (server-loaded summaries) |
| No action shortcuts | **Action center** (link cards, not execution buttons) |

---

## Reused modules (no duplication)

| Module | Role on dashboard |
|--------|-------------------|
| `buildRomaQualityDashboard()` | Live probes → dashboard props |
| `buildRomaEngineeringIntelligence()` | Rule engine → summary, risks, release, impact |
| `buildExecutiveSummaryNarrative()` | Pure UI helper → executive bullet lines |
| `listAuditRunSummaries(admin, 5)` | Recent audits section |
| `quality-dashboard-ui.ts` | Badges, formatting |
| `roma-qa-center-nav.ts` | Grouped system map nav |

**Not added:** new API routes, migrations, execution engine hooks, CI triggers, or client-side fetch on the dashboard.

---

## System map navigation groups

```
Overview     → Dashboard
Operations   → Safe Audit, Audit History
Quality      → Quality Graph, Test Catalog, Change Intelligence
Execution    → Planner, Engine
Platform     → Web, Mobile, AI, Security
```

Removed from primary nav (still reachable via direct URL if section routes exist): Audits, Backend, Performance, Regression, Coverage, History, Reports — these remain `coming_soon` placeholders without cluttering the executive IA.

---

## Security & execution constraints (unchanged)

- Dashboard client: **no** `<button>`, **no** `fetch()`, **no** Run/Execute/Deploy/Fix actions
- Safe audit refresh/save remains on `/testing/safe-audit` only
- Cloudflare Access, `platform_owner_grants`, and RLS patterns untouched

---

## Validation

```bash
bun test lib/platform-admin/executive-dashboard-ui.test.ts
bun test lib/platform-admin/roma-quality-dashboard.page.test.ts
bun test lib/platform-admin/roma-qa-center.test.ts
```

---

## Flag

| Flag | Value |
|------|-------|
| `EXECUTIVE_DASHBOARD_READY` | **YES** |
| New backend logic | **NO** |
