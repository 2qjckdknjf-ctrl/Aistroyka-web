# ROMA Operations Center — Platform Certification V1

**Project:** AISTROYKA  
**Module:** ROMA Operations Center (`/[locale]/platform-admin/testing`)  
**Branch audited:** `security/platform-admin-separation`  
**Certification date:** 2026-07-07  
**Auditors:** Architecture · Security · QA · Release Engineering · Product Quality  
**Scope:** Read-only certification — no feature development, no security weakening

---

## Executive Summary

ROMA Operations Center is a **platform-owner-only** quality and operations surface hosted under platform-admin routing (preferred host `admin.aistroyka.ai`). It combines live health probes, engineering intelligence, safe readonly audit, audit run history, quality graph, test catalog, change intelligence, and execution planning surfaces — all with **execution disabled** at the policy layer.

This certification verified architecture, IA, UI consistency, performance patterns, security gates, data sources, release build, developer experience, documentation landscape, and technical debt across **38 ROMA library modules**, **10 client surfaces**, **10 routes**, and **4 platform APIs**.

### Verdict

| Field | Value |
|-------|-------|
| **Final recommendation** | **PILOT READY** |
| **ROMA_CERTIFIED** | **YES** (pilot-grade; not enterprise/production-complete) |
| **ENTERPRISE_READY** | **NO** |
| **Overall score** | **7.6 / 10** |

ROMA is suitable for **controlled platform-owner pilot use** with documented caveats. It is **not** enterprise-ready or fully production-grade until legacy IA drift is resolved, owner end-to-end smoke on the admin host is verified, and documentation is consolidated.

### Fixes applied during certification

| File | Issue | Fix |
|------|-------|-----|
| `apps/web/components/platform-admin/RomaQaCenterShell.tsx` | Webpack build failure (`??` mixed with `\|\|` without parens) | Added explicit parentheses |
| `apps/web/lib/platform-admin/executive-dashboard-ui.ts` | iOS/Android platform health labels swapped (`Worker Apps` / `Manager Apps`) | Corrected to `iOS` / `Android` |
| `apps/web/lib/platform-admin/roma-qa-center.model.ts` | Stale copy claimed audits/history were unavailable despite shipped safe-audit + audit-runs | Updated to `partial` with accurate capability text |
| `apps/web/lib/platform-admin/roma-quality-dashboard.service.test.ts` | `vi.mock` incompatible with Bun test runner | Refactored to `buildRomaQualityDashboardFromProbes` |
| `apps/web/lib/platform-admin/roma-qa-center.test.ts` | Expectations contradicted corrected IA | Updated assertions |

---

## 1. Architecture Audit

### Strengths

- Clear separation: **lib** (`roma-*` services/types) vs **components** (`Roma*Client`, `PlatformAdminTestingClient`) vs **routes** under `(platform-admin)/platform-admin/testing`.
- Single probe assembly path: `runLiveProbes` → `assembleDashboard` → `buildRomaEngineeringIntelligence`.
- Safe audit reuses the same probe bundle (`buildRomaQualityDashboardFromProbes`) — no duplicate live fetch in refresh flow.
- Execution engine policy is centralized (`roma-execution-engine-policy.ts`) with explicit disabled gates tested in unit tests.

### Findings

#### Duplicate / parallel implementations

| Concept | Location A | Location B | Risk |
|---------|-----------|-----------|------|
| Path → domain/area mapping | `PATH_TO_AREAS` in `roma-quality-graph.ts` | `PATH_CATALOG_DOMAIN_RULES` in `roma-change-intelligence.ts` | **Medium** — rules can drift |
| Badge/status UI helpers | `quality-dashboard-ui.ts` (dashboard) | Per-component helpers in `RomaQaCenterSectionClient`, `RomaChangeIntelligenceClient`, `RomaQualityGraphClient`, `RomaTestCatalogClient` | **Low** — visual inconsistency risk |
| IA models | V3 grouped nav (`roma-qa-center-nav.ts`) | V1 static section model (`roma-qa-center.model.ts` + `[section]/page.tsx`) | **High** — contradictory UX on legacy routes |

