# ROMA OS Architecture

**Program:** ROMA — Engineering Intelligence Operating System  
**Status:** Official architecture definition (documentation only)  
**Branch:** `security/platform-admin-separation`  
**Date:** 2026-07-07  
**Version:** 1.0

Related: [ROMA_OS_LAYER_MODEL.md](./ROMA_OS_LAYER_MODEL.md) · [ROMA_OS_DEPENDENCY_RULES.md](./ROMA_OS_DEPENDENCY_RULES.md) · [ROMA_OS_APPLICATION_MODEL.md](./ROMA_OS_APPLICATION_MODEL.md) · [ROMA_OS_DESIGN_PRINCIPLES.md](./ROMA_OS_DESIGN_PRINCIPLES.md) · [ROMA_OS_ROADMAP.md](./ROMA_OS_ROADMAP.md) · [ROMA_OS_CERTIFICATION_TARGET.md](./ROMA_OS_CERTIFICATION_TARGET.md)

Prior art (preserved, not superseded): [ADR-0009](../roma/adr/ADR-0009-ROMA-OS-EVOLUTION.md) · [docs/roma/os/](../roma/os/) · [@aistroyka/roma-kernel](../../packages/roma-kernel/)

---

## 1. What ROMA OS Is

**ROMA OS** (Reliable Operations & Modular Assurance — Operating System) is the **Engineering Intelligence Operating System** for platform engineering.

It is **not**:

| Misconception | Truth |
|---------------|-------|
| A QA tool | QA is the **first application** running on ROMA OS |
| The Executive Dashboard | Dashboard is a **surface** of the QA application today |
| Platform Admin | Platform Admin is the **host shell** for owner surfaces |
| The Kernel | Kernel is **Layer 1** — domain contracts only |
| A monolithic module | ROMA OS is a **layered platform** with pluggable applications |

ROMA OS **is**:

- The canonical **operating model** for engineering intelligence
- A **vendor-neutral, project-neutral, execution-neutral** platform
- The place where **evidence becomes decisions** without autopilot
- The foundation every future assurance application plugs into

---

## 2. Vision

```
Platform Owner / Engineering Leadership
              ↓
┌─────────────────────────────────────────────────────────────┐
│                      ROMA OS (Operating System)                │
│  Applications run here. Kernel never changes for new apps.   │
├─────────────────────────────────────────────────────────────┤
│  L6 Applications    QA │ Security │ Release │ Mobile │ …   │
│  L5 Registry          catalog of installed applications     │
│  L4 Application SDK     lifecycle, permissions, navigation  │
│  L3 Platform Services   health, audit, evidence, graph, …   │
│  L2 Intelligence        reasoning, risk, confidence, impact   │
│  L1 Kernel              @aistroyka/roma-kernel (contracts)    │
├─────────────────────────────────────────────────────────────┤
│  L7 Adapters            project + tool + evidence bridges     │
│  L8 External Systems    AISTROYKA, GitHub, Supabase, CF, …  │
└─────────────────────────────────────────────────────────────┘
```

**AISTROYKA** is the first **project**. **ROMA QA** is the first **application**. Everything else is planned or future.

---

## 3. Current Repository Reality (Evidence)

Today on `security/platform-admin-separation`:

| ROMA OS concept | Repository evidence | Maturity |
|-----------------|---------------------|----------|
| **Kernel (L1)** | `packages/roma-kernel/` — types/contracts, boundary tests | **Implemented** (foundation v1) |
| **Intelligence (L2)** | `roma-engineering-intelligence.ts`, change intelligence | **Partial** — rules, not full layer |
| **Platform Services (L3)** | probes, dashboard, safe audit, run history, graph, catalog | **Partial** — monolithic in platform-admin |
| **Application SDK (L4)** | `RomaModuleContract` in kernel | **Design + contract stub** |
| **Application Registry (L5)** | `ROMA_PLATFORM_MODEL.md`, subsystem inventory | **Design** |
| **Applications (L6)** | Operations Center modules under `/platform-admin/testing` | **QA app transitional** |
| **Adapters (L7)** | Direct probe coupling to Supabase/CF/health APIs | **Gap** — adapters not extracted |
| **External (L8)** | AISTROYKA monorepo, Cloudflare, Supabase, GitHub CI | **Production** |

