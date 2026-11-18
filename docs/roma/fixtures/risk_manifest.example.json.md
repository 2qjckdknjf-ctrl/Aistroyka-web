# Fixture: risk_manifest.example.json

**Scenario:** Multi-module change — worker report API, media upload, release workflow config  
**Tier:** T1 deploy to staging  
**Schema:** `risk_manifest.schema.md` (`rm_v1`)

```json
{
  "schema_version": "rm_v1",
  "run_id": "20260703-deploy-staging-T1",
  "risk_ontology_version": "risk_v1",
  "registry_ref": "docs/roma/registries/rt-critical-modules.yaml.md#0.1",
  "change_set_ref": "git:main..ae14b908",
  "global_risk_posture": "elevated",
  "modules": [
    {
      "module_id": "RTCRIT-WORKER-REPORT",
      "subject_ref": "FLOW-J3",
      "risk_score": 93,
      "risk_tier": "RT-Critical",
      "risk_class": "R2",
      "depth_recommendation": "T2",
      "blocking_policy": "UNKNOWN_ON_SKIP",
      "dimensions": {
        "business_criticality": { "value": 0.96, "signals": ["pilot_day0_journey"] },
        "mobile_impact": { "value": 0.88, "signals": ["IOS-Worker", "sync_push"] },
        "backend_dependency": { "value": 0.85, "signals": ["POST /api/v1/reports"] },
        "change_velocity": { "value": 0.7, "signals": ["4 commits 7d"] },
        "historical_failure_rate": { "value": 0.25, "signals": ["MEM-RECUR-J3-sync"] }
      },
      "rationale": "Report submission path changed; cross-surface pilot flow."
    },
    {
      "module_id": "RTCRIT-MEDIA-UPLOAD",
      "subject_ref": "api:storage/upload",
      "risk_score": 86,
      "risk_tier": "RT-Critical",
      "risk_class": "R1",
      "depth_recommendation": "T1",
      "blocking_policy": "UNKNOWN_ON_SKIP",
      "dimensions": {
        "security_exposure": { "value": 0.9, "signals": ["signed_url", "tenant_bucket"] },
        "data_sensitivity": { "value": 0.75, "signals": ["field_photos"] }
      },
      "rationale": "Upload size limit and MIME validation changed."
    },
    {
      "module_id": "RTCRIT-RELEASE-WORKFLOW",
      "subject_ref": "REL/deploy-cloudflare-staging",
      "risk_score": 88,
      "risk_tier": "RT-Critical",
      "risk_class": "R2",
      "depth_recommendation": "T0",
      "blocking_policy": "BLOCK_ON_SKIP",
      "dimensions": {
        "business_criticality": { "value": 0.9, "signals": ["deploy_gate"] },
        "change_velocity": { "value": 0.5, "signals": ["workflow_yaml_touch"] }
      },
      "rationale": "Staging deploy workflow input changed; T0 health gate mandatory."
    }
  ],
  "r0_modules": [],
  "generated_at": "2026-07-03T09:05:00Z"
}
```
