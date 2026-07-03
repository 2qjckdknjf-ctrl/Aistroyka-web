# Platform Admin — ROMA / Testing Placement Decision

**Date:** 2026-07-03  
**Branch:** `feature/roma-qa-framework` @ `01706f46a416dc9d8a28bb83f7574fbe28084783`  
**Status:** Architecture decision only. No implementation.

**Related:**
- [`PLATFORM_ADMIN_TARGET_RESTRUCTURE_PLAN.md`](./PLATFORM_ADMIN_TARGET_RESTRUCTURE_PLAN.md)
- [`ADMIN_CABINET_STATE_AUDIT.md`](./ADMIN_CABINET_STATE_AUDIT.md)
- `docs/qa/QA_PLATFORM.md` (offline QA scaffold)
- `docs/roma/` (ROMA architecture — **not modified**)

---

## 1. Decision summary

| Question | Decision |
|----------|----------|
| **Where does ROMA live?** | **Platform Admin Cabinet only** (`admin.aistroyka.ai` → `/testing`) |
| **Who can see ROMA?** | `platform_owner_grants`: `OWNER`, `OWNER_OPERATOR`, `OWNER_READONLY` (read); write/execute narrower |
| **Who can trigger tests?** | `OWNER_OPERATOR` and `OWNER` only; not `OWNER_READONLY`, not tenant admins |
| **Can tenant admins trigger system tests?** | **NO** |
| **Can ROMA access production data?** | **Restricted** — read-only metadata by default; mutating E2E uses dedicated pilot credentials on staging |
| **What must be isolated?** | Execution plane, secrets, cross-tenant reports, release gates, artifacts |

**ROMA_TARGET_LOCATION = `admin.aistroyka.ai/testing` (Platform Admin → Testing)**

Fallback path: `aistroyka.ai/platform-admin/testing`

---

## 2. Rationale

### 2.1 Why platform admin, not tenant admin

| Factor | Tenant admin | Platform admin |
|--------|--------------|----------------|
| Cross-tenant test scope | ❌ Wrong boundary | ✅ Correct |
| Release gate authority | ❌ Contractor cannot approve platform release | ✅ Platform operator role |
| Artifact sensitivity (screenshots, traces) | ❌ Leaks other tenants | ✅ Controlled access |
| Existing owner security stack | ❌ Only `requireAdmin` | ✅ `gateOwnerRequest`, audit, rate limit, step-up |
| ROMA OS design (Stage 2C) | QA app on ROMA OS | Platform adapter = AISTROYKA | Fits platform cabinet |

### 2.2 Why not public dashboard or CI-only

- **CI-only** (`scripts/qa/`, GitHub Actions) remains the execution engine initially, but **operators need a cabinet** to view verdicts, history, and approve release.
- **Tenant dashboard** may later show **project-level QA status** (e.g. "pilot smoke passed for your project") — not global ROMA.

### 2.3 Relationship to existing QA scaffold

| Asset | Location | Placement |
|-------|----------|-----------|
| Playwright suites | `apps/web/tests/qa/` | Invoked by platform backend / CI — not tenant UI |
| Orchestration scripts | `scripts/qa/` | Platform job runner (Worker cron or GH Actions) |
| Reports | `docs/qa/reports/` | **Ingest into platform DB/storage** → served at `/testing` |
| QA workflow | `.github/workflows/qa-platform.yml` | CI; posts results to platform API (future) |

**ROMA docs (`docs/roma/`)** stay documentation-only until platform runtime is approved. No ROMA code moves into tenant admin.

---

## 3. Capability matrix

| Capability | Phase | Location | Roles |
|------------|-------|----------|-------|
| View release readiness score | 1 (read-only) | `/testing` | all platform owner roles |
| View last CI / QA report | 1 | `/testing/reports` | all platform owner roles |
| View failed tests list | 1 | `/testing/reports/[runId]` | all platform owner roles |
| View backend/design/security report buckets | 2 | `/testing/reports/[runId]/categories` | all platform owner roles |
| View artifacts (screenshot, trace, logs) | 2 | `/testing/artifacts/[id]` | `OWNER`, `OWNER_OPERATOR` (readonly redacted) |
| Trigger test suite (staging) | 3 | `POST /api/v1/platform/testing/run` | `OWNER_OPERATOR`, `OWNER` |
| Trigger test suite (production) | 4+ | same API + step-up | `OWNER` only + step-up HMAC |
| Approve feature release after tests | 3 | `/testing/releases/[id]/approve` | `OWNER` only |
| Device coverage dashboard | 2 | `/testing/coverage/devices` | all platform owner roles |
| ROMA intelligence engines (risk, regression) | 4+ | `/testing/intelligence/*` | per engine policy |

---

## 4. Access control answers

### 4.1 Who can see ROMA?

| Actor | See global ROMA reports | See tenant-scoped pilot status |
|-------|-------------------------|--------------------------------|
| Public | ❌ | ❌ |
| Tenant member | ❌ | ❌ |
| Tenant admin | ❌ | ⚠️ Future: limited project pilot badge only |
| `OWNER_READONLY` | ✅ | ✅ |
| `OWNER_OPERATOR` | ✅ | ✅ |
| `OWNER` | ✅ | ✅ |

