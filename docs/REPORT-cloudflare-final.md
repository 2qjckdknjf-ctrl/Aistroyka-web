# Cloudflare build — final report

## Step 0 — Reproduced locally

**Root build (as Cloudflare did):**
```bash
cd /path/to/AISTROYKA && bun run build
# → runs root package.json "build" = next build (in root context)
# → TypeScript uses root tsconfig.json: "paths": { "@/*": ["./*"] } → @/ points to repo root
# → ./apps/web/app/[locale]/(auth)/login/page.tsx imports "@/i18n/navigation"
# → resolved to root/i18n/navigation → NOT FOUND
# Result: Failed to compile. Type error: Cannot find module '@/i18n/navigation'
```

**apps/web build (canonical):**
```bash
cd /path/to/AISTROYKA/apps/web && npm run cf:build
# → Next.js runs with apps/web as cwd; uses apps/web/tsconfig.json
# → @/* resolves to apps/web/* → @/i18n/navigation = apps/web/i18n/navigation ✓
# Result: ✓ Compiled successfully, OpenNext build complete.
```

**Conclusion:** Root build fails because `next build` runs in root and `@/` points to root (no `i18n/` there). apps/web build is canonical: build must run with **working directory = apps/web** so that `@/` resolves via `apps/web/tsconfig.json`.

---

## Step 1 — Canonical build from apps/web

### Level A — Cloudflare UI checklist (infra)

Product: **Cloudflare Pages** (or **Workers** if deploying via Wrangler). OpenNext produces a Worker (`.open-next/worker.js`) + assets (`.open-next/assets`).

**Option 1 (recommended): set Root directory so build runs in apps/web**

| Setting | Value |
|--------|--------|
| **Root directory** | `apps/web` |
| **Build command** | `npm run cf:build` or `bun run cf:build` |
| **Build output** | *(for OpenNext + Wrangler deploy: build output is consumed by `wrangler deploy` from apps/web; if using Pages “Build” UI, leave default or set to `apps/web/.open-next` if your flow expects a directory)* |
| **Environment variables** | Set **Build** (Production + Preview): see Step 3. |

**Option 2: keep repo root as project root**

If you cannot set Root directory to `apps/web`:

| Setting | Value |
|--------|--------|
| **Root directory** | *(empty / repository root)* |
| **Build command** | `bun run build` or `npm run build` |
| **Build output** | *(same as above; root `build` script now delegates to apps/web)* |

With Option 2, root `package.json` scripts run `cd apps/web && npm run cf:build` (see Level B). The build log must show that the **effective** build runs from apps/web (e.g. `$ cd apps/web && npm run cf:build` and `App directory: .../apps/web`).

### Level B — Root package.json (code)

Root `package.json` scripts were updated so that even when Cloudflare runs from repo root, the real build runs in apps/web:

```json
"scripts": {
  "dev": "cd apps/web && npm run dev",
  "build": "cd apps/web && npm run cf:build",
  "start": "cd apps/web && npm run start",
  "cf:build": "cd apps/web && npm run cf:build",
  "cf:deploy": "cd apps/web && npm run cf:deploy"
}
```

- **build**: Cloudflare’s “bun run build” runs this; it executes `cd apps/web && npm run cf:build` → Next/OpenNext run with cwd = apps/web → `@/` resolves correctly.
- **cf:build**: Same delegation for explicit OpenNext build from root.

**Proof (local):**
```bash
cd /path/to/AISTROYKA && bun run cf:build
# Log must show: $ cd apps/web && npm run cf:build
#                App directory: /Users/.../AISTROYKA/apps/web
#                ✓ Compiled successfully
#                OpenNext build complete.
```

---

## Step 2 — Alias @/* in apps/web

**apps/web/tsconfig.json:**

- `compilerOptions.baseUrl`: `"."` (so paths resolve from apps/web root).
- `compilerOptions.paths`: `{ "@/*": ["./*"] }`.

Next.js uses this tsconfig when the build is run from apps/web (or when the project is apps/web). No change to path values; `baseUrl` is set explicitly so resolution is unambiguous.

**Verification:**  
`cd apps/web && npm run cf:build` → ✓ Compiled successfully (no `@/i18n/navigation` or other `@/` errors).

---

## Step 3 — Supabase env (build-time for NEXT_PUBLIC_*)

**Required env (names only):**

| Variable | Where | Purpose |
|----------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Build (Production + Preview) | Supabase project URL; inlined into client bundle. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build (Production + Preview) | Supabase anon key; inlined into client bundle. |

