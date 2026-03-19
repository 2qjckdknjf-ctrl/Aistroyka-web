# Phase 8 — Intelligence diagnostics standard

Built by `buildIntelligenceDiagnosticsPayload()` — **metadata only**.

## Fields

| Field | Purpose |
|-------|---------|
| `data_sufficiency` | sufficient / partial / insufficient |
| `executive_health_label` | healthy / moderate / unstable / critical |
| `health_score` | Numeric aggregate |
| `health_label` | From `ProjectHealthScore` |
| `health_confidence` | high / medium / low |
| `health_factor_keys` | Top factor **names** only (e.g. reporting, evidence) — no explanations |
| `risk_counts` | high / medium / low counts |
| `missing_evidence_insight_count` | Count of missing-evidence signals |
| `top_risk_insight_count` | Count of ranked risks |
| `manager_insight_count` | Manager insight rows |
| `missing_data_disclaimer` | Boolean — disclaimer shown |
| `degradation_reason_codes` | Machine codes, e.g. `executive_data_insufficient`, `health_confidence_low`, `high_risk_present` |

## Operational questions answered

| Question | Diagnostic |
|----------|------------|
| Why weak summary? | `data_sufficiency`, `degradation_reason_codes` |
| Why low health? | `health_factor_keys`, `health_confidence`, `health_label` |
| Why many risks? | `risk_counts`, `top_risk_insight_count` |
| Missing evidence? | `missing_evidence_insight_count`, `degradation_reason_codes` |

## Storage

- **Logs:** `ai_intelligence_complete` JSON line includes `intelligence_diagnostics`.
- **DB:** Same object under `audit_logs.details.intelligence_diagnostics` for successful intelligence loads.
