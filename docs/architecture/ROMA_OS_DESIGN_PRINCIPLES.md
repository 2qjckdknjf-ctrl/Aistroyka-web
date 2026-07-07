# ROMA OS Design Principles

**Program:** ROMA OS  
**Status:** Official design principles  
**Date:** 2026-07-07  
**Version:** 1.0

Parent: [ROMA_OS_ARCHITECTURE.md](./ROMA_OS_ARCHITECTURE.md)

These principles are **normative**. Future applications, services, and adapters must comply. Exceptions require ADR and owner approval.

---

## 1. Principle Catalog

| # | Principle | Statement |
|---|-----------|-----------|
| P1 | **Evidence First** | No decision without traceable evidence. Every verdict cites sources. |
| P2 | **Recommendation First** | Output recommendations before actions. Suggest, do not autopilot. |
| P3 | **Human in Control** | Owners approve enablement, refresh, save, and execution. No silent automation. |
| P4 | **Unknown is not Pass** | Missing evidence → `unknown` / blocked — never inferred healthy. |
| P5 | **Safe by Default** | Fail closed. Read-only unless explicitly permitted. Execution disabled by default. |
| P6 | **Explainable** | Decisions include reasons, confidence, and recheck conditions. |
| P7 | **Vendor Neutral** | Kernel and Intelligence never bind to Playwright, Supabase, Cloudflare, etc. |
| P8 | **Project Neutral** | AISTROYKA is first deployment; OS definitions must generalize. |
| P9 | **Learning Without Acting** | Models may learn from feedback; they must not act without human gate. |
| P10 | **Deterministic before AI** | Rule-based reasoning first; LLM augmentation only with fallback disclosure. |
| P11 | **Backward Compatible** | Staged adoption. Legacy type names and routes preserved during migration. |
| P12 | **Modular** | Applications plug in without kernel changes. One concept, one definition. |

---

## 2. Principle Detail

### P1 — Evidence First

**Rule:** Every health status, finding, release decision, and recommendation must reference evidence with provenance.

| Required | Forbidden |
|----------|-----------|
| Probe source id | Synthetic "all green" without probes |
| Timestamp / freshness | Stale evidence presented as current |
| Redaction markers | Raw secrets in evidence bundles |

**Kernel types:** `RomaEvidence`, `RomaProbeEvidence`, `RomaSignal`

**AISTROYKA enforcement:** `runLiveProbes()` fail-closed; dashboard shows `Unknown` when probes fail.

---

### P2 — Recommendation First

**Rule:** ROMA OS recommends actions. It does not execute remediation, deploys, or test runs unless explicitly enabled and approved.

| Output | Example |
|--------|---------|
| Recommendation | "Re-run staging smoke before release" |
| Not allowed | Auto-trigger GitHub workflow |

**Execution Engine:** Policy evaluation only — execution **disabled** in production.

---

### P3 — Human in Control

**Rule:** Owner-initiated actions for mutations and high-impact reads.

| Human gate | Example |
|------------|---------|
| Manual audit refresh | Safe audit explicit refresh |
| Save audit run | Owner saves snapshot |
| App enablement | Registry `enabled: true` |
| Execution (future) | Explicit approval + policy pass |

---

### P4 — Unknown is not Pass

**Rule:** Absence of evidence is **unknown**, not pass.

```typescript
// Correct
status: "unknown"  // no probe evidence

// Forbidden
status: "healthy"  // inferred without probe
```

**Inventory rule:** [ROMA_PLATFORM_INVENTORY.md](../platform/ROMA_PLATFORM_INVENTORY.md) — never fabricate mobile/store health.

---

### P5 — Safe by Default

**Rule:** Read-only operations center. Fail closed on errors. No tenant data exposure on owner surfaces.

| Layer | Safe default |
|-------|--------------|
| Probes | Read-only GET/HEAD |
| Audit | Snapshot only |
| APIs | `requirePlatformOwnerApi` |
| Execution | Disabled |

**Finance boundary:** Customer/owner must never see internal contractor financial state (mega-roadmap).

---

### P6 — Explainable

**Rule:** Decisions include structured reasons understandable by engineering leadership.

**Kernel types:** `RomaDecisionReason`, `RomaRecommendation`

**Implemented:** Engineering intelligence `decisionReasons[]`, `reasoning[]`, `recheckConditions`.

---

### P7 — Vendor Neutral

**Rule:** Kernel and Intelligence import **no vendor SDKs**.

| Allowed in Kernel | Forbidden in Kernel |
|-------------------|---------------------|
| TypeScript | Playwright, Maestro, Appium |
| Kernel modules | Supabase, Cloudflare, GitHub |
| | OpenAI, Stripe, Next.js, React |