### 4.2 Who can trigger tests?

| Actor | Staging suite | Production suite |
|-------|---------------|------------------|
| Tenant admin | ❌ | ❌ |
| `OWNER_READONLY` | ❌ | ❌ |
| `OWNER_OPERATOR` | ✅ | ❌ |
| `OWNER` | ✅ | ✅ (with step-up) |
| CI service token | ✅ | ⚠️ staging only by default |

### 4.3 Can tenant admins trigger system tests?

**NO.** System tests validate platform invariants (security headers, RBAC, AI boundaries, cross-tenant isolation). Allowing tenant admins to trigger them would:

- Leak cross-tenant failure information in artifacts
- Create DoS risk against shared staging/production
- Confuse release authority (contractor vs platform)

### 4.4 Can ROMA access production data?

| Data class | Policy |
|------------|--------|
| Production PII / tenant business content | **NO** in automated suites by default |
| Production metadata (health, buildStamp, public routes) | ✅ YES |
| Staging pilot credentials (`PILOT_E2E_*`) | ✅ YES — designated test accounts |
| Supabase service role in tests | **Staging only**; never in tenant-triggered jobs |
| AI live provider tests | `scripts/smoke/ai_live_provider.sh` gate — platform job only |

### 4.5 What must be isolated?

| Layer | Isolation |
|-------|-----------|
| **UI** | Platform host only; no ROMA components under `(dashboard)/admin` |
| **API** | `/api/v1/platform/testing/*` — `requirePlatformOwnerApi` |
| **Execution** | CI/Worker job queue separate from tenant `analysis_jobs` |
| **Artifacts** | Private bucket or R2 prefix `platform-testing/{runId}/` — no public URLs |
| **Reports** | Normalized store (Supabase `platform_test_runs` table — future); not committed markdown in repo for runtime |
| **Secrets** | `PILOT_E2E_*`, `CRON_SECRET`, Playwright storage — platform env only |
| **Audit** | Every view of artifact bundle + every run/approve → platform audit |

---

## 5. UI placement within platform cabinet

```
admin.aistroyka.ai
├── /                      Overview (existing owner console)
├── /tenants               ...
├── /billing               ...
├── /testing               ROMA hub (NEW)
│   ├── /testing/reports           List runs + RELEASE_VERDICT
│   ├── /testing/reports/[runId] Run detail + failed tests
│   ├── /testing/coverage          Route/device coverage
│   ├── /testing/artifacts/[id]    Screenshot/trace viewer
│   └── /testing/releases          Release approval queue (phase 3)
```

**Do not** add `/admin/testing` on tenant host.

---

## 6. API placement

### Phase 1 (read-only)

```
GET  /api/v1/platform/testing/overview
GET  /api/v1/platform/testing/runs?limit=
GET  /api/v1/platform/testing/runs/[runId]
GET  /api/v1/platform/testing/runs/[runId]/failures
GET  /api/v1/platform/testing/coverage
```

Data source initially: ingest `docs/qa/reports/*.json` from CI artifact upload.

### Phase 2 (artifacts)

```
GET  /api/v1/platform/testing/artifacts/[artifactId]
```

### Phase 3 (execution + approval)

```
POST /api/v1/platform/testing/run          { suite, target_url, mode }
POST /api/v1/platform/testing/releases/[id]/approve   (OWNER + step-up)
```

---

## 7. Tenant-facing pilot status (future, optional)

If contractors need visibility:

| Surface | Content | Guard |
|---------|---------|-------|
| `/dashboard` banner | "Pilot environment: smoke passed 2026-07-01" | Tenant member |
| Project detail chip | Project-level QA status | Project member |

**Not** global ROMA reports, failed test traces, or release approval.

---

## 8. Migration from today

| Today | Target |
|-------|--------|
| Operator "Run smoke suite" (`/api/v1/admin/operator/smoke`) | **Stays tenant admin** — tenant health smoke, not ROMA |
| `docs/qa/reports/RELEASE_VERDICT.md` | Ingested → `/testing` |
| `bun run qa:platform` CLI | CI + platform API trigger |
| ROMA intelligence docs | Phase 4+ UI under `/testing/intelligence` |

---

## 9. Security requirements for ROMA on platform admin

1. ROMA UI only on `admin.aistroyka.ai` (host middleware).
2. Cloudflare Access in front of testing routes.
3. Artifact URLs are signed, short-lived, audit-logged.
4. No ROMA API in lite client allow-list.
5. `OWNER_READONLY` sees summaries only; traces redacted or withheld.
6. Production test runs require `OWNER` + step-up + explicit env flag `APPROVE_PRODUCTION_QA_RUN=YES`.

---

## 10. Verdict

```
ROMA_TARGET_LOCATION = admin.aistroyka.ai/testing (Platform Admin Cabinet)
ADMIN_TESTING_SECTION_READY = NOT_READY (architecture decided; implementation not started)
ROMA_CAN_BE_EMBEDDED_NOW = PARTIAL (platform shell + owner gate exist; no testing routes/persistence)
```

**Next implementation step (when approved):** Phase 1 read-only `/testing` page consuming CI-uploaded `RELEASE_VERDICT.json` — platform host only, no tenant admin exposure.