#### Unused / underused code

| Item | Evidence |
|------|----------|
| `buildRomaQaCenterModel({ dashboard, intelligence })` live branch | Never called with `dashboard` + `intelligence` in production; main dashboard uses `PlatformAdminTestingClient` directly |
| `GET /api/v1/platform/testing/quality` | No UI consumer; SSR page calls `buildRomaQualityDashboard()` directly |
| `groupDecisionReasonsBySeverity` | Exported from `executive-dashboard-ui.ts`; used in tests only (V3 dashboard inlines grouping differently) |

#### Dead / orphan surfaces

- No orphan ROMA components detected — all 9 `Roma*` clients + `PlatformAdminTestingClient` are routed.
- V1 `[section]/page.tsx` routes remain **reachable** but are **superseded** by dedicated module pages (safe-audit, audit-runs, quality-graph, etc.).

### Architecture file inventory

**Library (38 files):**  
`roma-change-intelligence.ts`, `roma-engineering-intelligence.ts`, `roma-execution-engine-policy.ts`, `roma-execution-planner.ts`, `roma-live-probes.ts`, `roma-quality-dashboard.service.ts`, `roma-quality-graph.ts`, `roma-qa-center.model.ts`, `roma-qa-center-nav.ts`, `roma-run-history.service.ts`, `roma-safe-readonly-audit.ts`, `roma-test-catalog.ts`, plus associated `.types.ts`, `.test.ts`, `.constants.ts`, `.redaction.ts` files.

**Components (10):**  
`PlatformAdminTestingClient.tsx`, `RomaAuditRunsClient.tsx`, `RomaChangeIntelligenceClient.tsx`, `RomaExecutionEngineClient.tsx`, `RomaExecutionPlannerClient.tsx`, `RomaQaCenterSectionClient.tsx`, `RomaQaCenterShell.tsx`, `RomaQualityGraphClient.tsx`, `RomaSafeAuditClient.tsx`, `RomaTestCatalogClient.tsx`.

**Routes (10):**  
`testing/page.tsx`, `testing/layout.tsx`, `testing/[section]/page.tsx`, `testing/safe-audit/page.tsx`, `testing/audit-runs/page.tsx`, `testing/quality-graph/page.tsx`, `testing/test-catalog/page.tsx`, `testing/change-intelligence/page.tsx`, `testing/execution-planner/page.tsx`, `testing/execution-engine/page.tsx`.

**APIs (4):**  
`quality/route.ts`, `safe-audit/refresh/route.ts`, `safe-audit/save/route.ts`, `safe-audit/runs/route.ts`.

**Architecture score: 7.0 / 10**  
Deductions: dual path-mapping tables, V1/V3 IA coexistence, unused API endpoint, dashboard model branch never wired in production.

---

## 2. Information Architecture Audit

### Navigation (V3 — canonical)

Grouped collapsible nav in `RomaQaCenterShell` with 5 groups, 13 items:

| Group | Items |
|-------|-------|
| Overview | Dashboard |
| Operations | Safe Audit, Audit History |
| Quality | Graph, Catalog, Change Intelligence |
| Execution | Planner, Engine (read-only policy surfaces) |
| Platform | Web, Mobile, Backend, AI, Security |

`localStorage` key `roma-qa-nav-groups-expanded` persists group expansion.

### Issues

| Issue | Severity | Detail |
|-------|----------|--------|
| Legacy V1 section routes | **High** | `/testing/audits`, `/testing/history`, etc. still served via `[section]/page.tsx` with static model copy — now corrected but still duplicate hierarchy |
| Dashboard vs section model disconnect | **Medium** | Main dashboard is live; V1 section pages do not receive live probe/intelligence injection |
| No breadcrumb beyond shell title | **Low** | Acceptable for pilot |

**IA score (mapped to UX): 7.5 / 10**

---

## 3. UI Consistency Audit

### Strengths

