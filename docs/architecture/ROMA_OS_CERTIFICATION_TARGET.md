# ROMA OS Certification Target

**Program:** ROMA OS  
**Status:** Enterprise certification criteria  
**Date:** 2026-07-07  
**Version:** 1.0

Parent: [ROMA_OS_ARCHITECTURE.md](./ROMA_OS_ARCHITECTURE.md) · [ROMA_OS_ROADMAP.md](./ROMA_OS_ROADMAP.md)

---

## 1. Purpose

Defines the **certification target** for ROMA OS as an Engineering Intelligence Operating System. This document is the acceptance criteria for Stage 7 (Enterprise Certification).

**Current state:** ROMA OS architecture is **defined** (Stage 1). ROMA QA application is **pilot ready**. ROMA OS is **not yet certified**.

---

## 2. Certification Levels

| Level | Name | Meaning |
|-------|------|---------|
| **L0** | Undefined | No OS architecture |
| **L1** | Defined | Architecture docs complete |
| **L2** | Kernel Ready | `@aistroyka/roma-kernel` certified |
| **L3** | Platform Ready | Intelligence + Services extracted |
| **L4** | Application Ready | SDK + Registry operational |
| **L5** | Multi-App Ready | ≥3 registered applications |
| **L6** | Enterprise Certified | Full criteria below |

**Today:** L1 (Defined) + L2 partial (Kernel foundation v1)

---

## 3. Enterprise Certification Criteria

### 3.1 Kernel (L1)

| Criterion | Target | Current |
|-----------|--------|---------|
| Package exists | `@aistroyka/roma-kernel` | ✅ |
| Vendor-neutral boundary test | pass | ✅ |
| No business logic | types only | ✅ |
| Module contracts defined | `RomaModuleContract` | ✅ |
| All modules adopt kernel types | 100% | ~15% (Stage 0 re-exports) |
| Kernel certification doc | YES | ✅ |

Reference: [ROMA_KERNEL_CERTIFICATION.md](../kernel/ROMA_KERNEL_CERTIFICATION.md)

---

### 3.2 Intelligence (L2)

| Criterion | Target | Current |
|-----------|--------|---------|
| Dedicated package | `@aistroyka/roma-intelligence` | ❌ |
| Depends on kernel only | enforced | ❌ (monolithic) |
| Evidence normalization | pipeline | partial |
| Decision reasoning | explainable | ✅ (engineering intel) |
| Risk aggregation | cross-domain | partial |
| Confidence calculation | documented | ✅ |
| No vendor imports | enforced | ✅ |
| No UI / execution | enforced | ✅ |

---

### 3.3 Platform Services (L3)

| Criterion | Target | Current |
|-----------|--------|---------|
| Service contracts published | 8 services | design only |
| Health Service isolated | adapter-backed | monolithic probes |
| Audit Service isolated | safe readonly | ✅ behavior |
| History Service isolated | redaction enforced | ✅ behavior |
| Graph Service isolated | kernel types | partial |
| No duplicate fetch layers | single probe pass | ✅ |
| Service boundary tests | CI | ❌ |

---

### 3.4 Application SDK (L4)

| Criterion | Target | Current |
|-----------|--------|---------|
| SDK package | `@aistroyka/roma-app-sdk` | ❌ |
| Lifecycle hooks defined | yes | design |
| Manifest schema | yes | ✅ doc |
| Permission model | host-enforced | ✅ doc |
| Nav registration | yes | transitional (QA routes) |
| Compatibility checker | kernel version pin | ❌ |

---

### 3.5 Application Registry (L5)

| Criterion | Target | Current |
|-----------|--------|---------|
| Registry schema | complete | ✅ doc |
| Registry service | operational | ❌ |
| QA registered | `roma-qa` manifest | transitional |
| ≥3 applications registered | yes | ❌ (1 effective) |
| Enable/disable gates | owner approval | ❌ |

---

### 3.6 Applications (L6)

| Application | Certification requirement | Current |
|-------------|---------------------------|---------|
| **ROMA QA** | Pilot ready, kernel types, no vendor imports in app layer | **PILOT READY** (transitional) |
| **ROMA Security** | Registered + enabled | Planned |
| **ROMA Release** | Registered + enabled | Planned |
| **ROMA Architecture** | Registered | Planned |
| **ROMA Performance** | Registered | Planned |
| **ROMA AI** | LIVE gate compliant | Planned |
| **ROMA Mobile** | Store evidence only (no fabrication) | Planned |
| **ROMA Compliance** | Finance boundary enforced | Planned |

QA certification: [ROMA_OPERATIONS_CENTER_CERTIFICATION_V1.md](../audits/ROMA_OPERATIONS_CENTER_CERTIFICATION_V1.md) (~7.6/10 PILOT READY)

---

### 3.7 Adapters (L7)

