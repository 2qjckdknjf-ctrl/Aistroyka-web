# Fixture: release_confidence.example.json

**Scenario:** Pilot release candidate — worker mobile + release workflow + partial coverage  
**Tier:** T2 council  
**Schema:** `release_confidence.schema.md` (`rc_v1`)

```json
{
  "schema_version": "rc_v1",
  "run_id": "20260703-council-pilot-rc",
  "confidence_percent": 56,
  "state": "Pilot Ready",
  "components": {
    "functional_quality": 70,
    "backend_reliability": 82,
    "security": 68,
    "ai_readiness": 48,
    "performance": 72,
    "accessibility": 58,
    "coverage_completeness": 42,
    "regression_prediction": 65,
    "historical_stability": 68,
    "pqs_correlation": 63
  },
  "blocking_reasons": [],
  "gates": [
    {
      "gate_id": "GATE-R0-ZERO",
      "status": "pass",
      "blocking": true,
      "evidence_ref": "risk_manifest.json#r0_modules"
    },
    {
      "gate_id": "GATE-T0-STAGING",
      "status": "pass",
      "blocking": true,
      "evidence_ref": "evidence_index.json#build_stamp"
    },
    {
      "gate_id": "GATE-PQS-MIN",
      "status": "pass",
      "blocking": true,
      "evidence_ref": "PQS.json"
    },
    {
      "gate_id": "GATE-AI-LIVE",
      "status": "unknown",
      "blocking": false,
      "evidence_ref": "artifacts/logs/AI-copilot-classify.log"
    },
    {
      "gate_id": "GATE-PILOT-INTAKE",
      "status": "fail",
      "blocking": false,
      "evidence_ref": "docs/launch/PILOT_INTAKE_CARD.md"
    },
    {
      "gate_id": "GATE-MOBILE-IOS",
      "status": "pass",
      "blocking": false,
      "evidence_ref": "artifacts/mobile/IOS-Worker-UITest.xml"
    },
    {
      "gate_id": "GATE-MOBILE-AND",
      "status": "unknown",
      "blocking": false,
      "evidence_ref": "docs/mobile/P3_ANDROID_DEFER_DECISION.md"
    }
  ],
  "pqs": { "value": 61, "version": "pqs_v1" },
  "confidence_delta": 3,
  "pilot_intake_status": "NOT_READY",
  "release_unit": {
    "web_sha7": "ae14b90",
    "ios_build": "pilot-rc-42",
    "android_build": null
  },
  "waivers": [
    {
      "gate_id": "GATE-MOBILE-AND",
      "reason": "P3 Android deferred for first pilot",
      "council_ref": "docs/mobile/P3_ANDROID_DEFER_DECISION.md"
    }
  ],
  "advisory_only": true,
  "generated_at": "2026-07-03T16:30:00Z"
}
```
