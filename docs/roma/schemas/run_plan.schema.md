# Schema: run_plan

**Schema ID:** `roma.schema.run_plan`  
**Version:** `rp_v1`  
**Artifact:** `run_plan.json`  
**Interface:** `IF-ENG-PLAN` → output; `IF-CORE-PLAN` → input  
**Stage 2A:** `ROMA_PLANNER_ENGINE.md`, `ROMA_PRIORITY_ENGINE.md`

---

## Purpose

Executable test plan: slices to run, skip, defer; environments; estimates; credential profile requirements.

---

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `schema_version` | string | `rp_v1` |
| `plan_id` | string | `RP-{run_id}` |
| `run_id` | string | |
| `bundle_ref` | string | `decision_bundle.json` |
| `tier` | enum | T0–T3 |
| `environment` | enum | local \| staging \| preprod \| production |
| `tests_to_run` | array | Run entry objects |
| `tests_to_skip` | array | Skip entry objects |
| `required_environments` | string[] | e.g. `["staging"]` |
| `estimated_duration_seconds` | integer | |
| `credential_profiles_required` | string[] | ADR-0003 profile IDs |
| `generated_at` | string | ISO 8601 |

---

## Run entry object

| Field | Type | Required |
|-------|------|----------|
| `slice_id` | string | yes |
| `subsystem` | enum | WEB \| BCK \| SEC \| AI \| IOS \| AND \| DB \| … |
| `order` | integer | yes — execution order |
| `parallel_group` | string | no — PAR rule group |
| `module_ref` | string | no |
| `reasoning_ref` | string | recommended |

---

## Skip entry object

| Field | Type | Required |
|-------|------|----------|
| `slice_id` | string | yes |
| `reason_code` | enum | yes — see below |
| `detail` | string | yes |
| `downgrade_to_unknown` | boolean | yes |

**`reason_code`:** `LOW_RISK` \| `BUDGET_EXCEEDED` \| `PROFILE_MISSING` \| `NOT_IN_DIFF` \| `QUARANTINE` \| `COUNCIL_WAIVER`

---

## Optional fields

| Field | Type |
|-------|------|
| `tests_deferred` | array — same shape as skip with `defer_to_tier` |
| `priority_rationale` | string[] — top 10 why-first |
| `estimated_utilization` | number 0–1 |
| `inventory_hash` | string |

---

## Example object

```json
{
  "schema_version": "rp_v1",
  "plan_id": "RP-20260703-staging-T1",
  "run_id": "20260703-staging-T1",
  "bundle_ref": "decision_bundle.json",
  "tier": "T1",
  "environment": "staging",
  "tests_to_run": [
    { "slice_id": "WEB-auth-smoke", "subsystem": "WEB", "order": 1, "parallel_group": "web-serial" },
    { "slice_id": "SEC-finance-denylist-probe", "subsystem": "SEC", "order": 2, "module_ref": "RTCRIT-FINANCE-ISOLATION" },
    { "slice_id": "AI-copilot-live-classify", "subsystem": "AI", "order": 3, "parallel_group": "ai-serial" }
  ],
  "tests_to_skip": [
    { "slice_id": "AND-worker-instrumented", "reason_code": "NOT_IN_DIFF", "detail": "Android unchanged; P3 deferred", "downgrade_to_unknown": true }
  ],
  "required_environments": ["staging"],
  "estimated_duration_seconds": 1800,
  "credential_profiles_required": ["contractor_smoke", "stakeholder_smoke"],
  "estimated_utilization": 0.85,
  "generated_at": "2026-07-03T09:20:00Z"
}
```

---

## Validation rules

| Rule ID | Rule |
|---------|------|
| RP-V01 | RT-Critical module in risk_manifest → ≥1 run entry OR explicit skip with `downgrade_to_unknown: true` |
| RP-V02 | `PROFILE_MISSING` skip → profile listed in `credential_profiles_required` as missing flag in run_meta |
| RP-V03 | AI-touching release → `AI-copilot-live-classify` or equivalent not in skip without waiver |
| RP-V04 | `order` unique within plan |
| RP-V05 | `bundle_ref` must validate against `decision_bundle.schema.md` |

---

## Failure handling

| Failure | Behavior |
|---------|----------|
| Invalid plan | Core aborts execute; `SX_ERROR` |
| Empty tests_to_run on T1+ council | `INVESTIGATE` decision required |
| Duration estimate exceeded at runtime | Deferred slices → `tests_deferred` next run |

**Producer:** Planner + Priority engines  
**Consumer:** Core `IF-CORE-EXECUTE`, adapters

---

## Relation to Stage 2A

Materializes `RUN`/`DEFER` from Decision Engine per `ROMA_PLANNER_ENGINE.md`.
