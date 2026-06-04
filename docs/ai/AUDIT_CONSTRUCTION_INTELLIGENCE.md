# Construction Intelligence Audit

**Date:** 2026-06-04

---

## Primary API

`GET /api/v1/projects/:id/intelligence` aggregates in parallel:

- `getProjectHealth`, `getManagerInsights`, risk/evidence/reporting overviews
- `getMissingEvidenceInsights`, `getTopRiskInsights`, `getExecutiveProjectSummary`, `getProjectHealthScore`
- Legacy-shaped fields for backward-compatible UI

**Auth:** `requireTenant` + `getProject` (403 insufficient rights).

**LLM:** None on this route — **deterministic** read models from tenant-scoped Supabase queries.

---

## Sub-capabilities

### Missing evidence

- **Service:** `lib/ai-brain/services/missing-evidence.service.ts`
- **Inputs:** `getEvidenceSignals`, `getStalenessSignals`, `getReportSignals`
- **Outputs:** `MissingEvidenceInsight` with `evidenceReferences`, `confidence`, `recommendedAction`
- **Tests:** `missing-evidence.service.test.ts` (5)
- **Verdict:** **Grounded** — no synthetic task IDs; gaps from required vs actual counts

### Top risks

- **Service:** `top-risks.service.ts` + risk-intelligence signals
- **Tests:** `top-risks.service.test.ts`
- **Verdict:** **Grounded** — aggregated from signals, capped list (10)

### Executive summary

- **Service:** `executive-summary-v2.service.ts`
- **Tests:** 2 unit tests
- **Disclaimers:** `DataSufficiency`, `missingDataDisclaimer` on health score path

### Project health score

- **Service:** `project-health-v2.service.ts`
- **Model:** Documented in `CONSTRUCTION_INTELLIGENCE_HEALTH_MODEL.md` — factor contributions, confidence
- **Tests:** `project-health-v2` (via service tests)

### Explainability

- Documented: `CONSTRUCTION_INTELLIGENCE_EXPLAINABILITY.md`
- Runtime: `buildIntelligenceDiagnosticsPayload` in response diagnostics
- **Verdict:** **PARTIAL** — backend fields exist; UI drill-down consistency not re-verified in this audit

---

## Manager-facing surfaces

| Surface | Route / module | Status |
|---------|----------------|--------|
| Project intelligence tab | `intelligence` route + dashboard clients | **ACTIVE** |
| Portfolio command | `portfolio/summary`, `portfolio/control` | **ACTIVE** |
| Copilot brief (LLM overlay) | `GET .../copilot` | **ACTIVE** (deterministic fallback) |
| iOS Manager AI tab | `GET /api/v1/ai/requests` only | **PARTIAL** |

---

## Hallucination risk

| Output | Risk |
|--------|------|
| Intelligence bundle | **Low** — no generative model |
| Copilot use cases on same data | **Medium** when `OPENAI` configured — mitigated by context builder from same signals |
| Public portfolio simulation | Separate `lib/intelligence/*` on project page — deterministic heuristics |

---

## Determinism

- Intelligence GET: **Deterministic** for same DB state.
- Copilot non-stream: **Non-deterministic** when LLM on; **deterministic** when fallback.

---

## Prior closure vs this audit

`CONSTRUCTION_INTELLIGENCE_POST_AUDIT.md` claimed phase closure YES. This hard audit agrees for **deterministic intelligence API** but marks **manager mobile parity** and **cross-tenant integration tests** as open.

---

## Required verdicts

| Criterion | Verdict |
|-----------|---------|
| Grounded in real project data | **FULL** |
| Explainable | **PARTIAL** (types + diagnostics; UI not exhaustively audited) |
| Deterministic where needed | **FULL** on `/intelligence` |
| Not hallucinated | **FULL** on `/intelligence`; **PARTIAL** on copilot LLM path |
| Useful for manager decisions | **PARTIAL** — strong signals; action deep-links vary by UI |

**Subsystem status:** **CONDITIONAL GO** for web dashboard; **PARTIAL** for iOS manager intelligence parity.
