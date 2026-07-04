# ROMA Test Catalog V1 Report

**Date:** 2026-07-04  
**Branch:** `security/platform-admin-separation`  
**Route:** `/[locale]/platform-admin/testing/test-catalog`  
**Verdict:** Canonical test registry — no execution

---

## Catalog philosophy

The ROMA Test Catalog is the **single source of truth** for every test ROMA will ever know about. It is:

- **Declarative** — describes what tests exist, not running them
- **Graph-linked** — each entry references Quality Graph nodes
- **Release-aware** — `releaseCritical` flags gate release readiness
- **Disabled by default** — `enabled: false` on all V1 entries; `executionEnabled: false` on catalog

Future consumers: Quality Graph, Execution Planner, Engineering Intelligence, Regression Analysis, Coverage.

---

## Catalog model

**Files:**
- `apps/web/lib/platform-admin/roma-test-catalog.types.ts`
- `apps/web/lib/platform-admin/roma-test-catalog.ts`

### Item fields

| Field | Purpose |
|-------|---------|
| `testId` | Stable unique identifier |
| `title` / `description` | Human-readable summary |
| `domain` / `category` | Taxonomy (e.g. web → routing) |
| `priority` | p0–p3 |
| `severity` | critical → low |
| `executionType` | automated, manual, smoke, audit, probe |
| `supportedPlatforms` | web, ios, android, api, staging, production |
| `supportedRoles` | RBAC roles including anonymous |
| `requiredEvidence` | What a future run must produce |
| `affectedModules` | Repo/module tags |
| `relatedGraphNodes` | Links to Quality Graph node IDs |
| `releaseCritical` | Required for release readiness |
| `estimatedRuntime` | Planning hint |
| `prerequisites` / `outputs` | Execution planner inputs |
| `maturity` | planned → live |
| `enabled` | Always `false` in V1 |

---

## Coverage (V1)

| Domain | Representative categories |
|--------|---------------------------|
| web | routing, forms, localization, responsive, browser_compatibility |
| backend | apis, auth, storage, jobs, migrations |
| database | schema, RLS, tenant_isolation, indexes |
| security | RBAC, owner_access, platform_admin, headers, CSP, JWT, secrets |
| ai | provider_health, prompt_injection, hallucination, confidence, reasoning, memory |
| mobile_ios | Manager, Worker |
| mobile_android | Manager, Worker |
| performance | web, api, mobile |
| accessibility | wcag |
| ux | onboarding |
| visual | marketing_compliance |
| release | deploy_truth, ci_gate |
| pilot | role_smoke, intake |
| business_flow | reports, projects, tasks, approvals, notifications, documents, finance |

Approximate catalog size: **52 entries**, **14 domains**, **~35 release-critical**.

---

## Helper functions

| Function | Description |
|----------|-------------|
| `getTestCatalog()` | Full catalog singleton |
| `getTestsByDomain(domain)` | Filter by domain |
| `getTestsForGraphNodes(nodeIds)` | Tests linked to graph nodes |
| `getReleaseCriticalTests()` | Release gate subset |
| `getTestsForRoles(roles)` | Role-based filter |
| `getTestsForPlatforms(platforms)` | Platform filter |
| `getTestsForAffectedAreas(areaIds)` | Product area → tests |
| `getCatalogSummary()` | Counts and aggregates |

---

## UI

**Component:** `RomaTestCatalogClient`  
**Page:** `platform-admin/testing/test-catalog/page.tsx`

Displays:
- Total / release-critical / enabled counts
- Domain grid with counts (filter buttons — not execution)
- Full catalog table (priority, platforms, maturity, disabled state)
- Release-critical subset table

**Navigation:** "Test Catalog" in ROMA QA Center sub-nav.

---

## Future execution model

| Phase | Scope |
|-------|-------|
| **V2 — Execution Planner** | Map catalog entries to CI jobs and owner-gated run plans |
| **V3 — Enable flags** | Flip `enabled` per entry after runner exists |
| **V4 — Evidence ingestion** | Attach run artifacts to catalog entries |
| **V5 — Coverage sync** | Auto-discover new tests into catalog |

Execution remains owner-only, staging-first, no production mutation without explicit gate.

---

## Limitations (V1)

1. **No test execution** — registry only
2. **All entries disabled** — `enabled: false`
3. **Static registry** — not synced from repo test files
4. **No Playwright/XCTest/Android test creation** — by design for this mission
5. **Graph links manual** — `relatedGraphNodes` maintained in catalog source
6. **Domain filter uses buttons** — navigation only, not run triggers

---

## Security validation

| Control | Status |
|---------|--------|
| Platform owner route guard | Unchanged |
| No external services | Verified |
| No secrets in catalog | Verified |
| No execution UI | Verified |
| Cloudflare Access | Not modified |

**Tests:** `apps/web/lib/platform-admin/roma-test-catalog.test.ts`

---

## Verdict flags

| Flag | Value |
|------|-------|
| `ROMA_TEST_CATALOG_READY` | **YES** |
| `EXECUTION_ENABLED` | **NO** |
| `READY_FOR_EXECUTION_PLANNER` | **YES** |
