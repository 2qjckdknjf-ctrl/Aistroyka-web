# ROMA OS Application Model

**Program:** ROMA OS  
**Status:** Official application integration model  
**Date:** 2026-07-07  
**Version:** 1.0

Parent: [ROMA_OS_ARCHITECTURE.md](./ROMA_OS_ARCHITECTURE.md)

---

## 1. Purpose

Defines how **applications** integrate with ROMA OS — lifecycle, SDK contracts, registry schema, and the first wave of applications.

**Key principle:** Applications run **on** ROMA OS. They do not **define** ROMA OS.

---

## 2. Application vs Capability vs Module

| Term | Definition | Example |
|------|------------|---------|
| **Application** | Registered assurance product on ROMA OS | ROMA QA |
| **Capability** | Declared function within an application | Safe Audit, Quality Graph |
| **Module** | Transitional code unit in platform-admin | `roma-safe-readonly-audit.ts` |

Today, QA **capabilities** are implemented as **modules** under one application shell. Future applications may have one or many capabilities.

---

## 3. Application Lifecycle

```
proposed → registered → enabled → active → deprecated → retired
```

| State | Meaning | Registry | Runtime |
|-------|---------|----------|---------|
| **proposed** | Design/doc only | Optional draft entry | Not mounted |
| **registered** | Manifest accepted; compatibility verified | Full record | Nav hidden |
| **enabled** | Approved for owner use | `enabled: true` | Nav visible |
| **active** | Contributing evidence/decisions in a session | run binding | Executing read path |
| **deprecated** | Still readable; warnings on use | `stability: deprecated` | Visible with badge |
| **retired** | Historical reads only | `enabled: false` | Hidden; history preserved |

**Human gate:** `proposed → registered` and `registered → enabled` require explicit owner approval.

---

## 4. Application SDK Contract

### 4.1 Required Manifest Fields

```typescript
interface RomaApplicationManifest {
  /** Stable application identifier */
  id: RomaApplicationId;
  /** Human-readable name */
  name: string;
  /** Semver */
  version: string;
  /** Engineering owner team or role */
  owner: string;
  /** Kernel contract pin */
  kernelVersion: string;
  /** SDK contract version */
  sdkVersion: string;
  /** Declared capabilities */
  capabilities: RomaCapabilityDeclaration[];
  /** Platform-admin routes (host-relative) */
  routes: RomaApplicationRoute[];
  /** Platform services required */
  requiredServices: RomaServiceId[];
  /** Evidence types produced or consumed */
  requiredEvidence: RomaEvidenceKind[];
  /** Host permissions (platform_owner, …) */
  requiredPermissions: RomaPermission[];
  /** Stability tier */
  stability: RomaStabilityLevel;
  /** Other apps or adapters required */
  dependencies: RomaApplicationDependency[];
}
```

Kernel anchors: `RomaModuleContract`, `RomaStabilityLevel`, `RomaCapabilityKind` in `@aistroyka/roma-kernel`.

### 4.2 Lifecycle Hooks

| Hook | When | Responsibility |
|------|------|----------------|
| `onRegister` | Manifest accepted | Validate compatibility |
| `onEnable` | App enabled | Warm caches, verify adapters |
| `onNavRegister` | Shell mount | Provide nav items |
| `onHealthCollect` | Health cycle | Contribute probe declarations |
| `onEvidenceEmit` | Audit/run complete | Push evidence bundle |
| `onDisable` | App disabled | Release resources |
| `onRetire` | App retired | Archive manifest |

**No hook may mutate external systems without explicit owner action.**

### 4.3 Permission Model

Applications declare permissions; **host enforces**:

| Permission | Meaning |
|------------|---------|
| `platform_owner` | Requires platform owner grant |
| `read_tenant_metadata` | Read tenant counts/names (no business content) |
| `read_billing_diagnostics` | Owner billing pilot signals |
| `write_audit_snapshot` | Persist safe audit runs |
| `read_ci_metadata` | GitHub/workflow metadata via adapter |

Applications **must not** assume tenant admin or customer portal access.

### 4.4 Navigation Contract

```typescript
interface RomaApplicationRoute {
  path: string;
  labelKey: string;
  section: "executive" | "operations" | "delivery" | "applications";
  order: number;
  legacyRedirects?: string[];
}
```

Today: `roma-qa-center-routes.ts` implements QA routes with legacy redirects — **transitional SDK implementation**.

### 4.5 Evidence Contract

Applications emit evidence in kernel types:

- `RomaEvidence`, `RomaEvidenceBundle`
- `RomaFinding`, `RomaRecommendation`
- `RomaProbeEvidence` (via Health Service)

Redaction rules apply before persistence (see run history redaction).

### 4.6 Health Contract

Applications may:

- Declare probe dependencies
- Contribute component health cards
- Surface domain rollups

Applications may **not**:

- Run probes directly (must use Health Service → Adapters)
- Fabricate health without evidence

---

## 5. Application Registry Schema

Each registered application record:

| Field | Type | Required |
|-------|------|----------|
| `id` | string | ✅ |
| `name` | string | ✅ |
| `version` | semver | ✅ |
| `owner` | string | ✅ |
| `capabilities` | string[] | ✅ |
| `routes` | route[] | ✅ |
| `required_services` | service id[] | ✅ |
| `required_evidence` | evidence kind[] | ✅ |
| `required_permissions` | permission[] | ✅ |
| `stability` | RomaStabilityLevel | ✅ |
| `dependencies` | dependency[] | ✅ |
| `adapters` | adapter id[] | optional |
| `enabled` | boolean | ✅ |
| `registered_at` | ISO datetime | ✅ |

**Storage:** Registry implementation is Stage 5 roadmap. Until then, registry is **documentation + manifest files**.

