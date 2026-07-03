# Fixture: decision_bundle.example.json

**Scenario:** Worker report flow + mobile worker + AI Copilot touched in same release candidate  
**Tier:** T2 council  
**Registry modules:** `RTCRIT-WORKER-REPORT`, `RTCRIT-MOBILE-WORKER`, `RTCRIT-AI-COPILOT`  
**Schema:** `decision_bundle.schema.md` (`db_v1`)

```json
{
  "schema_version": "db_v1",
  "bundle_id": "DB-20260703-council-pilot-rc",
  "run_id": "20260703-council-pilot-rc",
  "trigger": "council",
  "tier": "T2",
  "environment": "staging",
  "decisions": [
    {
      "decision_id": "RD-20260703-council-001",
      "type": "RUN",
      "targets": ["FLOW-J3-e2e", "IOS-Worker-UITest-smoke", "WEB-manager-report-inbox"],
      "tier": "T2",
      "confidence": 74,
      "rationale_ref": "reasoning_traces/RD-20260703-council-001.json",
      "blocking": false
    },
    {
      "decision_id": "RD-20260703-council-002",
      "type": "RUN",
      "targets": ["AI-copilot-live-classify", "AI-tenant-leakage-negative"],
      "tier": "T2",
      "confidence": 52,
      "rationale_ref": "reasoning_traces/RD-20260703-council-002.json",
      "blocking": false
    },
    {
      "decision_id": "RD-20260703-council-003",
      "type": "SKIP",
      "targets": ["AND-Worker-instrumented-full"],
      "tier": "T2",
      "confidence": 35,
      "rationale_ref": "reasoning_traces/RD-20260703-council-003.json",
      "blocking": false
    },
    {
      "decision_id": "RD-20260703-council-004",
      "type": "RUN",
      "targets": ["SEC-finance-denylist-probe", "REL-prereq-gates"],
      "tier": "T2",
      "confidence": 70,
      "rationale_ref": "reasoning_traces/RD-20260703-council-004.json",
      "blocking": true
    }
  ],
  "release_posture": {
    "recommended_state": "Conditional",
    "confidence_percent": 58,
    "blocking_decisions": []
  },
  "conflicts_resolved": [
    {
      "engines": ["IF-ENG-RISK", "IF-ENG-COV"],
      "chosen_path": "RUN FLOW-J3 despite medium coverage percent",
      "rationale": "Registry RTCRIT-WORKER-REPORT overrides coverage defer"
    }
  ],
  "build_stamp": { "sha7": "ae14b90" },
  "inventory_hash": "inv_pilot_rc_20260703",
  "advisory_only": true,
  "governance_ref": ["ADR-0007", "ADR-0002", "ADR-0008"],
  "created_at": "2026-07-03T15:00:00Z"
}
```