**Enforcement:** `kernel-boundary.test.ts`

**Vendor code lives in Layer 7 (Adapters) only.**

---

### P8 — Project Neutral

**Rule:** ROMA OS definitions must not embed AISTROYKA-specific assumptions in Kernel or Intelligence.

| Project-specific | OS-neutral |
|------------------|------------|
| AISTROYKA routes | `RomaSubsystem` metadata |
| `admin.aistroyka.ai` | Host adapter descriptor |
| Supabase project ref | Project adapter inventory |

**AISTROYKA Project Adapter** maps project facts → kernel types.

---

### P9 — Learning Without Acting

**Rule:** Feedback and learning models may improve recommendations. They must not trigger actions.

| Allowed | Forbidden |
|---------|-----------|
| Adjust confidence weights | Auto-run tests from learning |
| Surface patterns in history | Auto-merge PRs |
| Owner-visible insights | Silent config changes |

Prior art: [ROMA_FEEDBACK_MODEL.md](../roma/intelligence/ROMA_FEEDBACK_MODEL.md)

---

### P10 — Deterministic before AI

**Rule:** Rule-based engines produce primary decisions. AI augments only with explicit fallback disclosure.

| Order | Engine |
|-------|--------|
| 1 | Deterministic rules (`roma-engineering-intelligence.ts`) |
| 2 | Evidence coverage scoring |
| 3 | LLM augmentation (future, with `X-AI-Fallback-Reason` disclosure) |

**Live AI gate:** `scripts/smoke/ai_live_provider.sh --require-live`

---

### P11 — Backward Compatible

**Rule:** Staged adoption. No breaking renames without alias period.

| Mechanism | Example |
|-----------|---------|
| Type aliases | `BlockerSeverity` → `RomaSeverity` |
| Route redirects | `/testing/audits` → safe-audit |
| Doc preservation | `docs/roma/` unchanged |
| Module names | `roma-*` files kept until extraction |

Kernel adoption: [ROMA_KERNEL_ADOPTION_PLAN.md](../kernel/ROMA_KERNEL_ADOPTION_PLAN.md)

---

### P12 — Modular

**Rule:** One concept, one definition. Applications plug in without kernel changes.

| Before | After |
|--------|-------|
| Duplicate severity enums | `RomaSeverity` in kernel |
| QA = whole platform | QA = application on OS |
| Monolithic probes | Adapter + Health Service |

---

## 3. Principle Compliance Matrix

| Principle | Kernel | Intelligence | Services | SDK | Apps | Adapters |
|-----------|--------|--------------|----------|-----|------|----------|
| P1 Evidence First | types ✅ | ✅ partial | ✅ partial | contract | ✅ QA | normalize |
| P2 Recommendation First | types ✅ | ✅ | — | hook | ✅ | — |
| P3 Human in Control | — | — | audit ✅ | gate | ✅ | — |
| P4 Unknown ≠ Pass | status ✅ | ✅ | probes ✅ | — | ✅ | — |
| P5 Safe by Default | — | — | ✅ | — | ✅ | read-only |
| P6 Explainable | types ✅ | ✅ | — | — | ✅ | — |
| P7 Vendor Neutral | ✅ test | target | target | ✅ | target | vendor here |
| P8 Project Neutral | ✅ | target | partial | ✅ | QA ok | AISTROYKA |
| P9 Learning w/o Acting | — | spec | — | — | — | — |
| P10 Deterministic first | — | ✅ | — | — | ✅ | — |
| P11 Backward Compatible | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| P12 Modular | ✅ | target | target | design | target | target |

---

## 4. Anti-Patterns (Explicitly Forbidden)

| Anti-pattern | Violates |
|--------------|----------|
| Second health polling loop on client | P1, P5 |
| Fabricating mobile/store health | P4 |
| Auto-execution from dashboard | P2, P3 |
| Kernel importing Supabase | P7 |
| Merging tenant admin into ROMA | P5, P8 |
| Exposing internal finance to customer | P5, mega-roadmap |
| LLM verdict without fallback marker | P10 |
| Mass rename breaking links | P11 |

---

## 5. Constitution Alignment

Normative constitution: [ROMA_CONSTITUTION.md](../roma/os/ROMA_CONSTITUTION.md)

| Constitution article | Design principle |
|------------------------|------------------|
| Art. I.1 Evidence supremacy | P1 |
| Art. I.2 Human authority | P3 |
| Art. I.4 Vendor independence | P7, P8 |
| Art. I.6 Unknown discipline | P4 |
| Art. I.9 No autopilot | P2, P9 |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-07 | Official design principles |
