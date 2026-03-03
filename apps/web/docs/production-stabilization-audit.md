# Production Stabilization Audit — AISTROYKA-WEB

**Date:** 2026-02-23  
**Mode:** Audit only (no changes applied)  
**Stack:** Next.js 14 + OpenNext Cloudflare + Supabase

---

## PHASE 1 — Wrangler & Cloudflare Config Audit

### 1) wrangler.toml (printed)

```toml
# Cloudflare Workers config for Next.js via @opennextjs/cloudflare
# Do not put secrets here; use dashboard or .dev.vars (local)

name = "aistroyka-web"
compatibility_date = "2024-12-30"
compatibility_flags = ["nodejs_compat", "global_fetch_strictly_public"]
main = ".open-next/worker.js"

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

[[services]]
binding = "WORKER_SELF_REFERENCE"
service = "aistroyka-web"
```

No `wrangler.jsonc` present; only `wrangler.toml` exists.

### 2) Validation

| Check | Status |
|-------|--------|
| **compatibility_date** | Present: `2024-12-30` (recent) |
| **name** | `aistroyka-web` (correct) |
| **main** | `.open-next/worker.js` (exists after cf:build) |
| **Dev-only flags** | None; flags are runtime/compat only |
| **Duplicate bindings** | None; single `[assets]`, single `[[services]]` |

### 3) whoami & deployments

- **Account:** Z6pxn548dk@privaterelay.appleid.com's Account  
- **Account ID:** 864f04d729c24f574a228558b40d7b82  
- **Latest deployment:** 2026-02-23T15:44:45.110Z, Version `2f623a3e-ae39-432a-92d8-e8cc9448fee3`  
- **Environment:** Cloudflare Workers (single worker, no env aliases in config)

**Summary:** Worker name **aistroyka-web**; active deployment from latest upload; environment = default Workers.

---

## PHASE 2 — ENV & Secrets Validation

### 4) Cloudflare variables

- **wrangler secret list:** `[]` (no secrets stored via wrangler CLI).
- Non-secret variables are configured in Cloudflare Dashboard (Workers → aistroyka-web → Settings → Variables). Values are not readable via CLI for security.

### 5) Required variables (code & docs)

| Variable | Required | Where used |
|----------|----------|------------|
| **NEXT_PUBLIC_SUPABASE_URL** | Yes | `lib/env.ts`, `getPublicEnv()`, all Supabase clients |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | Yes | Same as above |
| **NEXT_PUBLIC_APP_URL** | Optional (defaults in code) | `lib/app-url.ts`; used for canonical app URL |

`.env.example` and `.dev.vars.example` document these. For production, set **NEXT_PUBLIC_SUPABASE_URL** and **NEXT_PUBLIC_SUPABASE_ANON_KEY** in Cloudflare Workers → Settings → Variables (or Secrets if desired). **NEXT_PUBLIC_APP_URL** is optional.

### 6) Service role / secret keys

- **rg "SERVICE_ROLE" .** → No matches.
- **rg "SUPABASE_SERVICE" .** → No matches.

**Conclusion:** No service role or Supabase service key referenced in repo; client bundle only uses anon key via public env. Safe.

---

## PHASE 3 — Supabase SSR & Cookies Validation

### 7) Cookie adapters

- **createServerClient:**  
  - `lib/supabase/server.ts` (import + `return createServerClient(...)`)  
  - `lib/supabase/middleware.ts` (import + `createServerClient(...)`)
