# Schema: risk_manifest

**Schema ID:** `roma.schema.risk_manifest`  
**Version:** `rm_v1`  
**Artifact:** `risk_manifest.json`  
**Interface:** `IF-ENG-RISK` → output  
**Stage 2A:** `ROMA_RISK_MODEL.md`, registry `rt-critical-modules.yaml.md`

---

## Purpose

Per-module risk scores, tiers, depth recommendations, and blocking flags for Planner and Decision Engine.

---

## Required fields (root)

| Field | Type | Description |
|-------|------|-------------|
| `schema_version` | string | `rm_v1` |
| `run_id` | string | |
| `risk_ontology_version` | string | `risk_v1` |
| `registry_ref` | string | Path/hash of RT-Critical registry used |
| `modules` | array | Module risk objects (≥1) |
| `generated_at` | string | ISO 8601 |

---

## Module object (required)

| Field | Type | Enum / range |
|-------|------|--------------|
| `module_id` | string | Registry ID e.g. `RTCRIT-AUTH` |
| `subject_ref` | string | Graph/inventory path |
| `risk_score` | integer | 0–100 |
| `risk_tier` | enum | `RT-Critical` \| `RT-High` \| `RT-Medium` \| `RT-Low` |
| `risk_class` | enum | `R0` \| `R1` \| `R2` \| `R3` \| `R4` (worst applicable) |
| `depth_recommendation` | enum | `T0` \| `T1` \| `T2` \| `T3` |
| `blocking_policy` | enum | `BLOCK_ON_SKIP` \| `UNKNOWN_ON_SKIP` \| `ADVISORY` |
| `dimensions` | object | Normalized 0–1 per `ROMA_RISK_MODEL.md` |
| `rationale` | string | One paragraph |

---

## dimensions object (keys optional but ≥3 required)

`business_criticality`, `security_exposure`, `user_impact`, `data_sensitivity`, `ai_involvement`, `mobile_impact`, `backend_dependency`, `change_velocity`, `historical_failure_rate` — each `{ value: number, signals: string[] }`.

---

## Optional root fields

| Field | Type |
|-------|------|
| `change_set_ref` | string |
| `global_risk_posture` | enum `elevated` \| `normal` \| `calm` |
| `r0_modules` | string[] |

---

## Example object

```json
{
  "schema_version": "rm_v1",
  "run_id": "20260703-pr-T1",
  "risk_ontology_version": "risk_v1",
  "registry_ref": "docs/roma/registries/rt-critical-modules.yaml.md#v0.1",
  "modules": [
    {
      "module_id": "RTCRIT-WORKER-REPORT",
      "subject_ref": "FLOW-J3",
      "risk_score": 91,
      "risk_tier": "RT-Critical",
      "risk_class": "R2",
      "depth_recommendation": "T2",
      "blocking_policy": "BLOCK_ON_SKIP",
      "dimensions": {
        "business_criticality": { "value": 0.95, "signals": ["pilot_contract_path"] },
        "mobile_impact": { "value": 0.9, "signals": ["IOS-Worker", "AND-Worker"] },
        "historical_failure_rate": { "value": 0.3, "signals": ["MEM-RECUR-abc"] }
      },
      "rationale": "Worker report → manager visibility is pilot-critical cross-surface flow."
    }
  ],
  "r0_modules": [],
  "generated_at": "2026-07-03T09:15:00Z"
}
```

---

## Validation rules

| Rule ID | Rule |
|---------|------|
| RM-V01 | `risk_score` 85–100 ⟺ `risk_tier` RT-Critical (unless registry override documented) |
| RM-V02 | Registry-listed RT-Critical modules must appear when change_set touches them |
| RM-V03 | `R0` in any module → `r0_modules` non-empty |
| RM-V04 | `blocking_policy` for registry RT-Critical must be `BLOCK_ON_SKIP` or `UNKNOWN_ON_SKIP` |

---

## Failure handling

| Failure | Behavior |
|---------|----------|
| Empty modules on non-empty diff | Regression uses direct-diff; confidence −15% |
| Registry hash mismatch | Warning; use embedded tier from diff heuristics |
| Invalid tier/score combo | Reject module entry; omit from plan |

**Producer:** Risk Engine  
**Consumer:** Planner, Priority, Decision Engine, Reasoning (Q4–Q5)

---

## Relation to Stage 2A

Computes against `ROMA_RISK_MODEL.md`; registry in `docs/roma/registries/rt-critical-modules.yaml.md`.