**Transitional framing:** The "ROMA Operations Center" / "ROMA QA Center" is the **first application shell** hosting QA capabilities. It is **not** ROMA OS itself. ROMA OS is the architecture all such shells must converge to.

---

## 4. Layer Responsibilities (Summary)

| Layer | Responsibility | Imports allowed |
|-------|----------------|-----------------|
| **L1 Kernel** | Canonical domain model, contracts, ontology | Nothing ROMA/vendor-specific |
| **L2 Intelligence** | Evidence normalization, reasoning, risk, confidence | Kernel only |
| **L3 Platform Services** | Shared read models: health, audit, evidence, graph | Kernel + Intelligence |
| **L4 Application SDK** | App lifecycle, registration, permissions, nav hooks | Kernel + Services contracts |
| **L5 Application Registry** | Installed apps, versions, capabilities, dependencies | Kernel + SDK contracts |
| **L6 Applications** | Domain-specific assurance (QA, Security, …) | SDK + Services (never Kernel internals directly for vendor logic) |
| **L7 Adapters** | Project/tool/evidence bridges | External SDKs allowed here only |
| **L8 External Systems** | Vendors, repos, CI, databases | N/A |

Full detail: [ROMA_OS_LAYER_MODEL.md](./ROMA_OS_LAYER_MODEL.md)

---

## 5. QA Is an Application

### Before (transitional)

```
ROMA = QA Center = whole platform
  ├── Executive Dashboard
  ├── Safe Audit
  ├── Engineering Intelligence
  ├── Quality Graph
  └── …
```

### After (ROMA OS)

```
ROMA OS
  └── Application: ROMA QA (implemented, transitional packaging)
        ├── Capability: Executive Dashboard
        ├── Capability: Safe Audit
        ├── Capability: Engineering Intelligence
        ├── Capability: Quality Graph
        ├── Capability: Test Catalog
        ├── Capability: Change Intelligence
        ├── Capability: Execution Planner (policy only)
        └── Capability: Execution Engine (disabled)
  └── Application: ROMA Security (planned)
  └── Application: ROMA Release (planned)
  └── …
```

**Rule:** New assurance domains register as **applications**, not as kernel modules or OS renames.

---

## 6. Platform Admin Relationship

Platform Admin (`admin.aistroyka.ai`, `/platform-admin/*`) is the **host environment** for ROMA OS applications on AISTROYKA.

| Component | Role in ROMA OS |
|-----------|-----------------|
| Cloudflare Access + owner grants | **Host security** — not ROMA OS |
| Platform Admin shell nav | **Host navigation** — apps register sections |
| `/platform-admin/testing` | **QA application entry** today |
| `/api/v1/platform/*` | **Host APIs** — apps consume via adapters |

ROMA OS architecture **must not** change Platform Admin security, RBAC, or Cloudflare configuration. Applications declare required permissions; the host enforces them.

---

## 7. Kernel Boundary (Verified)

`@aistroyka/roma-kernel` is vendor-neutral by enforcement:

- `kernel-boundary.test.ts` forbids imports from `apps/web`, `platform-admin`, `next/`, `react`
- No Playwright, Maestro, Appium, Supabase, Cloudflare, GitHub, OpenAI, Stripe, Worker APIs
- Types and contracts only — no business logic, UI, networking, persistence, execution

Kernel certification: [ROMA_KERNEL_CERTIFICATION.md](../kernel/ROMA_KERNEL_CERTIFICATION.md)

---

## 8. Intelligence Layer (Design)

Intelligence sits **above Kernel**, **below Services**. It transforms normalized evidence into explainable decisions.

Responsibilities (no UI, no execution):

- Evidence normalization → kernel `RomaEvidence` shapes
- Decision reasoning → `RomaDecision`, `RomaDecisionReason`
- Risk aggregation → `RomaRiskLevel`, cross-domain rollups
- Recommendation generation → `RomaRecommendation`
- Confidence calculation → `RomaConfidence`
- Dependency evaluation → `RomaDependencyGraph`
- Impact analysis → `RomaReleaseImpact`, affected areas

Today: `roma-engineering-intelligence.ts` implements a **subset** (release/confidence rules). Full layer extraction is Stage 3 on the roadmap.

Prior intelligence specs: [docs/roma/intelligence/](../roma/intelligence/)

---

## 9. Platform Services (Design)

Shared services consumed by all applications. **Responsibilities only** — no new implementation in this document.

