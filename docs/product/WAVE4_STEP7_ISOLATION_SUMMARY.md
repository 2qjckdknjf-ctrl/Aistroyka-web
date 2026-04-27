# Wave 4 Step 7 — Isolation summary

**Date:** 2026-03-29

## What changed

- New **`tenant_members.role = stakeholder`** (migration) for external portal users.  
- **Tenant RBAC:** stakeholders do **not** get `canReadProjects`.  
- **Project service:** stakeholder listing/read paths; **`getProjectForInternalWorkspace`** blocks internal APIs.  
- **Accept flow:** insert/upgrade to `stakeholder` instead of `viewer`.  
- **Middleware:** redirects keep stakeholders on **projects list** and **client portal** subtree.  
- **Dashboard shell:** minimal nav when `portalOnlyStakeholder`.

## Docs in this closure pack

1. `WAVE4_STEP7_ISOLATION_INVENTORY.md`  
2. `WAVE4_STEP7_ISOLATION_BACKEND_REPORT.md`  
3. `WAVE4_STEP7_ISOLATION_UI_REPORT.md`  
4. `WAVE4_STEP7_ISOLATION_POLICY_REPORT.md`  
5. `WAVE4_STEP7_ISOLATION_VALIDATION_REPORT.md`  
6. `WAVE4_STEP7_ISOLATION_POST_AUDIT.md`  
7. `WAVE4_STEP7_ISOLATION_SUMMARY.md` (this file)

## Bottom line

**App-layer portal isolation:** implemented and tested.  
**DB-layer isolation:** not completed; post-audit **NO** under strict leakage rules.
