# Schema: coverage_snapshot

**Schema ID:** `roma.schema.coverage_snapshot`  
**Version:** `cs_v1`  
**Artifact:** `coverage_map.json`  
**Interface:** `IF-ENG-COV` → output  
**Stage 2A:** `ROMA_COVERAGE_ENGINE.md`, `ROMA_KNOWLEDGE_MODEL.md`

---

## Purpose

Multi-dimensional coverage state beyond line percentages: flows, roles, APIs, devices, AI scenarios.

---

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `schema_version` | string | `cs_v1` |
| `run_id` | string | |
| `snapshot_id` | string | `CS-{run_id}` |
| `dimensions` | object | Per-dimension coverage blocks |
| `debt_register` | array | Uncovered items with pressure score |
| `delta_from_prior` | object | Optional comparison |
| `generated_at` | string | ISO 8601 |

---

## dimensions object (each block required)

| Key | Block fields |
|-----|--------------|
| `COV-FLOW` | `{ covered: string[], uncovered: string[], percent: number }` |
| `COV-ROLE` | same shape — owner, manager, worker, stakeholder, platform_owner |
| `COV-API` | same — endpoint IDs |
| `COV-DEVICE` | same — IOS-Manager, IOS-Worker, AND-*, web viewports |
| `COV-AI` | same — copilot-stream, vision, transcribe, help |

---

## debt_register entry

| Field | Type |
|-------|------|
| `debt_id` | string |
| `dimension` | enum COV-* |
| `item_ref` | string |
| `risk_tier` | RT-* |
| `debt_pressure` | number |
| `age_days` | integer |
| `recommended_action` | string |

---

## Example object

```json
{
  "schema_version": "cs_v1",
  "run_id": "20260703-staging-T2",
  "snapshot_id": "CS-20260703-staging-T2",
  "dimensions": {
    "COV-FLOW": {
      "covered": ["FLOW-J1-login-dashboard", "FLOW-J3-worker-report-manager"],
      "uncovered": ["FLOW-J7-stakeholder-approval"],
      "percent": 67
    },
    "COV-ROLE": {
      "covered": ["contractor_admin", "worker"],
      "uncovered": ["stakeholder"],
      "percent": 50
    },
    "COV-API": { "covered": ["GET /api/v1/projects"], "uncovered": ["POST /api/v1/sync/push"], "percent": 42 },
    "COV-DEVICE": { "covered": ["IOS-Worker"], "uncovered": ["AND-Worker"], "percent": 50 },
    "COV-AI": { "covered": ["copilot-stream"], "uncovered": ["analyze-image"], "percent": 50 }
  },
  "debt_register": [
    {
      "debt_id": "DEBT-COV-ROLE-stakeholder",
      "dimension": "COV-ROLE",
      "item_ref": "stakeholder",
      "risk_tier": "RT-High",
      "debt_pressure": 0.72,
      "age_days": 14,
      "recommended_action": "RUN SEC-finance-denylist with stakeholder_smoke profile"
    }
  ],
  "generated_at": "2026-07-03T14:00:00Z"
}
```

---

## Validation rules

| Rule ID | Rule |
|---------|------|
| CS-V01 | `percent` = covered / (covered + uncovered) × 100 per dimension |
| CS-V02 | Stakeholder finance flows in uncovered → debt_pressure floor 0.5 |
| CS-V03 | Item in both covered and uncovered → validation error |
| CS-V04 | debt_register entries must reference valid dimension |

---

## Failure handling

| Failure | Behavior |
|---------|----------|
| Missing dimension block | Dimension marked UNKNOWN; Planner includes debt probes |
| Stale snapshot (>30d) | Confidence cap on coverage component |

**Producer:** Coverage Engine  
**Consumer:** Planner, Reasoning Q7, Release Confidence

---

## Relation to Stage 2A

Implements coverage debt from `ROMA_COVERAGE_ENGINE.md`; topology from Knowledge Model.