| Criterion | Target | Current |
|-----------|--------|---------|
| Adapter package | `@aistroyka/roma-adapters` | ❌ |
| AISTROYKA Project Adapter | operational | ❌ (implicit) |
| No direct vendor calls outside adapters | 100% | ❌ (probes direct) |
| Playwright/Maestro/Appium isolated | yes | ❌ |
| Supabase/Cloudflare/GitHub isolated | yes | ❌ |
| OpenAI adapter with fallback disclosure | yes | ❌ |

---

### 3.8 Design Principles (All layers)

| Principle | Certification test |
|-----------|---------------------|
| P1 Evidence First | Every verdict has evidence refs |
| P2 Recommendation First | No autopilot execution |
| P3 Human in Control | Manual gates on mutations |
| P4 Unknown ≠ Pass | Probe failure → unknown |
| P5 Safe by Default | Read-only ops center |
| P6 Explainable | Decision reasons present |
| P7 Vendor Neutral | Boundary tests pass |
| P8 Project Neutral | Kernel has no AISTROYKA refs |
| P9 Learning w/o Acting | No feedback-triggered actions |
| P10 Deterministic before AI | Rules before LLM |
| P11 Backward Compatible | Aliases + redirects work |
| P12 Modular | Apps register without kernel change |

Reference: [ROMA_OS_DESIGN_PRINCIPLES.md](./ROMA_OS_DESIGN_PRINCIPLES.md)

---

### 3.9 Dependency Rules

| Criterion | Target | Current |
|-----------|--------|---------|
| No circular dependencies | enforced | ✅ (kernel leaf) |
| Downward-only imports | enforced | partial (transitional) |
| CI dependency lint | automated | ❌ |
| Adapter isolation lint | automated | ❌ |

Reference: [ROMA_OS_DEPENDENCY_RULES.md](./ROMA_OS_DEPENDENCY_RULES.md)

---

### 3.10 Host Environment (Platform Admin)

| Criterion | Target | Current |
|-----------|--------|---------|
| Owner-only access preserved | yes | ✅ |
| RBAC unchanged by ROMA OS work | yes | ✅ |
| Cloudflare config unchanged | yes | ✅ |
| Finance boundary on owner surfaces | yes | ✅ |
| No tenant admin merge | yes | ✅ |

**ROMA OS certification must not require weakening host security.**

---

## 4. Validation Suite (Target)

```bash
# Kernel
cd packages/roma-kernel && bun run test

# Kernel adoption
cd apps/web && bun test lib/platform-admin/roma-kernel-adoption.test.ts

# Platform admin regression
cd apps/web && bun test lib/platform-admin/

# Build chain
bun run cf:build

# Future: adapter boundary tests
# Future: intelligence package tests
# Future: SDK compatibility checker
# Future: registry manifest validator
```

---

## 5. Scoring Model (Target)

| Dimension | Weight | L1 Today | L6 Target |
|-----------|--------|----------|-----------|
| Architecture clarity | 15% | 9/10 | 10/10 |
| Kernel isolation | 15% | 9/10 | 10/10 |
| Intelligence extraction | 10% | 4/10 | 9/10 |
| Service boundaries | 15% | 3/10 | 9/10 |
| SDK + Registry | 10% | 2/10 | 9/10 |
| Application portfolio | 15% | 4/10 | 8/10 |
| Adapter isolation | 10% | 1/10 | 9/10 |
| Principle compliance | 10% | 7/10 | 10/10 |
| **Weighted overall** | 100% | **~5.5/10** | **≥9/10** |

---

## 6. Verdict Flags

### Current (Stage 1 complete)

| Flag | Value |
|------|-------|
| **ROMA_OS_DEFINED** | **YES** |
| **ROMA_KERNEL_READY** | **YES** (foundation v1) |
| **READY_FOR_ROMA_OS** | **YES** (Stage 2+ may proceed) |
| **ROMA_OS_CERTIFIED** | **NO** |
| **ENTERPRISE_READY** | **NO** |

### Enterprise target (Stage 7)

| Flag | Target |
|------|--------|
| **ROMA_OS_CERTIFIED** | **YES** |
| **ENTERPRISE_READY** | **YES** |
| **Multi-app portfolio** | ≥3 enabled applications |
| **Adapter isolation** | 100% |
| **Overall score** | ≥9/10 |

---

## 7. Certification Artifacts (Target)

Upon Stage 7 completion, publish:

- `docs/architecture/ROMA_OS_CERTIFICATION_REPORT.md`
- Updated [ROMA_DOCUMENTATION_INDEX.md](../audits/ROMA_DOCUMENTATION_INDEX.md)
- Per-application certification summaries
- Dependency audit evidence
- Adapter boundary test results

---

## 8. Non-Goals for Certification

Certification does **not** require:

- Public ROMA APIs
- Tenant-facing ROMA surfaces
- Execution engine enabled
- Android parity with iOS
- Production GA claims without deploy evidence
- Mobile store upload completion

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-07 | Enterprise certification target defined |
