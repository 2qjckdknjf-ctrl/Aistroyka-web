# ROMA Change Intelligence V1 Report

**Date:** 2026-07-04  
**Branch:** `security/platform-admin-separation`  
**Route:** `/[locale]/platform-admin/testing/change-intelligence`  
**Verdict:** Read-only change analysis — no test execution

---

## Purpose

The Change Intelligence Engine teaches ROMA to analyze code changes and determine:

- Affected product areas, roles, surfaces, APIs, mobile apps
- Associated risks from the Quality Graph
- Required test domains (catalog taxonomy)
- Recommended tests from the Test Catalog
- Release impact and confidence
- Human-readable explanation

V1 composes **Quality Graph V1** + **Test Catalog V1** without duplicating their logic.

---

## Inputs / outputs

### Input (`RomaChangeSetInput`)

| Field | Description |
|-------|-------------|
| `changedPaths` | File paths (required) |
| `changedModules` | Optional module tags |
| `changedApis` | Optional API graph node IDs |
| `changedMobileApps` | e.g. ios-worker, android-manager |
| `changedEnv` | Env/deploy file hints |

### Output (`RomaChangeIntelligenceResult`)

| Field | Source |
|-------|--------|
| `affectedAreas` | Quality Graph `getAffectedAreasForChange` |
| `affectedRoles` / `affectedApis` / `affectedMobileApps` | Graph `analyzeChangeImpact` |
| `affectedSurfaces` | Graph edges (exposes) |
| `affectedRisks` | Graph `getRisksForAffectedAreas` |
| `requiredTestDomains` | Graph test domains → catalog domains + path rules |
| `recommendedCatalogTests` | Test Catalog filters |
| `releaseImpact` | Graph release gate impact (+ docs-only override) |
| `confidence` | high / medium / low / unknown |
| `riskLevel` | critical → unknown |
| `explanation` | Summary string |
| `skippedDomains` | Domains not required + reason |
| `graphNodeIds` | All involved graph nodes |

---

## Rules implemented (V1)

| Change pattern | Effect |
|----------------|--------|
| `api/v1/reports/*` | Worker reports, backend, mobile iOS/Android, business_flow |
| auth/session/middleware | Authentication, security, backend, web, release |
| platform-admin/* | Platform Admin, ROMA QA Center, security, web, release |
| AI/copilot routes | AI Copilot, ai/backend/security domains |
| ios/* / android/* | Corresponding mobile domains + report areas |
| upload/storage | Backend, business_flow, storage risks |
| deploy/workflows | Release pipeline |
| docs-only (`docs/`, `*.md`) | Low impact, no release-critical tests unless security/release docs |
| unknown paths | UNKNOWN confidence, empty areas |

---

## Helpers

| Function | Description |
|----------|-------------|
| `analyzeChangeSet(input)` | Full analysis result |
| `getAffectedGraphNodes(input)` | All graph node IDs |
| `selectTestsForChange(input)` | Catalog test IDs |
| `calculateChangeRisk(input)` | Risk level |
| `explainChangeImpact(input)` | Readable summary |
| `getChangeIntelligenceEngine()` | `{ version: v1, executionEnabled: false }` |

---

## Examples validated (tests)

1. Reports API + iOS Worker → backend, mobile, business_flow tests  
2. Auth middleware → security, RBAC, release domains  
3. Platform Admin → owner grant, security tests  
4. AI copilot → ai-* catalog tests  
5. Docs-only → releaseImpact none, no release-critical tests  
6. Unknown path → confidence unknown, empty areas  

---

## UI

**Component:** `RomaChangeIntelligenceClient`  
**Page:** `platform-admin/testing/change-intelligence/page.tsx`

- Six static example scenarios (read-only simulation)
- No manual path input, no Run buttons
- Shows areas, domains, recommended tests, confidence, release impact

---

## Limitations (V1)

1. **Heuristic path rules** — not live git diff integration  
2. **No execution** — recommendations only; all catalog tests disabled  
3. **Static examples in UI** — no interactive path editor  
4. **Mobile app inference simplified** — alias map for changedMobileApps  
5. **skippedDomains lists all non-matched domains** — verbose by design for transparency  

---

## Next step: Execution Planner

| Phase | Scope |
|-------|-------|
| **Execution Planner V1** | Map recommended tests → owner-gated run plans |
| **Git integration** | PR diff → `RomaChangeSetInput` |
| **Confidence calibration** | Probe evidence + graph weights |
| **Enable catalog flags** | Flip `enabled` when runners exist |

---

## Security validation

| Control | Status |
|---------|--------|
| Platform owner route guard | Unchanged |
| No external calls | Verified |
| No execution endpoints | Verified |
| Cloudflare Access | Not modified |

**Tests:** `apps/web/lib/platform-admin/roma-change-intelligence.test.ts`

---

## Verdict flags

| Flag | Value |
|------|-------|
| `ROMA_CHANGE_INTELLIGENCE_READY` | **YES** |
| `TEST_EXECUTION_ENABLED` | **NO** |
| `READY_FOR_EXECUTION_PLANNER` | **YES** |
