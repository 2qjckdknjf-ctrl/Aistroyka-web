# ROMA Quality Graph V1 Report

**Date:** 2026-07-04  
**Branch:** `security/platform-admin-separation`  
**Route:** `/[locale]/platform-admin/testing/quality-graph`  
**Verdict:** Deterministic read-only dependency model — no test execution

---

## Purpose

ROMA Quality Graph V1 is the first real dependency and quality model for AISTROYKA. It answers (statically, without execution):

1. What changed? (path/module/API input)
2. Which product areas are affected?
3. Which roles are affected?
4. Which APIs are affected?
5. Which mobile apps are affected?
6. Which tests will be required later?
7. Which risks increase?
8. Is release confidence reduced?

---

## Graph model

**Files:**
- `apps/web/lib/platform-admin/roma-quality-graph.types.ts`
- `apps/web/lib/platform-admin/roma-quality-graph.ts`

### Node types (14)

| Type | Purpose |
|------|---------|
| `product_area` | Major product domains |
| `business_flow` | End-to-end user flows |
| `app_surface` | Web/mobile/portal surfaces |
| `api` | Canonical API groups |
| `database` | Data stores |
| `role` | RBAC roles |
| `permission` | Reserved for V2 |
| `mobile_app` | Android/iOS binaries |
| `ai_capability` | Copilot, vision |
| `integration` | Stripe, Telegram |
| `infrastructure` | Worker, storage |
| `test_domain` | Future test catalog domains |
| `risk` | Release/ops risks |
| `release_gate` | Required gates before release |

### Edge types (10)

`depends_on`, `exposes`, `used_by`, `validates`, `affected_by`, `blocks`, `mitigates`, `requires`, `owns`, `observes`

### Graph properties

- `version: "v1"`
- `executionEnabled: false` (typed literal)
- Deterministic static nodes/edges — no filesystem, no network, no secrets

---

## Helper functions

| Function | Description |
|----------|-------------|
| `getQualityGraph()` | Full graph singleton |
| `getNodesByType(type)` | Filter nodes by type |
| `getEdgesForNode(nodeId)` | Incoming/outgoing edges |
| `getAffectedAreasForChange(input)` | Path/module/API → product areas |
| `getRequiredTestDomainsForAffectedAreas(areaIds)` | Areas → test domains |
| `getRisksForAffectedAreas(areaIds)` | Areas → risks |
| `getReleaseGateImpact(areaIds)` | Areas → release gates + confidence |
| `analyzeChangeImpact(input)` | Combined analysis |
| `getGraphSummary()` | Counts and critical nodes |

### Change input (V1)

```typescript
{
  changedPaths: string[];
  changedModules?: string[];
  changedApis?: string[];
}
```

---

## Initial AISTROYKA graph coverage

| Category | Count (approx.) |
|----------|-----------------|
| Product areas | 15 |
| Business flows | 6 |
| App surfaces | 8 |
| Roles | 8 |
| APIs | 11 |
| Mobile apps | 4 |
| Test domains | 10 |
| Risks | 10 |
| Release gates | 5 |
| Edges | 70+ |

### Critical mappings verified by tests

- **Worker reports** → storage API, mobile iOS/Android test domains, upload/storage/mobile parity risks
- **AI Copilot** → AI safety test domain, AI leakage risk, AI live release gate
- **Platform Admin** → security/RBAC tests, platform admin exposure risk, access audit gate

---

## UI

**Component:** `RomaQualityGraphClient`  
**Page:** `platform-admin/testing/quality-graph/page.tsx`

Displays structured tables (no fake charts):

- Graph summary (node/edge counts)
- Nodes by type grid
- Critical product areas
- High-severity risks
- App surfaces, roles
- Test domain map, risk map
- Example impact analysis (3 static examples)

**Navigation:** "Quality Graph" added to ROMA QA Center sub-nav.

---

## Limitations (V1)

1. Static graph — not synced from live codebase AST
2. Path mapping uses prefix/heuristic rules, not git diff integration
3. No `permission` nodes populated yet
4. No visual graph rendering (tables only)
5. No test catalog linkage — test domains are labels only
6. Example impact analysis is illustrative, not live CI/git
7. Mobile app impact derivation is simplified

---

## Examples

### Platform admin file change

```
changedPaths: ["apps/web/lib/platform-admin/shell-nav.ts"]
changedModules: ["platform-admin"]
→ pa-platform-admin, pa-roma-qa-center
→ td-security-rbac, td-release-smoke
→ risk-platform-admin-exposure
→ rg-platform-admin-access
```

### Worker report + iOS change

```
changedPaths: ["apps/web/app/api/v1/reports/route.ts", "ios/Shared/ReportSync.swift"]
changedApis: ["api-reports", "api-upload-storage"]
→ pa-worker-reports
→ td-mobile-ios, td-mobile-android, td-backend-api
→ risk-worker-upload-broken, risk-storage-unavailable, risk-mobile-parity-broken
```

---

## Next steps toward Test Catalog

| Phase | Scope |
|-------|-------|
| **V2 — Test Catalog** | Map test_domain nodes to concrete spec IDs and CI jobs |
| **V3 — Live diff** | Git PR diff → `getAffectedAreasForChange` input |
| **V4 — Graph viz** | Optional interactive dependency view |
| **V5 — Risk scoring** | Weighted release confidence from probe + graph |

---

## Security validation

| Control | Status |
|---------|--------|
| Platform owner route guard | Unchanged |
| No external calls | Verified in tests |
| No secrets in graph | Verified |
| No execution UI | Verified |
| Cloudflare Access | Not modified |

**Tests:** `apps/web/lib/platform-admin/roma-quality-graph.test.ts`

---

## Verdict flags

| Flag | Value |
|------|-------|
| `ROMA_QUALITY_GRAPH_V1_READY` | **YES** |
| `TEST_EXECUTION_ENABLED` | **NO** |
| `READY_FOR_TEST_CATALOG` | **YES** |
