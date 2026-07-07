# ROMA Documentation Index

**Status:** Canonical index (post-stabilization sprint)  
**Module:** ROMA Operations Center  
**Last updated:** 2026-07-07

Use this index to find **runtime-aligned** documentation vs **superseded** reports vs **spec-only** design docs.

---

## Canonical — runtime truth

These documents describe what is **shipped** on platform-admin testing routes.

| Document | Scope |
|----------|--------|
| [ROMA_OPERATIONS_CENTER_CERTIFICATION_V1.md](./ROMA_OPERATIONS_CENTER_CERTIFICATION_V1.md) | Platform certification verdict (PILOT READY) |
| [ROMA_STABILIZATION_SPRINT_REPORT.md](./ROMA_STABILIZATION_SPRINT_REPORT.md) | Stabilization sprint outcomes |
| [ROMA_EXECUTIVE_DASHBOARD_V3.md](./ROMA_EXECUTIVE_DASHBOARD_V3.md) | Executive Operations Center UI (Dashboard) |
| [ROMA_SAFE_READONLY_AUDIT_V1_REPORT.md](./ROMA_SAFE_READONLY_AUDIT_V1_REPORT.md) | Safe readonly audit module |
| [ROMA_SAFE_AUDIT_MANUAL_REFRESH_REPORT.md](./ROMA_SAFE_AUDIT_MANUAL_REFRESH_REPORT.md) | Manual refresh API behavior |
| [ROMA_RUN_HISTORY_IMPLEMENTATION_V1_REPORT.md](./ROMA_RUN_HISTORY_IMPLEMENTATION_V1_REPORT.md) | Audit history / saved snapshots |
| [ROMA_RUN_HISTORY_DESIGN.md](./ROMA_RUN_HISTORY_DESIGN.md) | Run history schema + RLS design |
| [ROMA_ENGINEERING_INTELLIGENCE_V1.md](./ROMA_ENGINEERING_INTELLIGENCE_V1.md) | Release/confidence rule engine |
| [ROMA_QUALITY_GRAPH_V1_REPORT.md](./ROMA_QUALITY_GRAPH_V1_REPORT.md) | Quality graph module |
| [ROMA_TEST_CATALOG_V1_REPORT.md](./ROMA_TEST_CATALOG_V1_REPORT.md) | Test catalog (read-only) |
| [ROMA_CHANGE_INTELLIGENCE_V1_REPORT.md](./ROMA_CHANGE_INTELLIGENCE_V1_REPORT.md) | Change intelligence module |
| [ROMA_EXECUTION_PLANNER_V1_REPORT.md](./ROMA_EXECUTION_PLANNER_V1_REPORT.md) | Execution planner (no runs) |
| [ROMA_EXECUTION_ENGINE_V1_DESIGN_REPORT.md](./ROMA_EXECUTION_ENGINE_V1_DESIGN_REPORT.md) | Execution engine policy (disabled) |
| [ROMA_LIVE_DATA_INTEGRATION_REPORT.md](./ROMA_LIVE_DATA_INTEGRATION_REPORT.md) | Live probe integration |
| [ROMA_LIVE_QUALITY_DASHBOARD_REPORT.md](./ROMA_LIVE_QUALITY_DASHBOARD_REPORT.md) | Quality dashboard service |
| [ROMA_QA_CENTER_V1_ARCHITECTURE_REPORT.md](./ROMA_QA_CENTER_V1_ARCHITECTURE_REPORT.md) | Historical architecture (partial; see V3 for dashboard) |

### Security (platform-admin boundary)

| Document | Scope |
|----------|--------|
| [../security/PLATFORM_ADMIN_OWNER_ONLY_ACCESS_REPORT.md](../security/PLATFORM_ADMIN_OWNER_ONLY_ACCESS_REPORT.md) | Owner-only access model |
| [../security/ADMIN_DOMAIN_TARGET_ARCHITECTURE.md](../security/ADMIN_DOMAIN_TARGET_ARCHITECTURE.md) | Admin host routing |
| [PLATFORM_ADMIN_P0_LOCKDOWN_REPORT.md](./PLATFORM_ADMIN_P0_LOCKDOWN_REPORT.md) | P0 API lockdown |

---

## Superseded — archived reference only

| Document | Superseded by |
|----------|---------------|
| [ROMA_EXECUTIVE_DASHBOARD_V2.md](./ROMA_EXECUTIVE_DASHBOARD_V2.md) | ROMA_EXECUTIVE_DASHBOARD_V3.md |
| [ROMA_UX_TRUST_HARDENING_REPORT.md](./ROMA_UX_TRUST_HARDENING_REPORT.md) | ROMA_EXECUTIVE_DASHBOARD_V3.md |
| [PLATFORM_ADMIN_ROMA_READONLY_PAGE_REPORT.md](./PLATFORM_ADMIN_ROMA_READONLY_PAGE_REPORT.md) | V3 dashboard + module pages |

---

## Spec-only — not wired to runtime UI

The [`docs/roma/`](../roma/) tree (71 files) contains strategic ROMA OS / intelligence specifications. **Do not treat as runtime behavior.**

| Document | Role |
|----------|------|
| [../roma/ROMA_CORE_SPEC.md](../roma/ROMA_CORE_SPEC.md) | Core specification |
| [../roma/ROMA_ARCHITECTURE.md](../roma/ROMA_ARCHITECTURE.md) | OS-level architecture |
| [../roma/ROMA_ROADMAP.md](../roma/ROMA_ROADMAP.md) | Strategic roadmap |

---

## Canonical route map

| Feature | Route |
|---------|-------|
| Executive Dashboard | `/[locale]/platform-admin/testing` |
| Safe Audit | `/[locale]/platform-admin/testing/safe-audit` |
| Audit History | `/[locale]/platform-admin/testing/audit-runs` |
| Quality Graph | `/[locale]/platform-admin/testing/quality-graph` |
| Test Catalog | `/[locale]/platform-admin/testing/test-catalog` |
| Change Intelligence | `/[locale]/platform-admin/testing/change-intelligence` |
| Execution Planner | `/[locale]/platform-admin/testing/execution-planner` |
| Execution Engine | `/[locale]/platform-admin/testing/execution-engine` |
| Platform Web/Mobile/Backend/AI/Security | `/[locale]/platform-admin/testing/{web,mobile,backend,ai,security}` |

### Legacy redirects

| Legacy | Canonical |
|--------|-----------|
| `/testing/audits` | `/testing/safe-audit` |
| `/testing/history` | `/testing/audit-runs` |
| `/testing/regression` | `/testing/change-intelligence` |
| `/testing/coverage` | `/testing/quality-graph` |
| `/testing/performance` | `/testing` |
| `/testing/reports` | `/testing` |

---

## Golden path E2E

- Spec: `apps/web/tests/e2e/platform-admin-golden-path.spec.ts`
- Env: `ROMA_PLATFORM_OWNER_EMAIL` / `ROMA_PLATFORM_OWNER_PASSWORD` or `QA_PLATFORM_OWNER_*`