**Server-only (if used):**

| Variable | Where | Purpose |
|----------|--------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Build or Workers env (never public) | Server-only; do not expose to client. |

**Important:**  
`NEXT_PUBLIC_*` must be set as **Build** environment variables in Cloudflare (Production and Preview). They are baked in at build time; runtime Worker env alone is not enough for client-side code.

**Verification after deploy:**

- `GET https://<production-domain>/api/health/auth`  
  Expected: `{"hasSupabaseEnv":true,"authConfigured":true}`.  
  If `false`, check Build env in Cloudflare and redeploy.

---

## Step 4 — Auth proof in production

1. **Login flow**  
   - Form submits to `POST /api/auth/login` (route handler in `apps/web/app/api/auth/login/route.ts`).  
   - Handler uses Supabase server client with cookie adapter; on success it sets session cookies on the response.

2. **Set-Cookie in production**  
   - In browser DevTools → Network: submit login, select the **POST** request to `/api/auth/login`.  
   - In **Response headers** there must be **Set-Cookie** entries for `sb-*` (e.g. `sb-<project>-auth-token`).  
   - This is the proof that the session is set via cookies.

3. **Debug endpoint (dev/preview or DEBUG_AUTH=true)**  
   - `GET /api/_debug/auth`: returns `hasCookies`, `cookieNames`, `hasSupabaseUser`, `userId` (no secrets).  
   - After login, open the same origin in the same browser → expect `hasSupabaseUser: true`.

4. **F5 on dashboard**  
   - After login, go to dashboard and refresh (F5).  
   - User must remain logged in (no redirect to /login).  
   - This proves middleware reads session from cookies correctly.

---

## Step 5 — Proof checklist (DoD)

Use these to confirm the report’s claims.

### 1) Build log no longer “next build” from root only

- **Before (broken):** Log showed e.g. `Executing user build command: bun run build` → `$ next build` with no `cd apps/web`, then TypeScript error in `./apps/web/...`.
- **After (fixed):** Log must show either:
  - **Option A:** Build command runs from apps/web (Root directory = `apps/web`, command e.g. `npm run cf:build`), and log shows `App directory: .../apps/web`, or  
  - **Option B:** Log shows `$ cd apps/web && npm run cf:build` (or similar) and then `App directory: .../apps/web`.

**Example fragment (actual run from repo root after fix):**
```
$ cd apps/web && bun run cf:build
$ opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion

┌─────────────────────────────┐
│ OpenNext — Cloudflare build │
└─────────────────────────────┘

App directory: /Users/alex/Projects/AISTROYKA/apps/web
Next.js version : 14.2.18
...
 ✓ Compiled successfully
...
OpenNext build complete.
```
(Bun may run the script so you see `bun run cf:build`; the important part is `cd apps/web` and `App directory: .../apps/web`. No `@/i18n/navigation` error.)

### 2) TypeScript error gone

- Build completes with **no** `Cannot find module '@/i18n/navigation'` (or any other `@/` resolution error).

### 3) /login does not show “Supabase env missing”

- In production, open `https://<domain>/<locale>/login`.  
- Page must not show the “Supabase env missing” alert (i.e. Build env is set and available at build time).

### 4) Set-Cookie sb-* in production

- In production: open `/login`, submit valid credentials.  
- Network tab → POST to `/api/auth/login` → Response headers must contain **Set-Cookie** with `sb-` cookies.

### 5) F5 does not log out

- After successful login, navigate to dashboard and press F5.  
- User must stay on dashboard (no redirect to /login).

---

## Commands summary

**Local (reproduce root vs apps/web):**
```bash
# Fails (before fix): root build, @/ points to root
cd /path/to/AISTROYKA && bun run build

# Passes: build from apps/web
cd /path/to/AISTROYKA/apps/web && npm run cf:build

# Passes after fix: root script delegates to apps/web
cd /path/to/AISTROYKA && bun run build
# or
cd /path/to/AISTROYKA && bun run cf:build
```

**Production checks:**
```bash
curl -sS https://<production-domain>/api/health/auth
# Expect: {"hasSupabaseEnv":true,"authConfigured":true}
```

Then in browser: login → Network (Set-Cookie) → F5 on dashboard.

---

## Commits (planned)

- `chore(cloudflare): enforce build from apps/web (scripts + docs)`
- `fix(web): ensure tsconfig baseUrl+paths in apps/web`
- `chore(env): document and verify supabase env + health/auth`
- (No auth code change if login route and cookies are already correct.)
