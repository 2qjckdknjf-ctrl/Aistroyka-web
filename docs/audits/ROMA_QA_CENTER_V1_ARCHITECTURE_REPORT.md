# ROMA QA Center V1 Architecture Report

**Date:** 2026-07-04  
**Branch:** `security/platform-admin-separation`  
**Host:** `admin.aistroyka.ai`  
**Area:** Platform Admin → ROMA QA Center  
**Verdict:** Information architecture V1 — read-only shell, no test execution

---

## Purpose

Transform the single ROMA Testing page into a structured **ROMA QA Center** with twelve sections, sub-navigation, and a lightweight read-only data model. V1 prepares future safe audit design without enabling runs, CI triggers, or production mutation.

---

## Routes added

All routes live under the existing platform-admin segment group and inherit platform-owner layout guards.

| Route | Section | Notes |
|-------|---------|-------|
| `/[locale]/platform-admin/testing` | Dashboard | Existing live quality dashboard + engineering intelligence |
| `/[locale]/platform-admin/testing/audits` | Audits | Coming soon — audit types documented |
| `/[locale]/platform-admin/testing/web` | Web | Public site + dashboard placeholders |
| `/[locale]/platform-admin/testing/mobile` | Mobile | Android/iOS Manager/Worker sub-areas |
| `/[locale]/platform-admin/testing/backend` | Backend | API, DB, auth, jobs placeholders |
| `/[locale]/platform-admin/testing/ai` | AI Review | Copilot, injection, leakage, provider health |
| `/[locale]/platform-admin/testing/security` | Security | RBAC, tenant isolation, platform admin |
| `/[locale]/platform-admin/testing/performance` | Performance | CWV, latency — not available in V1 |
| `/[locale]/platform-admin/testing/regression` | Regression | Change/risk — planned |
| `/[locale]/platform-admin/testing/coverage` | Coverage | Probe coverage only, no fabricated test % |
| `/[locale]/platform-admin/testing/history` | History | No run store |
| `/[locale]/platform-admin/testing/reports` | Reports | Repo doc references |

**Redirect policy:** `/platform-admin/testing` remains the Dashboard entry (no redirect). Shell top nav label updated from "ROMA Testing" to "ROMA QA Center".

---

## UX structure

```
Platform Admin shell (top nav)
└── ROMA QA Center
    ├── Banner: "read-only · test execution not enabled"
    ├── Left/sub nav (12 sections)
    └── Content
        ├── Dashboard → PlatformAdminTestingClient (live probes)
        └── Other sections → RomaQaCenterSectionClient (static model)
```

Design constraints enforced in V1:

- Enterprise platform-admin styling (Card, Badge, design tokens)
- Missing data shown as **Unknown** / **Not available** — no synthetic metrics
- No `<button>` Run / Execute / Deploy / Fix actions
- Section pages state explicitly that execution is disabled

---

## Data model

Files:

- `apps/web/lib/platform-admin/roma-qa-center.types.ts`
- `apps/web/lib/platform-admin/roma-qa-center.model.ts`
- `apps/web/lib/platform-admin/roma-qa-center-nav.ts`

`RomaQaCenterSection` fields:

| Field | Description |
|-------|-------------|
| `id` | Section identifier |
| `title` | Display title |
| `status` | `available` \| `coming_soon` \| `unknown` |
| `maturity` | `live` \| `partial` \| `planned` |
| `sourceAvailability` | Human-readable probe/doc availability |
| `description` | Section purpose |
| `currentCapability` | What V1 actually does |
| `futureCapability` | Planned execution scope |
| `blockers` | Why execution is not ready |
| `relatedReports` | Repo-relative doc paths (reference only) |
| `subAreas` | Optional nested areas (mobile apps, audit types, etc.) |

`RomaQaCenterModel`:

- `version: "v1"`
- `executionEnabled: false` (typed literal — cannot be true in V1)
- `sections`: dashboard (live when probes passed to builder) + eleven static sections

Dashboard section enriches from `buildRomaQualityDashboard()` + `buildRomaEngineeringIntelligence()` when available on the main page.

---

## Components

| Component | Role |
|-----------|------|
| `RomaQaCenterShell` | QA center banner + sub-nav wrapper |
| `RomaQaCenterNav` | Section links |
| `RomaQaCenterSectionClient` | Read-only section detail |
| `PlatformAdminTestingClient` | Unchanged live dashboard (title → "Dashboard") |

Layout: `app/[locale]/(platform-admin)/platform-admin/testing/layout.tsx` wraps all testing routes.

---

## Limitations (V1)

1. **No test execution** — no Run Full Audit, no CI dispatch, no mobile UITest triggers
2. **No run history store** — History section is planning-only
3. **No artifact ingestion** — Reports link to repo docs, not downloadable run artifacts
4. **No performance telemetry** — Performance section status `coming_soon` / `unknown`
5. **Static section pages** — only Dashboard uses live probes; other sections use `buildRomaQaCenterModel()` without probe input
6. **No new API routes** — existing `GET /api/v1/platform/testing/quality` unchanged

---

## Future execution phases

| Phase | Scope |
|-------|-------|
| **V2 — Safe audit design** | Owner-gated audit job definitions, approval workflow, immutable report schema |
| **V3 — Scoped execution** | Preflight, RBAC matrix, AI live provider gate — staging-only by default |
| **V4 — History + artifacts** | Run persistence, trends, CI artifact ingestion |
| **V5 — Regression intelligence** | Git diff → affected modules → required checks mapping |

Each phase must preserve: platform-owner-only access, no tenant admin path, no production mutation without explicit owner gate, no customer-finance leakage on any surface.

---

## Security validation

| Control | Status |
|---------|--------|
| Platform owner layout guard | Unchanged — `(platform-admin)` group |
| `platform_owner_grants` | Not weakened |
| Cloudflare Access on `admin.aistroyka.ai` | Not modified |
| Tenant `/admin` navigation | Not added to QA center |
| Middleware platform-admin paths | `/platform-admin/testing/*` already guarded |
| Execution endpoints | None added |
| Secrets in UI | None — doc paths only |
| Public host dependency | None — admin host routing unchanged |

Tests: `apps/web/lib/platform-admin/roma-qa-center.test.ts` (+ updated `roma-quality-dashboard.page.test.ts`)

---

## Files changed (implementation)

- `apps/web/lib/platform-admin/roma-qa-center.types.ts`
- `apps/web/lib/platform-admin/roma-qa-center.model.ts`
- `apps/web/lib/platform-admin/roma-qa-center-nav.ts`
- `apps/web/lib/platform-admin/roma-qa-center.test.ts`
- `apps/web/lib/platform-admin/shell-nav.ts`
- `apps/web/components/platform-admin/RomaQaCenterShell.tsx`
- `apps/web/components/platform-admin/RomaQaCenterSectionClient.tsx`
- `apps/web/components/platform-admin/PlatformAdminTestingClient.tsx`
- `apps/web/app/[locale]/(platform-admin)/platform-admin/testing/layout.tsx`
- `apps/web/app/[locale]/(platform-admin)/platform-admin/testing/[section]/page.tsx`
- `apps/web/app/[locale]/(platform-admin)/platform-admin/testing/page.tsx`
- `docs/audits/ROMA_QA_CENTER_V1_ARCHITECTURE_REPORT.md`

---

## Verdict flags

| Flag | Value |
|------|-------|
| `ROMA_QA_CENTER_V1_READY` | **YES** |
| `TEST_EXECUTION_ENABLED` | **NO** |
| `READY_FOR_SAFE_AUDIT_DESIGN` | **YES** |