- **createMiddlewareClient:** No occurrences (middleware uses `createServerClient` only).
- **setAll(:**  
  - `lib/supabase/server.ts:19` → `setAll(cookiesToSet: CookieToSet[])`  
  - `lib/supabase/middleware.ts:22` → `setAll(cookiesToSet: CookieToSet[])`

### 8) Types & structure

- **Implicit any:** None; both adapter files use `CookieToSet` and `setAll(cookiesToSet: CookieToSet[])`.
- **Duplicated server files:** No `server 2.ts` or similar in repo; single `lib/supabase/server.ts` and `lib/supabase/middleware.ts`.
- **Nested supabase folders:** One `lib/supabase/` with `server.ts`, `middleware.ts`, `client.ts`, `rpc.ts`. No nested `supabase/supabase/` or duplicate trees.

### 9) cf:build

- **bun run cf:build:** Completed successfully. Next.js build + OpenNext bundle; worker at `.open-next/worker.js`.

---

## PHASE 4 — Edge Runtime Safety Check

### 10) Node-only API usage

- **fs.** → No matches in app/lib source.
- **path.** → No imports of Node `path`; one use of variable name `path` in `app/api/projects/[id]/upload/route.ts` (storage path string), not the Node module.
- **crypto.** → One use: `crypto.randomUUID()` in upload route. This is the Web Crypto API (available in Workers). No Node `crypto` module usage.
- **process.** → Used only as `process.env.*` in `lib/env.ts`, `lib/app-url.ts`, `middleware.ts`. In Workers, env is injected; no Node-specific `process` APIs used.

### 11) Edge compatibility

- No `require("fs")`, `require("path")`, or `import from "fs"|"path"` in app/lib.
- API routes and middleware use only env, Web Crypto, and Supabase/fetch. No incompatible Node APIs detected in edge runtime paths.

---

## PHASE 5 — Production Performance Check

### 12) Dependencies (package.json)

**Production deps:**  
`@opennextjs/cloudflare`, `@supabase/ssr`, `@supabase/supabase-js`, `next`, `react`, `react-dom`

**Dev deps:**  
`@types/*`, `autoprefixer`, `eslint`, `eslint-config-next`, `postcss`, `tailwindcss`, `typescript`, `wrangler`

- No obvious unused heavy libs in the small dependency set.
- Bundle size from last build: First Load JS shared ~87.2 kB; middleware ~74.1 kB. Reasonable for the stack.

### 13) console.log in production paths

- **rg "console\\.log" .** in `*.ts` / `*.tsx`: **No matches** in app or lib. Clean.

---

## PHASE 6 — Final Report

### 1) Wrangler status

- Config: Valid; single worker, correct name, main, assets, and self-reference binding.
- compatibility_date set; no dev-only flags; no duplicate bindings.
- **Risk:** None identified.

### 2) Deployment status

- Latest deployment active (Version ID 2f623a3e).
- Worker: **aistroyka-web**; URL: https://aistroyka-web.z6pxn548dk.workers.dev (from prior deploy output).
- **Risk:** None.

### 3) Supabase integration status

- SSR adapters in `lib/supabase/server.ts` and `lib/supabase/middleware.ts`; both typed; no implicit any.
- No duplicate or nested supabase server files.
- Only anon key used; no service role in repo.
- **Risk:** None. Ensure Cloudflare vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are set in production.

### 4) Edge compatibility status

- No Node-only APIs (fs, path, Node crypto) in edge-reachable code.
- Only `process.env`, Web Crypto, and standard APIs used.
- **Risk:** None.

### 5) Security risks

- **Low:** NEXT_PUBLIC_APP_URL not in `getPublicEnv()`; if set in dashboard it is still read via `process.env` in `app-url.ts`. No exposure of service role or secrets in code.
- **Action:** Keep Supabase service role and any API secrets only in backend/dashboard; never in NEXT_PUBLIC_* or client bundle.

### 6) Performance risks

- **Low:** No console.log in app/lib; dependency set small.
- **Optional:** Consider upgrading Next.js when moving off unsupported 14.x (per Next.js support policy) and updating compatibility_date in wrangler.toml periodically.

### 7) Immediate recommended actions (max 5)

1. **Confirm production env vars** in Cloudflare Dashboard for **aistroyka-web**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; optionally `NEXT_PUBLIC_APP_URL`.
2. **Optionally set `workers_dev`** in `wrangler.toml` explicitly (e.g. `workers_dev = true`) to match current behavior and avoid dashboard drift.
3. **Consider removing or repurposing** `lib/supabase-server.ts` if unused (no imports found); reduces confusion and dead code.
4. **Plan Next.js upgrade** when ready (e.g. to a supported 14.x patch or 15.x) to address support/security notice; no change required for this audit.
5. **Keep using `bun run cf:build && bun run cf:deploy`** for local build and deploy; no further stabilization changes required for current pipeline.

---

*End of audit. No changes were applied.*
