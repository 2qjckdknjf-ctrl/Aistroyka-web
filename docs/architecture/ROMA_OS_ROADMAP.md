# ROMA OS Roadmap

**Program:** ROMA OS  
**Status:** Official roadmap  
**Date:** 2026-07-07  
**Version:** 1.0

Parent: [ROMA_OS_ARCHITECTURE.md](./ROMA_OS_ARCHITECTURE.md)

---

## 1. Roadmap Overview

| Stage | Name | Layer focus | Status |
|-------|------|-------------|--------|
| **1** | Architecture | All layers defined | **✅ This commit** |
| **2** | Kernel adoption | L1 | **In progress** (foundation v1 shipped) |
| **3** | Intelligence layer | L2 | Planned |
| **4** | Application SDK | L4 | Planned |
| **5** | Application Registry | L5 | Planned |
| **6** | Applications | L6 | QA partial; others planned |
| **7** | Enterprise certification | All | Target |

---

## 2. Stage 1 — Architecture ✅

**Goal:** Official ROMA OS architecture definition.

**Deliverables:**

- [x] `docs/architecture/ROMA_OS_ARCHITECTURE.md`
- [x] `docs/architecture/ROMA_OS_LAYER_MODEL.md`
- [x] `docs/architecture/ROMA_OS_DEPENDENCY_RULES.md`
- [x] `docs/architecture/ROMA_OS_APPLICATION_MODEL.md`
- [x] `docs/architecture/ROMA_OS_DESIGN_PRINCIPLES.md`
- [x] `docs/architecture/ROMA_OS_ROADMAP.md`
- [x] `docs/architecture/ROMA_OS_CERTIFICATION_TARGET.md`

**Constraints:** Documentation only. No APIs, routes, UI, DB, AI, execution, security, RBAC, Cloudflare, Platform Admin, or Kernel implementation changes.

**Exit criteria:** `ROMA_OS_DEFINED = YES`

---

## 3. Stage 2 — Kernel Adoption

**Goal:** All ROMA modules consume kernel types; eliminate duplicate enums.

**Reference:** [ROMA_KERNEL_ADOPTION_PLAN.md](../kernel/ROMA_KERNEL_ADOPTION_PLAN.md)

| Sub-stage | Work | Status |
|-----------|------|--------|
| 2.0 | `@aistroyka/roma-kernel` package | ✅ Done |
| 2.1 | Re-export aliases (5 type files) | ✅ Done |
| 2.2 | Executive Dashboard kernel imports | Planned |
| 2.3 | Safe Audit + History alignment | Planned |
| 2.4 | Intelligence type migration | Planned |
| 2.5 | Graph + Catalog + Change intel | Planned |
| 2.6 | Full module contract compliance | Planned |

**Exit criteria:** No duplicate severity/confidence/risk/release enums in platform-admin.

---

## 4. Stage 3 — Intelligence Layer

**Goal:** Extract reasoning into `@aistroyka/roma-intelligence` depending on kernel only.

| Work item | Source module |
|-----------|---------------|
| Decision engine extraction | `roma-engineering-intelligence.ts` |
| Change impact analysis | `roma-change-intelligence.ts` |
| Evidence normalization pipeline | new |
| Risk aggregation service | new |
| Confidence scoring | existing rules |
| Recommendation generator | existing rules |

**Dependencies:** Kernel only (L1)

**Constraints:** No UI, no execution, no vendor imports.

**Exit criteria:** Intelligence package with tests; platform-admin imports intelligence package.

---

## 5. Stage 4 — Application SDK

**Goal:** Publish `@aistroyka/roma-app-sdk` with lifecycle, registration, and host integration contracts.

| Work item | Description |
|-----------|-------------|
| SDK package | Manifest types, lifecycle hooks |
| Nav registration API | Shell integration contract |
| Evidence emission API | Kernel-typed emit hooks |
| Permission declarations | Host-enforced model |
| Compatibility checker | Kernel version pin validation |

**Dependencies:** Kernel + Service contracts (interfaces)

**Exit criteria:** QA app registrable via SDK manifest (even if still monolithic internally).

---

## 6. Stage 5 — Application Registry

**Goal:** Canonical registry of installed applications.

| Work item | Description |
|-----------|-------------|
| Registry schema | Per [ROMA_OS_APPLICATION_MODEL.md](./ROMA_OS_APPLICATION_MODEL.md) |
| Registry Service | Read API for owner shell (future) |
| QA manifest | First registered application |
| Platform subsystem registry | Link to [ROMA_PLATFORM_MODEL.md](../platform/ROMA_PLATFORM_MODEL.md) |

