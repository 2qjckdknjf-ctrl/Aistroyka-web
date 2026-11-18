# Schema: decision_bundle

**Schema ID:** `roma.schema.decision_bundle`  
**Version:** `db_v1`  
**Artifact:** `decision_bundle.json`  
**Interface:** `IF-COG-DECIDE` → output; `IF-CORE-PLAN` → input (partial)  
**Stage 2A:** `ROMA_DECISION_ENGINE.md`

---

## Purpose

Single intelligence commit point: synthesized decisions, release posture, and advisory flag for Core/REL.

---

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `schema_version` | string | `db_v1` |
| `bundle_id` | string | `DB-{run_id}` |
| `run_id` | string | |
| `trigger` | enum | `pr` \| `deploy` \| `council` \| `manual` \| `nightly` |
| `tier` | enum | `T0` \| `T1` \| `T2` \| `T3` |
| `environment` | enum | `local` \| `staging` \| `preprod` \| `production` |
| `decisions` | array | Decision objects (≥1) |
| `release_posture` | object | See below |
| `advisory_only` | boolean | Must be `true` (ADR-0007) |
| `governance_ref` | string[] | |
| `created_at` | string | ISO 8601 |

---

## Decision object (required per item)

| Field | Type | Enum / notes |
|-------|------|--------------|
| `decision_id` | string | Links to `reasoning_trace` |
| `type` | enum | `RUN` \| `SKIP` \| `DEFER` \| `BLOCK` \| `INVESTIGATE` \| `MONITOR` |
| `targets` | string[] | Test slice IDs or module refs |
| `tier` | enum | T0–T3 |
| `confidence` | integer | 0–100 |
| `rationale_ref` | string | Path to reasoning_trace |
| `blocking` | boolean | If true, REL must consider BLOCK |

---

## release_posture object

| Field | Type | Required |
|-------|------|----------|
| `recommended_state` | enum | yes — `Production Ready` \| `Pilot Ready` \| `Blocked` \| `Insufficient Evidence` \| `Conditional` |
| `confidence_percent` | integer | yes — 0–100 |
| `blocking_decisions` | string[] | yes — may be empty |

---

## Optional fields

| Field | Type |
|-------|------|
| `conflicts_resolved` | `{ engines, chosen_path, rationale }[]` |
| `build_stamp` | `{ sha7, source_url? }` |
| `inventory_hash` | string |
| `skip_manifest_ref` | string |

---

## Example object

```json
{
  "schema_version": "db_v1",
  "bundle_id": "DB-20260703-staging-T1",
  "run_id": "20260703-staging-T1",
  "trigger": "deploy",
  "tier": "T1",
  "environment": "staging",
  "decisions": [
    {
      "decision_id": "RD-20260703-staging-T1-003",
      "type": "RUN",
      "targets": ["WEB-auth-smoke", "SEC-finance-denylist-probe", "BCK-health-v1"],
      "tier": "T1",
      "confidence": 68,
      "rationale_ref": "reasoning_traces/RD-20260703-staging-T1-003.json",
      "blocking": false
    }
  ],
  "release_posture": {
    "recommended_state": "Pilot Ready",
    "confidence_percent": 62,
    "blocking_decisions": []
  },
  "conflicts_resolved": [],
  "advisory_only": true,
  "governance_ref": ["ADR-0007", "ADR-0002"],
  "created_at": "2026-07-03T11:30:00Z"
}
```

---

## Validation rules

| Rule ID | Rule |
|---------|------|
| DB-V01 | `advisory_only` must be `true` |
| DB-V02 | Every `decision_id` must have matching `reasoning_trace` |
| DB-V03 | `BLOCK` + `blocking: true` → `release_posture.blocking_decisions` non-empty |
| DB-V04 | Precedence: BLOCK > INVESTIGATE > RUN (DE-01–DE-06) |
| DB-V05 | SKIP on RT-Critical module requires `skip_manifest` entry with reason |

---

## Failure handling

| Failure | Behavior |
|---------|----------|
| Invalid bundle | Core rejects `IF-CORE-PLAN`; state → `SX_ERROR` |
| Missing rationale_ref | Decision dropped; `INVESTIGATE` emitted |
| Conflicting BLOCK vs Pilot Ready | `recommended_state` forced to `Blocked` |

**Producer:** Decision Engine  
**Consumer:** Core (`IF-CORE-PLAN`), REL, Executive Reporting

---

## Relation to Stage 2A

Implements `ROMA_DECISION_ENGINE.md` §6. Pairs with `run_plan.schema.md` (Planner materializes RUN/DEFER).
