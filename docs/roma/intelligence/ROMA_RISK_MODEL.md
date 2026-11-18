# ROMA Risk Model

**Document ID:** ROMA-INT-CORE-005  
**Version:** 1.0  
**Date:** 2026-07-03  
**Status:** Stage 2A Architecture (design only)  
**Parent:** `ROMA_INTELLIGENCE_CORE.md`  
**Implements:** `ROMA_RISK_ENGINE.md` (Stage 2 computation)

---

## 1. Purpose

Defines the **conceptual risk ontology** for ROMA — how software risk is classified, composed, and translated into testing depth and blocking posture.

Stage 2A specifies the model; Stage 2 Risk Engine computes scores against this model.

---

## 2. Responsibilities

| Owns | Does not own |
|------|--------------|
| Risk dimensions and tier taxonomy | HTTP probe implementation |
| Business criticality semantics | Penetration testing execution |
| Risk → depth → block mapping rules | Council final GO vote |
| RT-Critical module registry concept | Dynamic product pricing |

---

## 3. Risk Dimensions

| Dimension | Weight (v1) | Signals |
|-----------|-------------|---------|
| Business criticality | 0.18 | Revenue path, pilot contract, owner-stated tier |
| Security exposure | 0.16 | AuthZ surface, data sensitivity, public exposure |
| User impact | 0.12 | MAU path, role breadth, customer-visible |
| Data sensitivity | 0.12 | PII, finance, tenant isolation |
| AI involvement | 0.10 | Copilot, vision, streaming, provider dependency |
| Mobile impact | 0.08 | iOS/AND sync, field worker paths |
| Backend dependency | 0.10 | API fan-out, sync, billing webhooks |
| Recent change velocity | 0.08 | Commits 7d/30d, churn |
| Historical failure rate | 0.06 | MEM-RECUR, MEM-REGRESS |

---

## 4. Risk Tiers

| Tier | Score range | Testing depth | Blocking policy |
|------|-------------|---------------|-----------------|
| **RT-Critical** | 85–100 | T2 minimum; T0 smoke slice required | SKIP → UNKNOWN; R0 path → BLOCK |
| **RT-High** | 65–84 | T1+ | SKIP with reason; confidence cap |
| **RT-Medium** | 40–64 | T1 targeted | Advisory |
| **RT-Low** | 0–39 | T0/T1 sample | May defer under budget |

---

## 5. Special Risk Classes (R0–R4)

Aligned with `ROMA_REPORTING_MODEL.md`:

| Class | Meaning | Model behavior |
|-------|---------|----------------|
| **R0** | Existential — tenant leak, finance exposure, auth bypass | Forces BLOCK in Decision Engine |
| **R1** | Severe security / data integrity | RUN mandatory; no SKIP on council path |
| **R2** | Major functional regression | Elevates tier |
| **R3** | Moderate defect | Standard depth |
| **R4** | Low / cosmetic | Coverage debt tracking |

---

## 6. Inputs

| Input | Source |
|-------|--------|
| Module registry | Core inventory |
| Change velocity | Git |
| Memory stability | Memory Model |
| Knowledge blast radius | Knowledge Model |
| AI catalog | AI subsystem inventory |
| Finance denylist | SEC catalog |
| Release importance | Trigger context (pilot vs patch) |

---

## 7. Outputs

| Output | Consumer |
|--------|----------|
| `risk_ontology_version` | Engine versioning |
| Per-module risk profile (conceptual) | Risk Engine → `risk_manifest.json` |
| `depth_recommendation` | Planner, Decision Engine |
| `blocking_policy_flags[]` | Decision Engine, Release Model |

---

## 8. Interfaces

| Partner | Contract |
|---------|----------|
| Risk Engine | Implements scoring formulas |
| Reasoning Model | Q4–Q5 (probability + impact) |
| Release Model | Risk posture rollup |
| Regression Model | Likelihood cross-check |
| Knowledge Model | Criticality from graph centrality |

---

## 9. AISTROYKA Invariants

- Stakeholder/customer paths with finance denylist nodes → minimum RT-High  
- AI provider paths on release with AI diff → AI dimension floor 0.7  
- `accounts` / billing migration surfaces → RT-Critical until council downgrades  
- Mobile pilot paths → iOS Worker/Manager sync nodes elevated  

---

## 10. Future Extensions

- Owner-editable business criticality overrides per tenant/project  
- Supply-chain risk dimension (dependency CVE feed)  
- Chaos-derived resilience score feeding historical failure rate  
- Dynamic RT-Critical registry from production incident feed  

---

## 11. Open Questions

| ID | Question |
|----|----------|
| Q1 | Formal RT-Critical module list — steward-maintained YAML? |
| Q2 | Weight tuning cadence — quarterly council or automated drift? |
| Q3 | Android deferred (P3) — mobile dimension default for AND-only changes? |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Stage 2A risk model |
