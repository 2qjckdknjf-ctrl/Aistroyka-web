# Wave 0.5 — Auth / tenant / role **runtime** proof

**Date:** 2026-03-26 (UTC)  
**Constraint:** No auth/tenant refactor. **No** live Supabase session in agent environment for full E2E.

---

## 1. What was executed vs documented-only

| Check type | Executed in Wave 0.5? | Evidence |
|------------|----------------------|----------|
| **Android release build + bypass flag** | **YES** | `assembleRelease` + `verify-worker-release-no-photo-bypass.sh` |
| **Vitest (web)** | **NO** | Shell had **no** `node` / `npm` / `bun` on `PATH` in automation environment |
| **curl smoke / pilot_launch** | **NO** | Depends on env secrets + network; not run here |
| **Static + unit test inventory** | **YES** | Files below |

**Conclusion:** **G3 runtime** is **PARTIAL** — **automated lite-client proofs** exist in repo but were **not re-run** here; **live** tenant isolation **not** proven in this session.

---

## 2. Role model (product vs DB)

| Product term | DB / code anchor |
|--------------|------------------|
| **Admin** | `requireAdmin`: `tenant_members.role` ∈ `owner`, `admin` — `apps/web/src/features/admin/auth/requireAdmin.ts` |
| **Manager** (web) | Same tenant users; operational UI under `(dashboard)/dashboard/**` — **no** DB enum `manager` |
| **Worker** | Mobile apps + `/api/v1/worker/*` with tenant context; **lite** uses `ios_lite` / `android_lite` |
| **Client / Owner** | Web: `OwnerViewClient`, `?viewer=owner` on attention API |

---

## 2a. Lite allow list (static proof)

**Source:** `apps/web/lib/api/lite-allow-list.ts`  
**Tests:** `apps/web/lib/api/lite-allow-list.test.ts` (Vitest)

**Proven by tests (when `npx vitest run lib/api/lite-allow-list.test.ts` is executed):**

- `ios_lite` / `android_lite`: **403** on `POST /api/v1/projects`, admin paths, generic `GET /api/v1/reports/:id` (non-`analysis-status`).
- **Allowed** for lite: `GET /api/v1/projects`, `config`, `worker` prefix, `sync`, `media/upload-sessions`, `devices`, `reports/:id/analysis-status`.

**Inconsistency note:** Tests allow `GET /api/v1/worker` for lite; production route `app/api/v1/worker/route.ts` returns **501 stub** — **safe** (no data leak) but **confusing** for operators.

---

## 3. Middleware (browser session)

**Source:** `apps/web/middleware.ts`  
- `/api/v1`: lite check only, then `NextResponse.next()` — **no cookie auth enforced in middleware for API**.  
- **Dashboard** routes: `updateSession` + redirect to login if no user.

**Pass/Fail:** **Documented PASS** for structure; **live** session not exercised here.

---

## 4. Runtime matrix (target state for Wave 1+)

| Role | Web | API (Bearer/cookie) | Mobile |
|------|-----|---------------------|--------|
| **Admin** | `/admin/*` gated by `requireAdmin` | `/api/v1/admin/*` via tenant + role in handlers | N/A (use web or future) |
| **Manager** | Dashboard shell | Full `reports`, `tasks`, etc. (non-lite) | `ios_manager` / `android_manager` |
| **Worker** | N/A primary | Lite allow list + worker routes | Worker apps |
| **Client/Owner** | Owner views | Project/attention APIs as implemented | R1 **new** apps |

---

## 5. Blockers before Wave 1 **product** work

1. **Run** `vitest` lite-allow-list + agreed smoke (`scripts/smoke/pilot_launch.sh`) on CI or dev machine with secrets — **close “not run” gap**.  
2. **Document** one **golden** user per role for manual/API checks.  
3. **Worker summary** API (`workers/[userId]/summary`) — verify Bearer + `createClient` choice before earnings light (Wave 0 matrix note).

---

## 6. Wave 0.5 verdict

**G3:** **PARTIAL** — matrix **explicit**; **runtime** suite **not** fully executed in this environment; **static** proofs **strong** for lite list via committed tests.