- Executive Dashboard V3 (`PlatformAdminTestingClient`) follows a consistent hierarchy: hero metrics → prioritized actions → release center → platform health → business impact → timeline → decision confidence → technical diagnostics.
- Shared formatting via `quality-dashboard-ui.ts` and `executive-dashboard-ui.ts`.
- Dark mode uses existing design tokens / Tailwind patterns consistent with platform-admin shell.
- Empty states present on audit history when no runs exist.

### Issues

| Area | Finding |
|------|---------|
| Badge variants | Duplicated per-component badge mappers vs centralized dashboard helpers |
| V1 section pages | Older card layout via `RomaQaCenterSectionClient` — visually distinct from V3 dashboard |
| Loading states | SSR-first; client refresh on safe-audit has loading indicator; no skeleton on main dashboard (acceptable for pilot) |

**UX score: 8.0 / 10**

---

## 4. Performance Audit

### Verified patterns

| Check | Result |
|-------|--------|
| Main dashboard SSR | Single `buildRomaQualityDashboard()` + `buildRomaEngineeringIntelligence()` on server |
| Duplicate client fetches on dashboard | **None** — static analysis test confirms no client fetch in `PlatformAdminTestingClient` |
| Safe audit refresh | Explicit owner-triggered POST; reuses probe bundle |
| Large components | `PlatformAdminTestingClient` is large but sectioned; no unnecessary re-fetch loops |
| Memoization | Nav groups memoized; executive helpers are pure functions |
| Bundle | Fixed `node:crypto` client leak via `roma-run-history.constants.ts` split (prior deploy) |

### Risks

- `PlatformAdminTestingClient.tsx` size may grow — consider section lazy boundaries if bundle metrics regress (not blocking pilot).
- Live probes on every dashboard SSR hit external/runtime dependencies — acceptable for owner-only low-traffic surface.

**Performance score: 8.0 / 10**

---

## 5. Security Audit

### Verified controls

| Control | Evidence |
|---------|----------|
| Platform owner API gate | All 4 `/api/v1/platform/testing/*` routes use `requirePlatformOwnerApi` |
| Tenant isolation | Platform-admin paths guarded by `isPlatformAdminPagePath`; tenant `/admin` distinct |
| Host routing | `host-policy.test.ts` — `admin.aistroyka.ai` recognized as platform admin host |
| Middleware paths | `middleware-paths.test.ts`, `roma-qa-center.test.ts` cover `/platform-admin/testing/*` |
| Audit run store RLS | `roma_audit_runs` — RLS enabled, zero policies (service-role only) |
| Execution disabled | `testExecutionEnabled: false`; policy tests block execution without approvals |
| Redaction | Run history list API returns summaries only; redaction tested |
| Robots | Testing pages `noindex` |

### Gaps

| Gap | Severity |
|-----|----------|
| Owner smoke on `admin.aistroyka.ai` not completed in this pass | **Medium** — Cloudflare Access blocks unauthenticated verification |
| No automated RBAC matrix audit execution | **Low** — documented as coming_soon |
| CF Access dependency | Operational — not a code defect |

**Security score: 8.5 / 10**

---

## 6. Data Integrity Audit

| Module | Source | Verified |
|--------|--------|----------|
| Dashboard | `buildRomaQualityDashboard()` + `buildRomaEngineeringIntelligence()` | ✅ SSR on `testing/page.tsx` |
| Safe Audit | `roma-safe-readonly-audit.ts` + refresh API | ✅ Same probe assembly |
| Audit History | `roma-run-history.service.ts` → Supabase `roma_audit_runs` | ✅ List summaries only |
| Engineering Intelligence | Derived from dashboard probes | ✅ Rule engine tested |
| Quality Graph | `buildRomaQualityGraph(dashboard)` | ✅ Consumes dashboard model |
| Test Catalog | Static catalog + dashboard context | ✅ |
| Change Intelligence | Git/metadata + catalog rules | ✅ |
| Execution Planner | Derived plans, no execution | ✅ |
| Execution Engine | Policy evaluation only | ✅ Disabled |
| V1 section pages | Static `buildRomaQaCenterModel()` without live injection | ⚠️ Stale relative to dashboard |

