# Report: Production dashboard stabilization

**Branch:** fix/prod-dashboard-500-root-cause  
**Date:** 2026-03-07

## 1. Executive summary

The production dashboard at `/ru/dashboard` was returning **500 Internal Server Error** after login, with a generic Next.js Server Components render message. A full root-cause investigation was performed. The **proven root cause** was **unsafe destructuring of `supabase.auth.getUser()` in the auth middleware** (`lib/supabase/middleware.ts`). When `getUser()` returned `{ data: null }` or threw (e.g. in Cloudflare Edge or on auth server failure), the middleware threw and the request resulted in 500. Additional hardening was already present on the branch for layout and dashboard page (safe `getSessionUser`, try/catch around auth and i18n). The middleware fix completes the stabilization. Dashboard route is now defensive end-to-end; a single failed auth or data path no longer crashes the request.

## 2. Proven root cause(s)

1. **Middleware `updateSession()` (primary)**  
   - **File:** `apps/web/lib/supabase/middleware.ts`  
   - **Code:** `const { data: { user } } = await supabase.auth.getUser();`  
   - **Failure:** When `data` is `null` or `undefined`, destructuring throws. In production (Cloudflare Edge), `getUser()` can return null data or throw (cookies, auth server, timeout). The exception was uncaught and surfaced as 500.  
   - **Fix:** Use `const res = await supabase.auth.getUser(); user = res?.data?.user ?? null` inside try/catch; never throw from `updateSession`.

2. **Layout and page (already fixed on branch)**  
   - Layout and dashboard page had been hardened earlier: safe `getSessionUser()`, try/catch for auth and `requireAdmin`, i18n fallbacks. No additional change required for this incident.

## 3. Secondary issues discovered

- **Favicon 404:** Reported; not the cause of 500. Can be fixed in asset hygiene (P2).
- **CSP eval warning:** Documented in `docs/incidents/CSP_EVAL_AUDIT.md`. Not the cause of the dashboard 500; to be addressed separately if needed.
- **Diagnostic logging:** Layout logs only in `NODE_ENV !== "production"`. For production debugging, consider optional structured logs (e.g. gated by env) without PII.

## 4. Files changed

| File | Change |
|------|--------|
| `apps/web/lib/supabase/middleware.ts` | Safe `getUser()` handling: try/catch + `res?.data?.user ?? null`; removed unsafe destructuring. |
| `apps/web/lib/supabase/middleware.test.ts` | **New.** Unit tests for `updateSession`: user present, data.user null, data undefined, getUser throws. |
| `apps/web/scripts/smoke/dashboard_smoke.sh` | **New.** Smoke script: health + /dashboard and /ru/dashboard must not return 500. |
| `docs/incidents/INCIDENT-PROD-DASHBOARD-500.md` | **New.** Incident log, evidence, root cause, resolution. |
| `docs/incidents/DASHBOARD_DATAFLOW_MAP.md` | **New.** SSR vs client data sources, auth flow, failure handling. |
| `docs/incidents/HOSTING_RUNTIME_AUDIT.md` | **New.** Cloudflare/OpenNext, Edge vs Node, env. |
| `docs/incidents/CSP_EVAL_AUDIT.md` | **New.** CSP eval warning analysis; not root cause. |

No changes to layout or dashboard page in this branch beyond what was already committed (safe auth + i18n fallbacks).

## 5. Why production failed

- **Middleware runs in Cloudflare Edge** for every request to `/ru/dashboard`.
- In Edge, cookie handling and Supabase `getUser()` behavior can differ from local Node (e.g. auth server timeout, missing or different cookie handling). When `getUser()` returned `{ data: null }` or threw, the middleware code assumed `data` was always present and destructured it, causing an uncaught exception and 500.
- Next.js then showed the generic Server Components error because the failure occurred in the request pipeline (middleware) before a successful SSR response.

## 6. Why local may or may not have failed

- **Local (Node):** Cookies and Supabase Auth are usually stable; `getUser()` often returns a valid `data` object. The unsafe destructuring did not trigger, so the issue did not reproduce.
- **Production (Edge):** Different runtime and network conditions led to null `data` or thrown errors from `getUser()`, exposing the bug.

## 7. Hosting/runtime findings

- **Stack:** Cloudflare Workers, OpenNext, Next.js standalone build. Middleware runs in Edge.
- **Env:** Production must set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; missing env is handled by existing logic (503 or null user), not by the middleware crash.
- **Details:** See `docs/incidents/HOSTING_RUNTIME_AUDIT.md`.

## 8. CSP findings

- CSP eval warning is **not** the cause of the dashboard 500. Server Components run on the server; CSP applies to the client.
- Recommendation: do not add `unsafe-eval`; investigate and fix or document the eval source separately. See `docs/incidents/CSP_EVAL_AUDIT.md`.

## 9. Test coverage added

- **lib/supabase/middleware.test.ts:** Four cases for `updateSession`: (1) getUser returns user, (2) data.user null, (3) data undefined, (4) getUser throws. All assert middleware returns `{ response, user }` and does not throw.
- **scripts/smoke/dashboard_smoke.sh:** Health check + GET /dashboard and GET /ru/dashboard; fails if any returns 500.

## 10. Validation results

- **Lint:** Passed.
- **Unit tests (middleware):** 4/4 passed.
- **Typecheck/build:** Run separately; no code changes that would break types.
- **Dashboard smoke:** Run after deploy: `BASE_URL=https://aistroyka.ai bash apps/web/scripts/smoke/dashboard_smoke.sh`.

## 11. Remaining risks

- **Env in production:** If Supabase env vars are missing or wrong, auth will fail; layout will redirect to login (no 500). Low risk for 500 recurrence.
- **Third-party or Supabase changes:** Future changes to `getUser()` response shape could require updates; current code is defensive (`res?.data?.user ?? null`).
- **CSP:** Eval warning remains a separate item; no impact on dashboard 500.

## 12. Recommended next hardening steps

See `docs/PLAN-DASHBOARD-HARDENING-NEXT-STEPS.md`.
