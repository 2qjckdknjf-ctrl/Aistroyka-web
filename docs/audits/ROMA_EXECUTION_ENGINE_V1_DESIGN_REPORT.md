# ROMA Execution Engine V1 Design Report

**Date:** 2026-07-04  
**Branch:** `security/platform-admin-separation`  
**Route:** `/[locale]/platform-admin/testing/execution-engine`  
**Verdict:** Design-only policy layer — no execution, no runners

---

## Purpose

Define how ROMA will **safely execute plans in the future** without implementing active execution in V1. The Execution Engine policy layer sits after:

```
Quality Graph → Test Catalog → Change Intelligence → Execution Planner → Execution Engine (policy)
```

V1 delivers types, deterministic policy evaluation, UI documentation, and activation checklist — **not** runners, shell exec, CI triggers, or Run controls.

---

## Safety model

| Principle | V1 enforcement |
|-----------|----------------|
| Read-only default | `PLAN_ONLY` / `DRY_RUN` / readonly audit modes only |
| Staging-first | All modes require staging-first; production is readonly audit only |
| No automatic deploy | `deploy` in forbidden actions |
| No automatic fixes | `auto_fix` forbidden |
| No DB mutation | `db_mutation` forbidden unless future explicit owner approval (not in V1) |
| No feature-flag enablement | `feature_flag_enablement` forbidden without owner approval |
| Manual approval for P0/security/RBAC | `MANUAL_APPROVAL_REQUIRED` + approval kinds |
| Audit log for every run | Documented in `auditRequirements` (not implemented) |
| Production mutation | **Never** — `productionMutationAllowed: false` always |

---

## Execution modes

| Mode | Read-only | Staging-first | Evidence sink | Manual approval |
|------|-----------|---------------|---------------|-----------------|
| `PLAN_ONLY` | yes | yes | no | no |
| `DRY_RUN` | yes | yes | no | no |
| `SAFE_READONLY_AUDIT` | yes | yes | **yes** | no |
| `STAGING_EXECUTION` | no* | yes | yes | yes |
| `PRODUCTION_READONLY_AUDIT` | yes | yes | yes | yes |
| `MANUAL_APPROVAL_REQUIRED` | yes | yes | no | yes |

\* Staging execution runs tests against staging — still no deploy/DB mutation/feature flags.

**No `LIVE_MUTATION` mode in V1.**

---

## Policy decisions

`evaluateExecutionPolicy({ plan, context? })` returns `RomaExecutionPolicyDecision`:

- `executionEnabled: false` — global V1 kill switch
- `isExecutable: false` — no runs permitted
- `policyGatesPassed` — true when blockers (except engine activation) are cleared
- `allowedModes` — deterministic mode set per plan + context
- `recommendedMode` — highest safe mode for the plan
- `requiredApprovals` — platform_owner, security_reviewer, release_owner, manual_p0_review
- `blockedReasons` — catalog disabled, missing creds/devices, missing approvals
- `activationBlockers` — prerequisites before any future enablement

### Example outcomes (default fail-closed context)

| Plan | Recommended mode | Allowed modes (subset) |
|------|------------------|------------------------|
| Reports API + iOS | `MANUAL_APPROVAL_REQUIRED` | PLAN_ONLY, DRY_RUN, MANUAL_APPROVAL_REQUIRED |
| Auth middleware | `MANUAL_APPROVAL_REQUIRED` | + security approvals required |
| AI copilot | `MANUAL_APPROVAL_REQUIRED` | ai/backend/security domains |
| Docs-only | `DRY_RUN` | PLAN_ONLY, DRY_RUN only |
| Unknown path | `MANUAL_APPROVAL_REQUIRED` | PLAN_ONLY, MANUAL_APPROVAL_REQUIRED |

---

## Blockers before activation

1. Owner approves engine activation (separate gate)
2. Catalog tests enabled with rollback docs
3. Evidence sink + run-history store on platform-admin boundary
4. Staging credential vault (scoped tokens)
5. Audit pipeline (actor, planId, mode, evidence refs)
6. Manual approval workflow for P0/security plans
7. Safe Readonly Audit runner (no web UI shell exec)
8. Production readonly probes isolated from staging runners

---

## Forbidden actions (all modes)

- `deploy`
- `auto_fix`
- `db_mutation`
- `feature_flag_enablement`
- `production_mutation`
- `ci_trigger`
- `catalog_enable_without_owner`

---

## Files

| File | Role |
|------|------|
| `roma-execution-engine.types.ts` | Modes, context, decision types |
| `roma-execution-engine-policy.ts` | `evaluateExecutionPolicy`, mode definitions |
| `roma-execution-engine-policy.test.ts` | Safety and determinism tests |
| `RomaExecutionEngineClient.tsx` | Read-only UI |
| `testing/execution-engine/page.tsx` | Platform-admin route |

---

## Limitations (V1)

1. No runner implementation
2. No evidence storage or run history
3. No credential/device availability detection (defaults fail-closed)
4. All catalog tests remain `enabled: false`
5. `policyGatesPassed` can be true in theory but `isExecutable` is always false
6. UI shows policy only — no interactive context editor

---

## Next step: Safe Readonly Audit implementation

| Phase | Scope |
|-------|-------|
| **Readonly runner V1** | Staging health/headers/RBAC probes with evidence capture |
| **Evidence sink** | Immutable artifact store linked to planId |
| **Run history** | Append-only audit table under platform-owner RLS |
| **Activation gate** | Owner flag + single catalog test enabled |
| **Still forbidden** | Deploy, DB mutation, production write, CI auto-trigger |

---

## Verdict flags

| Flag | Value |
|------|-------|
| `ROMA_EXECUTION_ENGINE_DESIGN_READY` | **YES** |
| `TEST_EXECUTION_ENABLED` | **NO** |
| `READY_FOR_SAFE_READONLY_AUDIT` | **YES** |

---

## Security validation

| Control | Status |
|---------|--------|
| Platform owner route guard | Unchanged |
| No external calls / shell exec | Verified |
| No execution endpoints | Verified |
| Cloudflare Access | Not modified |

**Tests:** `apps/web/lib/platform-admin/roma-execution-engine-policy.test.ts`
