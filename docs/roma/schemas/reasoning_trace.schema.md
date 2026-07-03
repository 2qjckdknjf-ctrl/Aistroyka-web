# Schema: reasoning_trace

**Schema ID:** `roma.schema.reasoning_trace`  
**Version:** `rt_v1`  
**Artifact:** `reasoning_trace.json` (per decision unit) or `reasoning_traces/{decision_id}.json`  
**Interface:** `IF-COG-REASON` → output  
**Stage 2A:** `ROMA_REASONING_MODEL.md`  
**ADR:** `ADR-0008` (T0 abbreviated mode)

---

## Purpose

Canonical contract for a single ROMA reasoning unit — answers the nine reasoning questions (full or T0-abbreviated per ADR-0008).

---

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `schema_version` | string | Must be `rt_v1` |
| `decision_id` | string | Pattern `RD-{run_id}-{seq}` |
| `run_id` | string | Global run identifier |
| `decision_unit` | enum | `module` \| `flow` \| `release` \| `subsystem` |
| `unit_ref` | string | e.g. `WEB/dashboard`, `FLOW-J3`, `REL/staging` |
| `reasoning_mode` | enum | `full` \| `abbreviated_t0` |
| `questions` | object | See §Questions object |
| `rationale_summary` | string | 2–5 sentences, human-readable |
| `governance_ref` | string[] | ADR IDs used, e.g. `["ADR-0007","ADR-0008","sm_v1"]` |
| `created_at` | string | ISO 8601 UTC |

---

## Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `refinements` | array | `{ pass, field_id, prior_value, new_value, reason }` max 2 passes |
| `change_set_ref` | string | Link to inventory/git change blob |
| `memory_refs` | string[] | MEM-* IDs consulted |
| `knowledge_refs` | string[] | Graph node IDs in blast radius |

---

## Questions object

### Full mode (`reasoning_mode: full`) — all required

| Key | Type | Enum / range |
|-----|------|--------------|
| `change_summary` | object | `{ text: string, refs: string[] }` |
| `materiality` | object | `{ text: string, score_norm: number 0–1 }` |
| `affected_actors` | object | `{ roles: string[], surfaces: string[], tenant_scope: string }` |
| `failure_probability` | object | `{ value: number 0–1, method: enum }` |
| `impact` | object | `{ severity: P0–P3, risk_class: R0–R4, blast_radius_nodes: integer }` |
| `evidence_present` | array | `{ type: EV-*, ref: string }[]` |
| `evidence_gaps` | array | `{ type: string, detail: string }[]` |
| `recommendation` | object | `{ action: enum, targets: string[] }` |
| `recommendation_confidence` | object | `{ percent: 0–100, caps_applied: string[] }` |

**`failure_probability.method`:** `regression` \| `history` \| `heuristic` \| `regression+history` \| `unknown`

**`recommendation.action`:** `RUN` \| `SKIP` \| `DEFER` \| `BLOCK` \| `INVESTIGATE` \| `MONITOR`

### Abbreviated T0 mode (`reasoning_mode: abbreviated_t0`) — per ADR-0008

| Key | Required | Maps to full question |
|-----|----------|----------------------|
| `change_summary` | yes | Q1 |
| `materiality` | yes (text only; `score_norm` optional) | Q2 |
| `affected_area` | yes | Q3 shorthand: `{ surfaces, roles? }` |
| `risk_tier` | yes | Q5 shorthand: `RT-Critical` \| `RT-High` \| `RT-Medium` \| `RT-Low` |
| `evidence_present` | yes | Q6 |
| `evidence_gaps` | yes | Q7 |
| `recommendation` | yes | Q8 |
| `recommendation_confidence` | yes | Q9 |

Omitted in T0: `failure_probability`, full `impact` object — inferred from `risk_tier` + registry.

---

## Example object (full)

```json
{
  "schema_version": "rt_v1",
  "decision_id": "RD-20260703-staging-T0-001",
  "run_id": "20260703-staging-T0",
  "decision_unit": "module",
  "unit_ref": "SEC/stakeholder-finance",
  "reasoning_mode": "full",
  "questions": {
    "change_summary": {
      "text": "Portal layout touched; stakeholder route unchanged but shared component modified.",
      "refs": ["git:ae14b908:apps/web/app/(portal)/"]
    },
    "materiality": { "text": "Customer finance boundary adjacent.", "score_norm": 0.88 },
    "affected_actors": {
      "roles": ["stakeholder"],
      "surfaces": ["portal", "WEB"],
      "tenant_scope": "fixture_tenant"
    },
    "failure_probability": { "value": 0.42, "method": "heuristic" },
    "impact": { "severity": "P1", "risk_class": "R1", "blast_radius_nodes": 6 },
    "evidence_present": [{ "type": "EV-DIFF", "ref": "artifacts/git-diff.txt" }],
    "evidence_gaps": [{ "type": "COV-ROLE", "detail": "stakeholder_smoke profile not run" }],
    "recommendation": { "action": "RUN", "targets": ["SEC-finance-denylist-probe"] },
    "recommendation_confidence": { "percent": 55, "caps_applied": ["UNKNOWN_DOMAIN"] }
  },
  "rationale_summary": "Portal component change near finance denylist paths requires SEC probe before pilot promotion.",
  "governance_ref": ["ADR-0007", "ADR-0008", "sm_v1"],
  "created_at": "2026-07-03T10:00:00Z"
}
```

---

## Validation rules

| Rule ID | Rule |
|---------|------|
| RT-V01 | `schema_version` must equal `rt_v1` |
| RT-V02 | Full mode: all nine question keys present |
| RT-V03 | Abbreviated T0: only ADR-0008 keys; `reasoning_mode` must be `abbreviated_t0` |
| RT-V04 | `recommendation_confidence.percent` ∈ [0, 100] |
| RT-V05 | R0 in `impact.risk_class` → `recommendation.action` cannot be `SKIP` without `council_ack` flag (full mode) |
| RT-V06 | `evidence_present` entries must use types from `ROMA_EVIDENCE_MODEL.md` |
| RT-V07 | No secret values in `text` fields — refs only |

---

## Failure handling

| Failure | Behavior |
|---------|----------|
| Missing required question (full) | Reject artifact; engine emits `SX_PARTIAL`; Decision Engine → `INVESTIGATE` |
| Invalid enum | Reject; log validation error; trace marked invalid |
| T0 abbreviated on non-T0 path | Reject unless hotfix waiver in `governance_ref` |
| Empty `rationale_summary` | Warning; confidence cap −10% |

**Producer:** Reasoning Model / Intelligence orchestrator  
**Consumer:** Decision Engine, Executive Reporting, Memory Model  
**Validator:** Core collect phase (Stage 3+); Stage 2B manual conformance only

---

## Relation to Stage 2A

Implements `ROMA_REASONING_MODEL.md` §3–§6. Consumed by `IF-COG-DECIDE`. T0 depth governed by `ADR-0008`.
