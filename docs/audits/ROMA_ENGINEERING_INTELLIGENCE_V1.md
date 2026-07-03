# ROMA Engineering Intelligence V1

**Date:** 2026-07-03  
**Branch:** `security/platform-admin-separation`  
**Scope:** Rule-based engineering intelligence layer for ROMA Live Operations Center

---

## Summary

Added the first **real intelligence layer** of ROMA — a deterministic rule engine that transforms live probe snapshots into human-readable engineering conclusions. No LLM, no automatic fixes, no test execution, recommendation-only.

---

## Engine

| File | Role |
|------|------|
| `roma-engineering-intelligence.ts` | Rule engine V1 |
| `roma-engineering-intelligence.types.ts` | Output model |
| `roma-engineering-intelligence.test.ts` | Unit tests |

**Input:** `RomaQualityDashboard` snapshot  
**Output:** `RomaEngineeringIntelligence`

---

## Output model

- Engineering Assessment / Summary
- Release Decision (`READY` | `NOT READY` | `READY WITH WARNINGS`)
- Risk Analysis
- Business Impact
- Action Plan
- Confidence Score (`high` | `medium` | `low`)
- Top Risks (structured issues)
- Recommendations
- Reasoning chains

Each issue includes: what happened, why, affected components, user/business/release impact, severity, confidence, recommended action, recheck conditions, evidence.

---

## Rules V1 implemented

| Rule ID | Trigger | Release impact |
|---------|---------|----------------|
| `storage_impact` | Storage unavailable/degraded | NOT READY / warnings |
| `openai_missing` | AI not configured | READY WITH WARNINGS |
| `env_missing_*` / `env_forbidden_*` / `cron_not_configured` | Critical env issues | NOT READY |
| `migration_review` | Migration probe failed/blocked | Manual review / warnings |
| `core_health_degraded` | Overall health not healthy | NOT READY / warnings |
| `database_unavailable` | DB probe failed | NOT READY |
| `billing_flag_inconsistent` | Stripe flag vs config mismatch | Warnings |
| `low_data_coverage` | Coverage < 50% | LOW confidence |

---

## Confidence model

- **LOW:** coverage < 40%, low-confidence issues, or missing core_health/supabase_db probes
- **MEDIUM:** coverage < 70% or medium-confidence issues
- **HIGH:** adequate coverage and clear evidence

Never invents facts — insufficient evidence → LOW confidence.

---

## UI

New top card on `/[locale]/platform-admin/testing`:

**Engineering Intelligence** — release recommendation badge, reasoning, recommendations, business impact, confidence, top risks.

---

## Validation

```bash
cd apps/web && bun run test -- \
  lib/platform-admin/roma-engineering-intelligence.test.ts \
  lib/platform-admin/roma-quality-dashboard.page.test.ts
```

---

## Limitations

- Rule engine only (V1) — no LLM reasoning
- No automatic remediation or test execution
- Release decision is advisory; operator judgment required
- Rules keyed to current probe/dashboard fields only

---

## Verdicts

| Verdict | Value |
|---------|-------|
| `ROMA_ENGINEERING_INTELLIGENCE_V1` | **YES** |
| `TEST_EXECUTION_ENABLED` | **NO** |
| `READY_FOR_SAFE_AUDIT` | **YES** |
