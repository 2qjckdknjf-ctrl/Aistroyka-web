# Schema: evidence_bundle

**Schema ID:** `roma.schema.evidence_bundle`  
**Version:** `eb_v1`  
**Artifact:** `evidence_index.json` + `artifacts/` tree per run  
**Interface:** `IF-CORE-COLLECT` → output; Reasoning Q6/Q7 input  
**Stage 2A:** `ROMA_EVIDENCE_MODEL.md`

---

## Purpose

Index of all evidence artifacts for a run, linked to findings and reasoning traces.

---

## Required fields (evidence_index.json root)

| Field | Type | Description |
|-------|------|-------------|
| `schema_version` | string | `eb_v1` |
| `run_id` | string | |
| `build_stamp` | object | `{ sha7: string, url?: string }` — EV-STAMP |
| `artifacts` | array | Artifact entry objects |
| `finding_map` | object | `finding_id` → `evidence_id[]` |
| `completeness` | object | See below |
| `generated_at` | string | ISO 8601 |

---

## Artifact entry

| Field | Type | Enum |
|-------|------|------|
| `evidence_id` | string | `EV-{run_id}-{seq}` |
| `type` | enum | `EV-SCREEN` \| `EV-TRACE` \| `EV-LOG` \| `EV-NET` \| `EV-API` \| `EV-BUILD` \| `EV-MOBILE` \| `EV-DIFF` \| `EV-STAMP` \| `EV-GRAPH` |
| `path` | string | Relative under `docs/qa/runs/{run_id}/artifacts/` |
| `sha256` | string | Optional content hash |
| `redaction_level` | enum | `public` \| `engineering` \| `security_restricted` |
| `subsystem` | string | WEB, BCK, etc. |

---

## completeness object

| Field | Type | Description |
|-------|------|-------------|
| `rt_critical_modules_evidenced` | integer | Count with ≥1 artifact |
| `rt_critical_modules_gapped` | integer | |
| `required_types_satisfied` | boolean | Per E-01–E-06 |
| `gaps` | array | `{ module_ref, missing_types[] }` |

---

## Example object

```json
{
  "schema_version": "eb_v1",
  "run_id": "20260703-staging-T1",
  "build_stamp": { "sha7": "ae14b90", "url": "https://staging.aistroyka.ai/api/v1/health" },
  "artifacts": [
    {
      "evidence_id": "EV-20260703-staging-T1-001",
      "type": "EV-SCREEN",
      "path": "artifacts/screenshots/WEB-auth-login.png",
      "redaction_level": "engineering",
      "subsystem": "WEB"
    },
    {
      "evidence_id": "EV-20260703-staging-T1-002",
      "type": "EV-NET",
      "path": "artifacts/api/SEC-finance-probe.har.summary.json",
      "redaction_level": "security_restricted",
      "subsystem": "SEC"
    }
  ],
  "finding_map": {
    "ROMA-SEC-FINANCE-001": ["EV-20260703-staging-T1-002"]
  },
  "completeness": {
    "rt_critical_modules_evidenced": 8,
    "rt_critical_modules_gapped": 2,
    "required_types_satisfied": false,
    "gaps": [{ "module_ref": "RTCRIT-AI-COPILOT", "missing_types": ["EV-LOG"] }]
  },
  "generated_at": "2026-07-03T12:45:00Z"
}
```

---

## Validation rules

| Rule ID | Rule |
|---------|------|
| EB-V01 | Every finding in `finding_map` must reference existing `evidence_id` |
| EB-V02 | R0 findings require ≥2 evidence types when available (E-02) |
| EB-V03 | AI artifacts: no raw prompts with secrets (E-03) |
| EB-V04 | `build_stamp.sha7` required (E-05) |
| EB-V05 | Paths must not escape `artifacts/` root |

---

## Failure handling

| Failure | Behavior |
|---------|----------|
| Missing build_stamp | Run marked UNKNOWN for OBS; confidence cap |
| Orphan finding without evidence | Finding downgraded; E-01 violation logged |
| Incomplete RT-Critical | Release confidence penalty per Release Model |

**Producer:** Core collect + adapters  
**Consumer:** Reasoning, Release Confidence, Executive Reporting

---

## Relation to Stage 2A

Formalizes `ROMA_EVIDENCE_MODEL.md` for `IF-CORE-COLLECT` and reasoning Q6/Q7.
