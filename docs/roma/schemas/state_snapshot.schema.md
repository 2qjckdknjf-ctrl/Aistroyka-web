# Schema: state_snapshot

**Schema ID:** `roma.schema.state_snapshot`  
**Version:** `ss_v1`  
**Artifact:** `state_snapshot.json`  
**Interface:** State machine lifecycle; Core orchestrator resume  
**Stage 2A:** `ROMA_STATE_MACHINE.md`

---

## Purpose

Records current intelligence lifecycle state, transition log, and partial-run flags.

---

## Required fields

| Field | Type | Enum / description |
|-------|------|-------------------|
| `schema_version` | string | `ss_v1` |
| `run_id` | string | |
| `current_state` | enum | `S0_IDLE` \| `S1_CHANGE_DETECTED` \| `S2_IMPACT_ANALYZED` \| `S3_RISK_CALCULATED` \| `S4_TESTS_SELECTED` \| `S5_EVIDENCE_COLLECTED` \| `S6_DECISION_GENERATED` \| `S7_KNOWLEDGE_UPDATED` \| `S8_REPORTED` \| `SX_ERROR` \| `SX_PARTIAL` |
| `previous_state` | enum | Same set (nullable `null` at S1 entry) |
| `entered_at` | string | ISO 8601 |
| `transition_log` | array | `{ from, to, guard, at }[]` |
| `partial` | boolean | |
| `cognitive_contract_version` | string | `cog_v1` |

---

## Optional fields

| Field | Type |
|-------|------|
| `confidence_caps` | string[] |
| `error_ref` | string |
| `resume_from` | enum state |
| `trigger` | string |
| `tier` | T0–T3 |

---

## Example object

```json
{
  "schema_version": "ss_v1",
  "run_id": "20260703-staging-T1",
  "current_state": "S6_DECISION_GENERATED",
  "previous_state": "S5_EVIDENCE_COLLECTED",
  "entered_at": "2026-07-03T12:00:00Z",
  "transition_log": [
    { "from": "S0_IDLE", "to": "S1_CHANGE_DETECTED", "guard": "trigger_received", "at": "2026-07-03T11:00:00Z" },
    { "from": "S5_EVIDENCE_COLLECTED", "to": "S6_DECISION_GENERATED", "guard": "decision_bundle_committed", "at": "2026-07-03T12:00:00Z" }
  ],
  "partial": false,
  "confidence_caps": [],
  "cognitive_contract_version": "cog_v1"
}
```

---

## Validation rules

| Rule ID | Rule |
|---------|------|
| SS-V01 | Transitions must follow allowed edges in `ROMA_STATE_MACHINE.md` |
| SS-V02 | `SX_ERROR` requires `error_ref` or last log entry with failure |
| SS-V03 | `partial: true` → at least one `confidence_caps` entry recommended |
| SS-V04 | Terminal success path ends at `S8_REPORTED` then `S0_IDLE` on next run |

---

## Failure handling

| Failure | Behavior |
|---------|----------|
| Illegal transition | Log warning; remain in prior state |
| Crash mid-state | Resume from `state_snapshot` if `resume_from` set |
| Partial pipeline | Set `SX_PARTIAL`; downstream caps confidence |

**Producer:** Intelligence orchestrator / Core  
**Consumer:** OBS, Dashboard (Stage 8), pipeline resume

---

## Relation to Stage 2A

Canonical serialization of `ROMA_STATE_MACHINE.md` §7.
