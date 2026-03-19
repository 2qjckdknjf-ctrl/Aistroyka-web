# Site Startup — Deep Technical Audit

**Date:** 2026-03-19  
**Scope:** Full forensic audit to find root causes of site not starting / instability / build or runtime failures.  
**Approach:** Senior Staff Engineer + SRE + Solution Architect; evidence-based; no assumptions.

---

## 1. Executive summary

- **What was broken (historical):** Production returned 500 on `/`, `/api/health`, `/api/v1/health` due to (1) **Dynamic require of middleware-manifest** in Cloudflare Workers (unpatched bundle) and (2) **Unsafe destructuring in auth middleware** when `getUser()` returned null or threw. Both are already fixed in codebase and deploy flow.
- **Observed browser messages (gt-provider-bridge, lockdown-install, CSP eval):** Classified as **noise** — not from app code; extensions/injected scripts. CSP eval warning does not cause 500 (see docs/incidents/CSP_EVAL_AUDIT.md).
- **Current state:** Build, typecheck, and lint pass. Local production start serves homepage 200, dashboard 307 (redirect to login). Health returns 503 when Supabase env is missing (expected). No first-party eval/Function; middleware and deploy patch are in place.
- **Fix applied in this audit:** Root layout `headers()` wrapped in try/catch so Edge/Workers cannot crash the entire tree if `headers()` throws (same pattern as dashboard layout).
- **Conclusion:** No new blocking root cause found. Existing fixes (middleware safety, bundle patch, env documentation) are present. Root layout hardening reduces residual risk. Site startup is stable provided: (1) deploy uses patched bundle and (2) production has `NEXT_PUBLIC_SUPABASE_ANON_KEY` set.

---

## 2. Symptoms

| Symptom | Source | Verdict |
|--------|--------|--------|
| "Site doesn't start" | User | May mean deploy failure, 500 on first load, or browser errors. |
| `gt-provider-bridge.js: Skipping ... injection: not an HTML document` | Browser | **Noise.** Third-party (e.g. wallet) extension; not app code. |
| `lockdown-install.js: SES Removing unpermitted intrinsics` | Browser | **Noise.** Extension (SES/lockdown); not app code. |
| CSP blocks use of 'eval' in JavaScript | Browser / CSP | **Secondary.** No first-party eval; likely Supabase or extension. Does not cause 500 (server renders; CSP is client). |
| Production 500 on /, /api/health (historical) | Incidents | **Addressed.** Root causes: middleware-manifest dynamic require + middleware auth destructuring; fixes in place. |

---

## 3. Environment and system map

| Item | Value |
|------|--------|
| Repo type | Monorepo (bun workspaces: apps/web, packages/contracts, packages/contracts-openapi) |
| Package manager | bun (lockfile bun.lock); npm used for contracts prebuild and CI install |
| Web app | apps/web (Next.js 15, App Router) |
| Deploy targets | Cloudflare Workers (OpenNext), optional Vercel |
| Build | Root: `npm run build` → build:contracts + build:web. apps/web: next build (output: standalone) |
| CF build | cf:build → Next standalone + fix scripts + opennextjs-cloudflare build + patches |
| Env | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL; server: SUPABASE_SERVICE_ROLE_KEY |
| Entrypoints | app/layout.tsx (root), app/[locale]/layout.tsx (next-intl), (public)/(dashboard)/(auth) layouts |
| Middleware | apps/web/middleware.ts (intl + updateSession + protected/auth prefixes + security headers) |
| Auth | Supabase SSR; middleware updateSession; dashboard/admin layouts use createClient + getSessionUser / requireAdmin |

**Integrations checked:** Next.js 15, React 19, next-intl, Supabase SSR, OpenNext Cloudflare, Wrangler, Tailwind, TypeScript, ESLint. No first-party eval/new Function; CSP in middleware and lib/security-headers (no unsafe-eval).

---

## 4. Reproduction

**Steps (local):**

1. From repo root: `bun install --frozen-lockfile` (or after rm -rf node_modules)
2. `npx tsc --noEmit -p apps/web/tsconfig.json` → **PASS**
3. `cd apps/web && npm run lint` → **PASS**
4. `npm run build` (root) → **PASS** (contracts + Next build, 280 static pages)
5. `cd apps/web && npm run start` → server listens
6. `curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000/en` → **200**
7. `curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000/en/dashboard` → **307** (redirect to login)
8. `curl -sS http://localhost:3000/api/v1/health` → **503** when Supabase env missing (body: missing_supabase_env); **200** when env set

**Dev:** `npm run dev` (root) — not required for production path; production build/start is the authority.

**Production (Cloudflare):** Deploy uses `wrangler deploy --dry-run --outdir .open-next/deploy` → `node scripts/patch-bundle-require.cjs` → `wrangler deploy --no-bundle --config wrangler.deploy.toml`. Production main = `.open-next/deploy/worker-bootstrap.js` (patched). CI verifies stub presence in bundle.

---

## 5. Root cause (historical and current)

**Primary (already fixed):**