No duplicated database models detected. Audit runs use dedicated table with service-role access only.

**Reliability score (data): 8.0 / 10**

---

## 7. Release Readiness

| Check | Result |
|-------|--------|
| `bun test lib/platform-admin/` | **170 pass / 0 fail / 0 skip** |
| `bun run cf:build` | **Pass** (after `RomaQaCenterShell` fix) |
| Broken imports | None found in ROMA surfaces |
| Missing exports | None blocking build |
| Dead navigation links | All 13 nav hrefs resolve to existing routes |

**Release readiness score: 8.5 / 10** (post-fix)

---

## 8. Developer Experience

### Strengths

- Consistent `roma-*` prefix for domain modules.
- Co-located `.types.ts`, `.test.ts` files.
- Pure helper extraction (`executive-dashboard-ui.ts`, `quality-dashboard-ui.ts`).

### Issues

- 38 lib files + 18 audit docs + 71 `docs/roma/` spec files — high navigation overhead for new contributors.
- V1 model still exported alongside V3 nav — cognitive load.
- No barrel file for ROMA exports (acceptable — explicit imports reduce accidental client/server leaks).

**Maintainability score: 7.0 / 10**

---

## 9. Documentation Audit

### Canonical references (runtime-aligned)

| Document | Status |
|----------|--------|
| `docs/audits/ROMA_EXECUTIVE_DASHBOARD_V3.md` | **Canonical** — current dashboard UX |
| `docs/audits/ROMA_RUN_HISTORY_IMPLEMENTATION_V1_REPORT.md` | **Canonical** — audit history |
| `docs/audits/ROMA_SAFE_READONLY_AUDIT_V1_REPORT.md` | **Canonical** — safe audit |
| `docs/audits/ROMA_QA_CENTER_V1_ARCHITECTURE_REPORT.md` | **Reference** — partial; predates V3 nav |
| `docs/audits/ROMA_ENGINEERING_INTELLIGENCE_V1.md` | **Reference** — intelligence rules |

### Superseded

| Document | Superseded by |
|----------|---------------|
| `ROMA_EXECUTIVE_DASHBOARD_V2.md` | V3 doc |
| `ROMA_UX_TRUST_HARDENING_REPORT.md` | V3 doc |
| `PLATFORM_ADMIN_ROMA_READONLY_PAGE_REPORT.md` | V3 + module pages |

### Parallel spec layer (not wired to runtime UI)

- `docs/roma/**` (71 files) — strategic/spec documentation; not consumed by app code. Retain for roadmap; do not treat as runtime truth.

### Missing

- Single **ROMA documentation index** linking canonical vs superseded vs spec-only docs.

**Documentation score: 6.5 / 10**

---

## 10. Technical Debt Register

| ID | Item | Class | Effort | Risk | Order |
|----|------|-------|--------|------|-------|
| TD-01 | V1 `[section]` routes duplicate V3 module pages | **High** | 2–3d | User confusion | 1 |
| TD-02 | Dual path-mapping tables (quality graph vs change intelligence) | **Medium** | 1d | Mapping drift | 2 |
| TD-03 | `buildRomaQaCenterModel` live dashboard branch unused | **Medium** | 0.5d | Misleading section status | 3 |
| TD-04 | `GET /api/v1/platform/testing/quality` unused by UI | **Low** | 0.5d | API surface clutter | 4 |
| TD-05 | Badge helper duplication across ROMA clients | **Low** | 1d | UI inconsistency | 5 |
| TD-06 | No platform-admin Playwright/e2e suite | **High** | 3–5d | Regression blind spot | 1 |
| TD-07 | Owner E2E smoke on `admin.aistroyka.ai` not recorded | **Medium** | 0.5d | Operational confidence | 2 |
| TD-08 | `docs/roma/` vs `docs/audits/` index missing | **Low** | 0.5d | Doc sprawl | 6 |
| TD-09 | `groupDecisionReasonsBySeverity` test-only export | **Low** | 0.25d | Dead API surface | 7 |
| TD-10 | Main dashboard component size | **Low** | 1–2d | Maintainability | 8 |

