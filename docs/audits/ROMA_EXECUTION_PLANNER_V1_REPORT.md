# ROMA Execution Planner V1 Report

**Date:** 2026-07-04  
**Branch:** `security/platform-admin-separation`  
**Route:** `/[locale]/platform-admin/testing/execution-planner`  
**Verdict:** Deterministic planning layer — no test execution

---

## Purpose

Given a change set, the Execution Planner produces a **deterministic execution plan** by composing:

1. **Change Intelligence** (`analyzeChangeSet`, `selectTestsForChange`)
2. **Test Catalog** (test metadata, prerequisites, disabled state)
3. **Quality Graph** (implicit via change intelligence)

V1 plans phases and identifies blockers — it does **not** run tests, trigger CI, or enable catalog entries.

---

## Inputs / outputs

### Input

Same as Change Intelligence: `RomaChangeSetInput` (`changedPaths`, optional modules/APIs/mobile/env).

### Output (`RomaExecutionPlan`)

| Field | Description |
|-------|-------------|
| `planId` | Deterministic ID from sorted paths |
| `summary` | Plan overview |
| `releaseImpact` / `confidence` | From change analysis |
| `requiredTestDomains` | Catalog domains required |
| `selectedTests` | Planned tests (`executable: false`) |
| `blockedTests` | Missing creds/devices or catalog disabled |
| `skippedTests` | Skipped domains / filtered tests |
| `executionPhases` | Phase 0–7 groupings |
| `estimatedRuntime` | Sum of catalog runtimes |
| `requiredEnvironments` | staging, production, etc. |
| `requiredCredentials` | From prerequisites scan |
| `requiredDevices` | iOS/Android simulators, etc. |
| `evidenceRequired` | Union of catalog evidence fields |
| `riskRationale` | From change intelligence |
| `stopConditions` | Fail-closed rules |
| `manualReviewRequired` | P0/security/unknown changes |
| `nextSafeAction` | Owner guidance |

---

## Phase model

| Phase | Label | Domains |
|-------|-------|---------|
| 0 | Static / metadata | visual, release, pilot |
| 1 | Backend/API | backend, database, business_flow |
| 2 | Web/UI | web, ux |
| 3 | Security/RBAC | security |
| 4 | Mobile | mobile_ios, mobile_android |
| 5 | AI | ai |
| 6 | Performance / accessibility | performance, accessibility |
| 7 | Release readiness | release, pilot |

Phases with zero tests are omitted from the plan.

---

## V1 rules

- P0 / security / tenant / platform-admin → `manualReviewRequired`
- Auth/RBAC paths → security + backend + web + release domains
- Reports/storage → backend, business_flow, mobile domains
- AI paths → ai, backend, security
- Mobile paths → matching mobile domain
- Docs-only → minimal plan (0 tests, releaseImpact none)
- Unknown paths → confidence unknown, manual review
- All catalog tests `enabled: false` → `executable: false`; blocked with reason
- Missing credentials/devices (V1 assumes unavailable) → `blockedTests`
- No PASS without evidence (stop condition)

---

## Helpers

| Function | Description |
|----------|-------------|
| `createExecutionPlan(input)` | Full plan |
| `groupTestsIntoPhases(testIds)` | Phase assignment |
| `estimatePlanRuntime(plan)` | Runtime sum |
| `identifyRequiredEnvironments(plan)` | Env list |
| `identifyRequiredCredentials(plan)` | Credential list |
| `identifyRequiredDevices(plan)` | Device list |
| `identifyBlockedTests(selected)` | Blocked subset |
| `explainExecutionPlan(plan)` | Readable summary |

---

## Examples validated

1. Reports API + iOS Worker → phases 1 & 4, backend/mobile tests  
2. Auth middleware → manual review, security/backend/release  
3. AI copilot → phase 5, ai/backend/security  
4. Docs-only → empty plan, releaseImpact none  
5. Unknown path → manual review, no selected tests  

---

## Limitations (V1)

1. **No execution** — planning only  
2. **All tests blocked** when credentials/devices assumed missing + catalog disabled  
3. **Static examples in UI** — no interactive path editor  
4. **Runtime estimates** — parsed from catalog strings, approximate  
5. **Phase 7 overlap** — release/pilot domains also appear in phase 0  

---

## Next step: Execution Engine design

| Phase | Scope |
|-------|-------|
| **Engine V1** | Owner-gated staging runner, evidence capture |
| **Credential injection** | Secure env for E2E/mobile runs |
| **Catalog enable flags** | Per-test `enabled` after runner exists |
| **CI integration** | Optional GitHub workflow_dispatch |

---

## Security validation

| Control | Status |
|---------|--------|
| Platform owner route guard | Unchanged |
| No external calls | Verified |
| No execution endpoints | Verified |
| Cloudflare Access | Not modified |

**Tests:** `apps/web/lib/platform-admin/roma-execution-planner.test.ts`

---

## Verdict flags

| Flag | Value |
|------|-------|
| `ROMA_EXECUTION_PLANNER_READY` | **YES** |
| `TEST_EXECUTION_ENABLED` | **NO** |
| `READY_FOR_EXECUTION_ENGINE_DESIGN` | **YES** |
