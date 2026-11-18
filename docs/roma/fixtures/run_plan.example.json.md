# Fixture: run_plan.example.json

**Scenario:** AI Copilot provider config change + auth smoke + release T0 health  
**Tier:** T1 PR advisory  
**Schema:** `run_plan.schema.md` (`rp_v1`)

```json
{
  "schema_version": "rp_v1",
  "plan_id": "RP-20260703-pr-ai-T1",
  "run_id": "20260703-pr-ai-T1",
  "bundle_ref": "decision_bundle.json",
  "tier": "T1",
  "environment": "staging",
  "tests_to_run": [
    {
      "slice_id": "BCK-health-v1",
      "subsystem": "BCK",
      "order": 1,
      "module_ref": "RTCRIT-SYSTEM-HEALTH",
      "reasoning_ref": "reasoning_traces/RD-T0-health.json"
    },
    {
      "slice_id": "WEB-auth-smoke",
      "subsystem": "WEB",
      "order": 2,
      "parallel_group": "web-serial",
      "module_ref": "RTCRIT-AUTH"
    },
    {
      "slice_id": "AI-copilot-live-classify",
      "subsystem": "AI",
      "order": 3,
      "parallel_group": "ai-serial",
      "module_ref": "RTCRIT-AI-COPILOT",
      "reasoning_ref": "reasoning_traces/RD-ai-copilot.json"
    },
    {
      "slice_id": "AI-stream-tenant-leakage",
      "subsystem": "AI",
      "order": 4,
      "parallel_group": "ai-serial",
      "module_ref": "RTCRIT-TENANT-ISOLATION"
    },
    {
      "slice_id": "SEC-headers-smoke",
      "subsystem": "SEC",
      "order": 5,
      "module_ref": "RTCRIT-RBAC"
    }
  ],
  "tests_to_skip": [
    {
      "slice_id": "IOS-Worker-UITest-full",
      "reason_code": "NOT_IN_DIFF",
      "detail": "No ios/ changes in PR; IOS unchanged ≥1 cycle acceptable for T1 advisory",
      "downgrade_to_unknown": true
    },
    {
      "slice_id": "PERF-lighthouse-dashboard",
      "reason_code": "BUDGET_EXCEEDED",
      "detail": "T1 PR budget 45m; perf deferred to nightly",
      "downgrade_to_unknown": false
    }
  ],
  "tests_deferred": [
    {
      "slice_id": "WEB-visual-regression-public",
      "reason_code": "BUDGET_EXCEEDED",
      "detail": "Deferred to nightly T1",
      "defer_to_tier": "T1",
      "downgrade_to_unknown": false
    }
  ],
  "required_environments": ["staging"],
  "estimated_duration_seconds": 2400,
  "credential_profiles_required": ["contractor_smoke"],
  "priority_rationale": [
    "BCK-health first: RTCRIT-SYSTEM-HEALTH BLOCK_ON_SKIP on T0",
    "AI-copilot-live before defer: AI diff detected",
    "IOS skip with UNKNOWN: P3 Android/iOS policy"
  ],
  "estimated_utilization": 0.89,
  "inventory_hash": "inv_pr_ai_20260703",
  "generated_at": "2026-07-03T10:30:00Z"
}
```