---

## 11. Certification Matrix

| Dimension | Score | Key evidence |
|-----------|-------|--------------|
| Architecture | 7.0 | Solid module boundaries; V1/V3 IA drift; duplicate path rules |
| UI / UX | 8.0 | Executive V3 dashboard cohesive; legacy section pages differ |
| Security | 8.5 | Owner-only APIs, RLS on audit runs, middleware tests; admin host smoke gap |
| Performance | 8.0 | SSR probes, no dashboard client fetch, build passes |
| Reliability | 8.0 | Correct data sources; V1 sections lack live injection |
| Maintainability | 7.0 | Good naming; doc/code sprawl |
| Scalability | 7.5 | Owner-only traffic OK; probe cost bounded |
| Documentation | 6.5 | Many reports; no canonical index |
| Testability | 7.5 | 170 unit tests; no e2e for platform-admin |
| Operational readiness | 7.0 | CF Access gating; no recorded owner smoke |

**Overall weighted score: 7.6 / 10**

---

## 12. Tests Executed

```
Command: cd apps/web && bun test lib/platform-admin/
Total:   170
Passed:  170
Failed:  0
Skipped: 0
Files:   20
```

Additional build verification:

```
Command: bun run cf:build
Result:  PASS (OpenNext worker bundle complete)
```

No artificial tests were created for this certification.

---

## 13. Strengths

1. **Security posture** — fail-closed platform owner gates on all ROMA APIs; audit history table locked to service-role.
2. **Execution safety** — execution disabled everywhere with tested policy layer.
3. **Live data honesty** — probes, intelligence, and recommendations derived from evidence; no fabricated audit completion.
4. **Executive UX V3** — operations-center layout suitable for platform owners.
5. **Test coverage** — 170 unit tests across ROMA lib modules, all passing after certification fixes.
6. **Release build** — `cf:build` compiles after operator-precedence fix.

---

## 14. Weaknesses & Risks

1. **Legacy IA routes** still reachable and can contradict the live dashboard experience.
2. **No platform-admin e2e** — regressions in owner flows rely on unit tests and manual smoke.
3. **Admin host verification gap** — Cloudflare Access prevented unauthenticated certification smoke on `admin.aistroyka.ai`.
4. **Documentation sprawl** — 18+ audit docs plus 71 spec docs without a canonical index.
5. **Duplicate domain path rules** — maintenance hazard between quality graph and change intelligence.

---

## 15. Remaining Work (non-blocking for pilot)

1. Redirect or retire V1 `[section]` pages in favor of dedicated module routes.
2. Consolidate `PATH_TO_AREAS` and `PATH_CATALOG_DOMAIN_RULES` into shared constants.
3. Wire `buildRomaQaCenterModel({ dashboard, intelligence })` on section pages or remove unused branch.
4. Add platform-admin Playwright smoke (owner grant + safe audit refresh + audit history list).
5. Record owner smoke on `admin.aistroyka.ai` behind Cloudflare Access.
6. Publish `docs/audits/ROMA_DOCUMENTATION_INDEX.md` marking canonical vs superseded docs.

---

## 16. Final Certification

| Question | Answer |
|----------|--------|
| Is ROMA Operations Center production-grade today? | **No** — pilot-grade with documented gaps |
| Is ROMA Operations Center pilot-ready for platform owners? | **Yes** |
| Is ROMA Operations Center enterprise-ready? | **No** |
| **Recommendation** | **PILOT READY** |
| **ROMA_CERTIFIED** | **YES** |
| **ENTERPRISE_READY** | **NO** |

### Score summary

| Metric | Score |
|--------|-------|
| Architecture | 7.0 |
| Security | 8.5 |
| Performance | 8.0 |
| UX | 8.0 |
| Maintainability | 7.0 |
| Documentation | 6.5 |
| **Overall** | **7.6** |

---

*Certification V1 complete. Fixes committed on branch `security/platform-admin-separation`.*