---

## 6. First Applications

### 6.1 ROMA QA — **Implemented** (transitional)

| Field | Value |
|-------|-------|
| **id** | `roma-qa` |
| **Purpose** | Multi-surface quality assurance for release readiness |
| **Status** | **Implemented** — Operations Center on `/platform-admin/testing` |
| **Stability** | `pilot` |
| **Owner** | platform-engineering |

**Capabilities (implemented as modules):**

| Capability | Module | Route |
|------------|--------|-------|
| Executive Dashboard | `PlatformAdminTestingClient`, dashboard service | `/platform-admin/testing` |
| Safe Audit | `roma-safe-readonly-audit.ts` | `/platform-admin/testing/safe-audit` |
| Audit History | `roma-run-history.service.ts` | `/platform-admin/testing/audit-runs` |
| Engineering Intelligence | `roma-engineering-intelligence.ts` | (embedded in dashboard) |
| Quality Graph | `roma-quality-graph.ts` | `/platform-admin/testing/quality-graph` |
| Test Catalog | `roma-test-catalog.ts` | `/platform-admin/testing/test-catalog` |
| Change Intelligence | `roma-change-intelligence.ts` | `/platform-admin/testing/change-intelligence` |
| Execution Planner | `roma-execution-planner.ts` | (policy only) |
| Execution Engine | `roma-execution-engine-policy.ts` | **disabled** |

**Evidence:** 15 live probe sources, audit snapshots, saved runs  
**Certification:** [ROMA_OPERATIONS_CENTER_CERTIFICATION_V1.md](../audits/ROMA_OPERATIONS_CENTER_CERTIFICATION_V1.md) — PILOT READY

---

### 6.2 ROMA Security — **Planned**

| Field | Value |
|-------|-------|
| **id** | `roma-security` |
| **Purpose** | AuthZ, exposure, headers, finance denylist, RBAC drift |
| **Status** | **Planned** |
| **Inputs** | Sensitive endpoint catalog, RBAC matrix, security probes |
| **Outputs** | R0–R4 findings, security domain verdict |
| **Required services** | health, evidence, audit |
| **Adapters** | supabase, api-probe, security-headers |

---

### 6.3 ROMA Release — **Planned**

| Field | Value |
|-------|-------|
| **id** | `roma-release` |
| **Purpose** | Release gates, env validation, deploy alignment |
| **Status** | **Planned** |
| **Inputs** | buildStamp, staging/prod parity, migration state |
| **Outputs** | Release decision bundle, blocker list |
| **Required services** | release, health, history |
| **Adapters** | cloudflare, github, supabase |

---

### 6.4 ROMA Architecture — **Planned**

| Field | Value |
|-------|-------|
| **id** | `roma-architecture` |
| **Purpose** | Boundary drift, dependency cycles, naming alignment |
| **Status** | **Planned** |
| **Inputs** | Repo graph, CORE_B* audit signals |
| **Outputs** | Architecture findings, boundary score |
| **Required services** | graph, capability |

---

### 6.5 ROMA Performance — **Planned**

| Field | Value |
|-------|-------|
| **id** | `roma-performance` |
| **Purpose** | CWV, latency, load, bundle size |
| **Status** | **Planned** |
| **Adapters** | lighthouse, cloudflare observability |

---

### 6.6 ROMA AI — **Planned**

| Field | Value |
|-------|-------|
| **id** | `roma-ai` |
| **Purpose** | LIVE/FALLBACK governance, provider health, leakage checks |
| **Status** | **Planned** |
| **Adapters** | openai, ai-live-probe |
| **Principle** | Deterministic before AI |

---

### 6.7 ROMA Mobile — **Planned**

| Field | Value |
|-------|-------|
| **id** | `roma-mobile` |
| **Purpose** | iOS/Android store readiness, device smoke, UITest signals |
| **Status** | **Planned** |
| **Adapters** | appium, maestro, asc, google-play |
| **Note** | iOS primary; Android deferred per product policy |

---

### 6.8 ROMA Compliance — **Planned**

| Field | Value |
|-------|-------|
| **id** | `roma-compliance` |
| **Purpose** | Policy adherence, audit trail, retention, finance isolation |
| **Status** | **Planned** |
| **Constraint** | Customer finance boundary — never expose internal contractor financials |

---

### 6.9 Future Applications

| Application | Status | Notes |
|-------------|--------|-------|
| ROMA DevOps | Future | CI/CD correlation |
| ROMA Product Quality | Future | UX/pilot metrics |
| ROMA Data | Future | Migration parity, RLS audits |
| Third-party apps | Future | Marketplace governance TBD |

---

## 7. Application Integration Checklist

Before an application moves from **proposed → registered**:

- [ ] Manifest complete (all required fields)
- [ ] Kernel types used for evidence/findings
- [ ] No direct vendor imports in application code
- [ ] Required services identified
- [ ] Permissions declared and host-enforceable
- [ ] Navigation routes defined with legacy redirects if replacing QA capabilities
- [ ] Stability level assigned
- [ ] Certification target defined
- [ ] Backward compatibility plan documented

---

## 8. Relationship to Stage 0–2B Specs

| Legacy spec | ROMA OS mapping |
|-------------|-----------------|
| ROMA QA Framework (Stages 0–2B) | ROMA QA application specification |
| `docs/roma/intelligence/*` | Intelligence layer reference |
| `docs/roma/os/ROMA_APPLICATION_MODEL.md` | Prior Stage 2C draft — preserved |
| `docs/roma/schemas/*` | Future kernel contract artifacts |

**No mass rename.** Stage 0–2B docs remain valid as QA app specs.

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-07 | Official application model |