| Service | Responsibility |
|---------|----------------|
| **Health Service** | Aggregate probe/component health into kernel snapshots |
| **Audit Service** | Safe readonly audit snapshots, manual refresh semantics |
| **Release Service** | Release readiness, decision bundles, impact summaries |
| **Evidence Service** | Ingest, store references, redact, bundle evidence |
| **Capability Service** | Subsystem/capability registry reads |
| **Graph Service** | Quality/dependency graph materialization |
| **Registry Service** | Application + adapter catalog |
| **History Service** | Saved runs, audit history, temporal comparison |

Today these exist as **monolithic modules** in `apps/web/lib/platform-admin/`. Stage 4–5 roadmap extracts service contracts without breaking runtime.

---

## 10. Application SDK & Registry (Design)

**SDK** defines how applications integrate: lifecycle, registration, permissions, capabilities, navigation hooks, evidence emission, health contribution.

**Registry** catalogs each application:

`id`, `name`, `version`, `owner`, `capabilities`, `routes`, `required_services`, `required_evidence`, `required_permissions`, `stability`, `dependencies`

Contract stub: `RomaModuleContract` in `@aistroyka/roma-kernel`.

Detail: [ROMA_OS_APPLICATION_MODEL.md](./ROMA_OS_APPLICATION_MODEL.md)

---

## 11. Adapters (Design)

All vendor and project coupling flows through **adapters**. Applications never import Playwright, Supabase, or Cloudflare directly.

| Adapter | Purpose |
|---------|---------|
| **AISTROYKA Project Adapter** | Routes, RBAC, mobile apps, finance boundaries, env descriptors |
| **GitHub Adapter** | CI status, workflow runs, commit metadata |
| **Supabase Adapter** | DB reachability, migration awareness, auth probes |
| **Cloudflare Adapter** | Deploy target, buildStamp, Worker health |
| **OpenAI Adapter** | LIVE/FALLBACK probe, provider health |
| **Playwright Adapter** | Web test execution and traces |
| **Appium / Maestro Adapters** | Mobile execution |

Today: `roma-live-probes.ts` **violates** adapter isolation (direct vendor calls). Stage 6+ extracts adapters without changing probe outcomes.

Prior art: [ROMA_ADAPTER_MODEL.md](../roma/os/ROMA_ADAPTER_MODEL.md)

---

## 12. Dependency Direction

Strict top-down. No reverse dependencies.

```
External Systems
       ↑
   Adapters
       ↑
  Applications
       ↑
Application Registry
       ↑
 Application SDK
       ↑
Platform Services
       ↑
  Intelligence
       ↑
    Kernel
```

Full rules: [ROMA_OS_DEPENDENCY_RULES.md](./ROMA_OS_DEPENDENCY_RULES.md)

---

## 13. Design Principles

Official principles: [ROMA_OS_DESIGN_PRINCIPLES.md](./ROMA_OS_DESIGN_PRINCIPLES.md)

Non-negotiable: Evidence First, Human in Control, Unknown is not Pass, Vendor Neutral, Deterministic before AI.

---

## 14. Roadmap & Certification

- Roadmap: [ROMA_OS_ROADMAP.md](./ROMA_OS_ROADMAP.md)
- Enterprise certification target: [ROMA_OS_CERTIFICATION_TARGET.md](./ROMA_OS_CERTIFICATION_TARGET.md)

---

## 15. Documentation Hierarchy

| Tier | Location | Authority |
|------|----------|-----------|
| **ROMA OS (this tree)** | `docs/architecture/ROMA_OS_*` | **Official OS architecture** |
| **Kernel** | `docs/kernel/` | Layer 1 implementation truth |
| **Platform integration** | `docs/platform/` | AISTROYKA subsystem inventory |
| **Runtime modules** | `docs/audits/ROMA_*` | Shipped QA app behavior |
| **Stage 0–2B specs** | `docs/roma/` | Preserved QA/intelligence specs |

---

## 16. Verdict

| Flag | Value |
|------|-------|
| **ROMA_OS_DEFINED** | **YES** — official architecture v1 |
| **Architecture-only change** | **YES** — no runtime modifications |
| **Kernel unchanged** | **YES** |
| **Backward compatible** | **YES** — transitional QA packaging preserved |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-07 | Official ROMA OS architecture definition |
