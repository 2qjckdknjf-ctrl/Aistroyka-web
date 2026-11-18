# Schema: knowledge_update

**Schema ID:** `roma.schema.knowledge_update`  
**Version:** `ku_v1`  
**Artifact:** `knowledge_delta.json`  
**Interface:** `IF-COG-KNOWLEDGE` commit; `IF-COG-MEMORY` related  
**Stage 2A:** `ROMA_KNOWLEDGE_MODEL.md`, `ROMA_MEMORY_MODEL.md`, `ROMA_FEEDBACK_MODEL.md`

---

## Purpose

Per-run delta to engineering knowledge graph and memory stores after S7 lifecycle state.

---

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `schema_version` | string | `ku_v1` |
| `run_id` | string | |
| `update_id` | string | `KU-{run_id}` |
| `graph_delta` | object | Nodes/edges added, removed, changed |
| `memory_writes` | array | Memory record stubs |
| `feedback_events` | array | FB-* event refs |
| `violations` | array | G-001 and health violations |
| `architecture_health` | object | Snapshot scores |
| `generated_at` | string | ISO 8601 |

---

## graph_delta object

| Field | Type |
|-------|------|
| `nodes_added` | `{ id, type, ref }[]` |
| `nodes_removed` | string[] |
| `edges_added` | `{ from, to, type }[]` |
| `edges_removed` | `{ from, to, type }[]` |
| `inventory_hash_before` | string |
| `inventory_hash_after` | string |

---

## memory_writes entry

| Field | Type |
|-------|------|
| `memory_id` | string |
| `category` | enum MEM-* |
| `operation` | `upsert` \| `decay` \| `archive` |
| `subject_ref` | string |

---

## architecture_health object

| Field | Type |
|-------|------|
| `score` | number 0–100 |
| `signals` | `{ id, status: pass\|warn\|fail, detail }[]` |

---

## Example object

```json
{
  "schema_version": "ku_v1",
  "run_id": "20260703-staging-T1",
  "update_id": "KU-20260703-staging-T1",
  "graph_delta": {
    "nodes_added": [{ "id": "api:POST:/api/v1/reports", "type": "api", "ref": "apps/web/app/api/v1/reports/route.ts" }],
    "nodes_removed": [],
    "edges_added": [{ "from": "FLOW-J3", "to": "api:POST:/api/v1/reports", "type": "calls" }],
    "edges_removed": [],
    "inventory_hash_before": "inv_abc123",
    "inventory_hash_after": "inv_def456"
  },
  "memory_writes": [
    { "memory_id": "MEM-RECUR-WEB-auth-flake", "category": "MEM-RECUR", "operation": "upsert", "subject_ref": "WEB/auth" }
  ],
  "feedback_events": ["FB-20260703-staging-T1-002"],
  "violations": [],
  "architecture_health": {
    "score": 78,
    "signals": [
      { "id": "hub-overload-dashboard", "status": "warn", "detail": "dashboard hub 18 dependents" }
    ]
  },
  "generated_at": "2026-07-03T13:00:00Z"
}
```

---

## Validation rules

| Rule ID | Rule |
|---------|------|
| KU-V01 | Finance internal nodes must not gain `customer_visible` edge to stakeholder (G-001) |
| KU-V02 | `memory_writes` categories must be in Memory Model taxonomy |
| KU-V03 | `inventory_hash_after` required when graph_delta non-empty |
| KU-V04 | No secret payloads in graph node refs |

---

## Failure handling

| Failure | Behavior |
|---------|----------|
| G-001 violation | `violations` non-empty; Decision Engine BLOCK recommendation |
| Memory write conflict | Last-write-wins with steward review flag |
| Partial S7 | `knowledge_delta` emitted with `partial: true` in state_snapshot |

**Producer:** Knowledge + Learning + Feedback (S7)  
**Consumer:** Next-run Memory recall, Architecture reports

---

## Relation to Stage 2A

Serializes S7 `ROMA_STATE_MACHINE.md`; links Knowledge, Memory, Feedback models.