1. **Dynamic require of middleware-manifest (Workers)**  
   - **Mechanism:** Next server code in Worker calls `require("...middleware-manifest.json")`. Wrangler’s injected `__require` throws on dynamic require → uncaught exception → 500.  
   - **Evidence:** docs/runtime-fix/00_RUNTIME_FIX_SUMMARY.md, docs/release/PROD_RUNTIME_INCIDENT_FINAL_REPORT.md.  
   - **Fix:** `scripts/patch-bundle-require.cjs` stubs `__require` for paths containing "middleware" and "manifest". Deploy uses patched bundle via wrangler.deploy.toml (main = .open-next/deploy/worker-bootstrap.js).

2. **Unsafe auth in middleware**  
   - **Mechanism:** `const { data } = await supabase.auth.getUser()` — when `data` was null or getUser threw (Edge/auth failure), destructuring threw → 500.  
   - **Evidence:** docs/REPORT-PROD-DASHBOARD-STABILIZATION.md.  
   - **Fix:** `lib/supabase/middleware.ts` uses `const res = await supabase.auth.getUser(); user = res?.data?.user ?? null` inside try/catch.

**Current audit — additional hardening:**

3. **Root layout `headers()` in Edge**  
   - **Risk:** In Edge/Workers, `headers()` can throw in some conditions (Next.js/Edge issues). Root layout runs on every request; uncaught throw → 500.  
   - **Evidence:** Dashboard layout already uses try/catch around `headers()` with comment "headers() can throw in Edge/Workers". Root layout did not.  
   - **Fix:** Root layout now wraps `await headers()` in try/catch and falls back to default locale `"ru"` on throw.

**Files touched by this audit:** `apps/web/app/layout.tsx` (headers try/catch).

---

## 6. Secondary issues

| Issue | Severity | Impact | Status |
|-------|----------|--------|--------|
| Health 503 when Supabase env missing | Expected | Not a bug; documented. Production must set ANON_KEY in Dashboard. | Documented |
| Admin layout `headers()` without try/catch | Low | Only called when !allowed before redirect; if it throws, 500 on admin gate. | Residual risk; optional future hardening |
| CSP eval warning (browser) | Low | Console only; not cause of 500. | docs/incidents/CSP_EVAL_AUDIT.md; no unsafe-eval added |
| Patch script pattern match | Medium | If Wrangler changes __require format, patch may skip and unpatched bundle deploys. | CI verifies stub; residual risk documented |

---

## 7. Rejected false leads

- **CSP as root cause of 500:** No. Server Components and API run on server; CSP applies to client. Dashboard 500 was traced to middleware auth (fixed). See docs/incidents/CSP_EVAL_AUDIT.md.
- **Browser extension messages (gt-provider-bridge, lockdown-install):** Not from app; not in repo. Ignored for root cause.
- **First-party eval:** Grep found no eval/new Function/string timers in app code; no change needed for CSP in app.

---

## 8. Documentation cross-check

- **Next.js:** App Router, headers(), middleware, Edge limitations — consistent with current usage; root layout defensive pattern aligns with dashboard layout.
- **Supabase SSR:** createServerClient in middleware, cookies getAll/setAll — used correctly; getUser() wrapped in try/catch.
- **OpenNext/Cloudflare:** Production deploy uses patched bundle and no rebundle (wrangler.deploy.toml); docs/runtime-fix and release reports followed.
- **CSP:** No unsafe-eval; script-src 'self' 'unsafe-inline' https://*.supabase.co — no relaxation for eval.

---

## 9. Fix (this audit)

**Single change:**

- **File:** `apps/web/app/layout.tsx`  
- **Change:** Wrap `await headers()` and locale derivation in try/catch. On throw, use default locale `"ru"`.  
- **Reason:** Same Edge/Workers safety as dashboard layout; avoids uncaught exception on any request that triggers headers() failure.  
- **Safety:** No security relaxation; no new dependencies; minimal and reversible.

---

## 10. Validation

| Check | Result |
|-------|--------|
| install (bun install --frozen-lockfile) | PASS |
| typecheck (tsc -p apps/web/tsconfig.json) | PASS |
| lint (next lint) | PASS |
| build (npm run build from root) | PASS |
| local prod start (npm run start, apps/web) | PASS |
| GET /en | 200 |
| GET /en/dashboard | 307 (redirect) |
| GET /api/v1/health (no env) | 503 + body (expected) |
| GET /api/health | Same as v1 when env missing |

---

## 11. Residual risks

- **Env in production:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set in Cloudflare Dashboard; otherwise health/auth return 503 or redirect.
- **Patch pattern drift:** If Wrangler changes bundle format, patch could skip; CI verification step would catch missing stub; recommend monitoring deploy step.
- **Admin layout headers():** Optional future change: wrap in try/catch and fallback to defaultLocale before redirect.

---

## 12. Final status

- **Current state:** Site starts; build and local production run pass; historical 500 causes are fixed; root layout hardened.
- **Ready for production:** Yes, provided deploy uses patched bundle and production Worker has required env (including ANON_KEY).
- **Next recommended actions:** (1) Ensure pilot smoke runs after deploy (already in workflow). (2) Optionally add try/catch for `headers()` in admin layout. (3) If CSP eval source is needed, identify script in staging (e.g. Supabase or extension) and document; do not add unsafe-eval without justification.
