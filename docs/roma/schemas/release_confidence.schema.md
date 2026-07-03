# Schema: release_confidence

**Schema ID:** `roma.schema.release_confidence`  
**Version:** `rc_v1`  
**Artifact:** `release_confidence.json`  
**Interface:** `IF-ENG-CONF` → output; `IF-COG-RELEASE` → conceptual input  
**Stage 2A:** `ROMA_RELEASE_MODEL.md`, `ROMA_RELEASE_CONFIDENCE_ENGINE.md`

---

## Purpose

Numeric release confidence, readiness state, gate checklist, and blocking reasons.

---

## Required fields

| Field | Type | Enum / range |
|-------|------|--------------|
| `schema_version` | string | `rc_v1` |
| `run_id` | string | |
| `confidence_percent` | integer | 0–100 |
| `state` | enum | `Production Ready` \| `Pilot Ready` \| `Blocked` \| `Insufficient Evidence` \| `Conditional` |
| `components` | object | Named component scores 0–100 |
| `blocking_reasons` | array | `{ code, detail, severity }[]` |
| `gates` | array | Gate check objects |
| `pqs` | object | `{ value: number, version: string }` |
| `confidence_delta` | integer | vs prior run (nullable) |
| `advisory_only` | boolean | must be `true` |
| `generated_at` | string | ISO 8601 |

---

## components object (keys required)

`functional_quality`, `backend_reliability`, `security`, `ai_readiness`, `performance`, `accessibility`, `coverage_completeness`, `regression_prediction`, `historical_stability`, `pqs_correlation`

---

## gates object entry

| Field | Type |
|-------|------|
| `gate_id` | string e.g. `GATE-R0-ZERO` |
| `status` | enum `pass` \| `fail` \| `unknown` \| `waived` |
| `blocking` | boolean |
| `evidence_ref` | string |

---

## Optional fields

| Field | Type |
|-------|------|
| `pilot_intake_status` | enum `READY` \| `NOT_READY` \| `UNKNOWN` |
| `waivers` | array |
| `release_unit` | `{ web_sha7, ios_build?, android_build? }` |

---

## Example object

```json
{
  "schema_version": "rc_v1",
  "run_id": "20260703-council-T2",
  "confidence_percent": 58,
  "state": "Pilot Ready",
  "components": {
    "functional_quality": 72,
    "backend_reliability": 80,
    "security": 65,
    "ai_readiness": 55,
    "performance": 70,
    "accessibility": 60,
    "coverage_completeness": 45,
    "regression_prediction": 62,
    "historical_stability": 70,
    "pqs_correlation": 68
  },
  "blocking_reasons": [],
  "gates": [
    { "gate_id": "GATE-R0-ZERO", "status": "pass", "blocking": true, "evidence_ref": "risk_manifest.json" },
    { "gate_id": "GATE-PILOT-INTAKE", "status": "unknown", "blocking": false, "evidence_ref": "docs/launch/PILOT_INTAKE_CARD.md" }
  ],
  "pqs": { "value": 64, "version": "pqs_v1" },
  "confidence_delta": -4,
  "pilot_intake_status": "NOT_READY",
  "advisory_only": true,
  "generated_at": "2026-07-03T16:00:00Z"
}
```

---

## Validation rules

| Rule ID | Rule |
|---------|------|
| RC-V01 | `state: Blocked` → `blocking_reasons` non-empty OR `gates` with fail+blocking |
| RC-V02 | R0 fail gate → `confidence_percent` = 0 |
| RC-V03 | `Production Ready` requires confidence ≥ 75 and no blocking gates |
| RC-V04 | `advisory_only` must be true |
| RC-V05 | Real client pilot path: `pilot_intake_status: NOT_READY` caps state at `Conditional` |

---

## Failure handling

| Failure | Behavior |
|---------|----------|
| Missing component | Component scored 0; UNKNOWN contribution |
| Conflicting state vs confidence | State escalates to more conservative label |

**Producer:** Release Confidence Engine  
**Consumer:** Decision bundle `release_posture`, REL, RPT-EXEC

---

## Relation to Stage 2A

Numeric implementation of `ROMA_RELEASE_MODEL.md` + Stage 2 confidence formula.
