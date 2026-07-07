# ROMA OS Dependency Rules

**Program:** ROMA OS  
**Status:** Official dependency policy  
**Date:** 2026-07-07  
**Version:** 1.0

Parent: [ROMA_OS_ARCHITECTURE.md](./ROMA_OS_ARCHITECTURE.md)

---

## 1. Core Rule

**Dependencies flow downward only.** Lower layers never import from higher layers. No circular dependencies.

```
L8 External Systems
        ↑
L7 Adapters
        ↑
L6 Applications
        ↑
L5 Application Registry
        ↑
L4 Application SDK
        ↑
L3 Platform Services
        ↑
L2 Intelligence
        ↑
L1 Kernel
```

**Kernel is the leaf.** It imports nothing from ROMA, AISTROYKA, or vendors.

---

## 2. Layer-by-Layer Rules

### L1 — Kernel

| May import | Must NOT import |
|------------|-----------------|
| TypeScript standard library | `apps/web`, `platform-admin` |
| Other kernel modules | Playwright, Maestro, Appium |
| | Supabase, Cloudflare, GitHub, OpenAI, Stripe |
| | Next.js, React, Worker APIs |
| | Intelligence, Services, Applications, Adapters |

**Enforcement:** `packages/roma-kernel/src/kernel-boundary.test.ts`

### L2 — Intelligence

| May import | Must NOT import |
|------------|-----------------|
| `@aistroyka/roma-kernel` | Applications, Adapters |
| Pure utility libraries (no vendor) | UI components, API routes |
| | Direct vendor SDKs |
| | Platform Admin modules (transitional: allowed until extraction) |

**Target:** `@aistroyka/roma-intelligence` package depending only on kernel.

### L3 — Platform Services

| May import | Must NOT import |
|------------|-----------------|
| Kernel | Applications |
| Intelligence (contracts) | Application-specific UI |
| Adapter **interfaces** (not implementations) | Direct vendor SDKs |
| | Execution engines (except policy evaluation) |

**Target:** Service packages consume adapters via dependency injection, not direct imports.

### L4 — Application SDK

| May import | Must NOT import |
|------------|-----------------|
| Kernel | Adapter implementations |
| Service **contracts** (interfaces) | Vendor SDKs |
| | Application business logic |

### L5 — Application Registry

| May import | Must NOT import |
|------------|-----------------|
| Kernel | Service implementations |
| SDK contracts | Adapter implementations |
| | Runtime probe logic |

### L6 — Applications

| May import | Must NOT import |
|------------|-----------------|
| Kernel (types only) | Other applications (direct) |
| SDK | Kernel internals beyond public exports |
| Service facades | Vendor SDKs |
| Host shell hooks (nav, layout) | Direct Supabase/CF/GitHub calls |

**Rule:** Cross-app correlation goes through **Platform Services**, not app-to-app imports.

### L7 — Adapters

| May import | Must NOT import |
|------------|-----------------|
| Vendor SDKs | Applications |
| Project-specific code | UI |
| Kernel types (for normalization output) | Intelligence reasoning |
| External HTTP clients | Platform Admin business logic |

**Rule:** Adapters are the **only** layer that may import Playwright, Supabase, Cloudflare, etc.

### L8 — External Systems

No ROMA imports. Observed only through adapters.

---

## 3. Module Dependency Map (Transitional)

Current `platform-admin` modules and their **target** layer:

| Module | Current | Target layer | Kernel adoption |
|--------|---------|--------------|-----------------|
| `roma-quality-dashboard.types.ts` | L3/L6 | L3 + kernel types | Stage 0 re-exports ✅ |
| `roma-engineering-intelligence.ts` | L2/L6 | L2 Intelligence | Stage 0 re-exports ✅ |
| `roma-live-probes.ts` | L7 (should be) | L7 via adapters | ❌ direct vendor calls |
| `roma-safe-readonly-audit.ts` | L3/L6 | L3 Audit Service | partial |
| `roma-run-history.service.ts` | L3/L6 | L3 History Service | partial |
| `roma-quality-graph.ts` | L3/L6 | L3 Graph Service | partial |
| `roma-test-catalog.ts` | L6 | L6 QA capability | Stage 0 re-exports ✅ |
| `roma-change-intelligence.ts` | L2/L6 | L2 Intelligence | Stage 0 re-exports ✅ |
| `roma-execution-planner.ts` | L6 | L6 QA capability | policy only |
| `roma-execution-engine-policy.ts` | L6 | L6 QA capability | disabled |
| `executive-dashboard-ui.ts` | L6 UI | Host shell + QA | Stage 0 re-exports ✅ |

