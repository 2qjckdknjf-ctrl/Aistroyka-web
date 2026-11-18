# Fixture: reasoning_trace.example.json

**Scenario:** Auth login flow change + session middleware touch  
**Tier:** T1  
**Registry modules:** `RTCRIT-AUTH`  
**Schema:** `reasoning_trace.schema.md` (`rt_v1`, full mode)

```json
{
  "schema_version": "rt_v1",
  "decision_id": "RD-20260703-pr-auth-T1-001",
  "run_id": "20260703-pr-auth-T1",
  "decision_unit": "module",
  "unit_ref": "RTCRIT-AUTH",
  "reasoning_mode": "full",
  "questions": {
    "change_summary": {
      "text": "Modified apps/web/middleware.ts session refresh and login redirect next= handling.",
      "refs": ["git:pr-482:apps/web/middleware.ts", "git:pr-482:apps/web/app/[locale]/(public)/login"]
    },
    "materiality": {
      "text": "Auth gate for all dashboard and portal entry; pilot users depend on stable login→dashboard path.",
      "score_norm": 0.92
    },
    "affected_actors": {
      "roles": ["contractor_admin", "worker", "guest"],
      "surfaces": ["WEB", "public", "dashboard"],
      "tenant_scope": "all_tenants"
    },
    "failure_probability": {
      "value": 0.58,
      "method": "regression+history"
    },
    "impact": {
      "severity": "P0",
      "risk_class": "R2",
      "blast_radius_nodes": 24
    },
    "evidence_present": [
      { "type": "EV-DIFF", "ref": "artifacts/git-diff-middleware.txt" }
    ],
    "evidence_gaps": [
      { "type": "EV-SCREEN", "detail": "No post-login dashboard screenshot this run" },
      { "type": "COV-ROLE", "detail": "worker mobile login chain not executed" }
    ],
    "recommendation": {
      "action": "RUN",
      "targets": ["WEB-auth-smoke", "WEB-login-dashboard-redirect", "BCK-session-health"]
    },
    "recommendation_confidence": {
      "percent": 61,
      "caps_applied": ["EVIDENCE_GAP_RT_CRITICAL"]
    }
  },
  "rationale_summary": "Middleware auth change on RTCRIT-AUTH requires WEB smoke and session API probe before merge; missing dashboard evidence caps confidence.",
  "governance_ref": ["ADR-0007", "ADR-0008", "sm_v1"],
  "memory_refs": ["MEM-RECUR-WEB-auth-redirect-2025"],
  "knowledge_refs": ["page:login", "api:auth/session", "RTCRIT-AUTH"],
  "created_at": "2026-07-03T08:10:00Z"
}
```