**Dependencies:** SDK + Kernel

**Exit criteria:** QA app visible in registry with capabilities, routes, dependencies.

---

## 7. Stage 6 — Applications

**Goal:** Register and enable assurance applications beyond monolithic QA packaging.

### 6.1 QA Application Formalization

| Work | Description |
|------|-------------|
| QA manifest | Register `roma-qa` officially |
| Capability boundaries | Document module → capability map |
| Service extraction | Health, Audit, History as services |

### 6.2 Adapter Extraction (L7)

| Adapter | Replaces |
|---------|----------|
| AISTROYKA Project Adapter | Hardcoded AISTROYKA assumptions |
| Supabase Adapter | Direct DB probes |
| Cloudflare Adapter | buildStamp/health probes |
| GitHub Adapter | CI metadata (future) |
| Playwright Adapter | E2E execution (future) |

**Critical gap:** `roma-live-probes.ts` direct vendor calls → adapter isolation.

### 6.3 New Applications (sequenced)

| Order | Application | Prerequisite |
|-------|-------------|--------------|
| 1 | ROMA Security | Adapters + Health Service |
| 2 | ROMA Release | Cloudflare + GitHub adapters |
| 3 | ROMA AI | OpenAI adapter + LIVE gate |
| 4 | ROMA Mobile | ASC/Play adapters |
| 5 | ROMA Architecture | Graph + repo adapter |
| 6 | ROMA Performance | Lighthouse adapter |
| 7 | ROMA Compliance | Audit + policy services |

**Exit criteria:** ≥2 registered applications; adapters isolated; no direct vendor imports in apps.

---

## 8. Stage 7 — Enterprise Certification

**Goal:** ROMA OS certified for enterprise platform engineering use.

**Reference:** [ROMA_OS_CERTIFICATION_TARGET.md](./ROMA_OS_CERTIFICATION_TARGET.md)

| Dimension | Target |
|-----------|--------|
| Kernel | Certified foundation |
| Intelligence | Extracted + tested |
| Services | Contracted + isolated |
| SDK + Registry | Operational |
| Applications | QA + ≥2 others enabled |
| Adapters | Vendor-neutral boundary enforced |
| Security | Host gates unchanged |
| Documentation | Complete + indexed |

**Exit criteria:** `ROMA_OS_CERTIFIED = YES`, `ENTERPRISE_READY = YES`

---

## 9. Migration Strategy

### Principles

1. **Integrate, don't rewrite** — existing modules keep working
2. **Staged extraction** — package boundaries before file moves
3. **Alias period** — legacy names until Stage 6 complete
4. **No mass rename** — `docs/roma/` preserved
5. **Backward compatible routes** — legacy redirects maintained

### Phase Mapping

| ROMA OS Stage | Related work |
|---------------|--------------|
| Stage 2 | Kernel adoption plan |
| Stage 3–5 | Platform integration program Phase 2–4 |
| Stage 6 | Adapter model (ADR-0009 Phase 3) |
| Stage 7 | Operations Center certification v2+ |

### What NOT to migrate in early stages

- Platform Admin security model
- Execution engine (stays disabled)
- Tenant dashboard / customer surfaces
- Billing entitlement resolution
- Mobile store upload gates

---

## 10. Timeline (Indicative)

| Stage | Indicative duration | Dependency |
|-------|---------------------|--------------|
| 1 Architecture | Complete | — |
| 2 Kernel adoption | 2–4 sprints | Stage 1 |
| 3 Intelligence | 2–3 sprints | Stage 2 |
| 4 SDK | 1–2 sprints | Stage 2 |
| 5 Registry | 1–2 sprints | Stage 4 |
| 6 Applications | 4–8 sprints | Stages 3–5 |
| 7 Certification | 1–2 sprints | Stage 6 |

**Note:** Durations are planning estimates, not commitments.

---

## 11. Success Metrics

| Metric | Stage 2 | Stage 6 | Stage 7 |
|--------|---------|---------|---------|
| Duplicate enums | 0 | 0 | 0 |
| Kernel boundary test | pass | pass | pass |
| Registered applications | 1 (QA) | ≥3 | ≥5 |
| Adapter-isolated probes | 0% | 100% | 100% |
| Direct vendor imports in apps | transitional | 0 | 0 |
| ROMA OS docs complete | ✅ | ✅ | ✅ |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-07 | Official ROMA OS roadmap |