**Transitional exception:** Until adapter extraction (Stage 6), `roma-live-probes.ts` may call vendor endpoints. New code **must not** add direct vendor imports outside adapters.

---

## 4. Package Dependency Graph (Target)

```mermaid
flowchart BT
  EXT[External Systems]
  ADP[@aistroyka/roma-adapters]
  APP[@aistroyka/roma-app-qa]
  REG[@aistroyka/roma-registry]
  SDK[@aistroyka/roma-app-sdk]
  SVC[@aistroyka/roma-services]
  INT[@aistroyka/roma-intelligence]
  KERN[@aistroyka/roma-kernel]

  EXT --> ADP
  ADP --> SVC
  APP --> SDK
  APP --> SVC
  REG --> SDK
  SDK --> SVC
  SDK --> KERN
  SVC --> INT
  SVC --> KERN
  INT --> KERN
  ADP --> KERN
```

**Today:** Only `@aistroyka/roma-kernel` exists as a package. Other boxes are **target packages** on the roadmap.

---

## 5. Forbidden Dependency Patterns

| Pattern | Why forbidden | Example |
|---------|---------------|---------|
| Kernel → Application | Breaks neutrality | kernel importing `roma-live-probes` |
| Kernel → Vendor | Breaks portability | kernel importing `@supabase/supabase-js` |
| Application → Vendor | Bypasses adapters | QA app calling Playwright directly |
| Application → Application | Hidden coupling | Security app importing QA service |
| Service → UI | Layer violation | audit service importing React |
| Adapter → Application | Inverts control | GitHub adapter importing QA planner |
| Intelligence → Execution | Autopilot risk | intel triggering test runs |

---

## 6. Host Environment Rules (Platform Admin)

Platform Admin is **outside** ROMA OS layers but **hosts** applications.

| Rule | Statement |
|------|-----------|
| **H-01** | ROMA OS docs must not mandate RBAC/security changes |
| **H-02** | Applications declare `required_permissions`; host enforces |
| **H-03** | Host shell provides layout/nav; apps register sections |
| **H-04** | Host APIs (`/api/v1/platform/*`) accessed via adapters or service facades |
| **H-05** | Cloudflare Access + owner grants remain host concern |

---

## 7. Kernel ↔ ROMA OS Relationship

```
ROMA OS (architecture)
  └── Layer 1 = @aistroyka/roma-kernel (implementation)
```

- Kernel adoption by modules: [ROMA_KERNEL_ADOPTION_PLAN.md](../kernel/ROMA_KERNEL_ADOPTION_PLAN.md)
- Kernel must remain unchanged when new applications register
- Applications depend on Kernel; Kernel never depends on Applications

---

## 8. Validation Checklist

| Check | Method | Status |
|-------|--------|--------|
| Kernel boundary | `kernel-boundary.test.ts` | ✅ enforced |
| No kernel vendor imports | boundary test + manual review | ✅ |
| Module re-exports use kernel types | `roma-kernel-adoption.test.ts` | ✅ |
| Adapter isolation | adapter package + lint rules | ❌ planned |
| Service extraction | package boundary tests | ❌ planned |
| No circular workspace deps | `madge` or custom CI | ❌ planned |

---

## 9. Migration Dependency Strategy

1. **Stage 1:** Kernel package (done) — leaf dependency
2. **Stage 2:** Re-export aliases in existing modules (done) — no new deps
3. **Stage 3:** Extract Intelligence package — depends on kernel only
4. **Stage 4:** Extract Service contracts — depend on kernel + intelligence
5. **Stage 5:** Publish Application SDK — depend on kernel + service contracts
6. **Stage 6:** Extract Adapters — depend on kernel; consumed by services
7. **Stage 7:** Register Applications — depend on SDK + services

**No stage may introduce upward dependencies.**

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-07 | Official dependency rules |
