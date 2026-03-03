# Cloudflare build pipeline — final report

## Root cause

**Observed in Cloudflare build log (twice):**
```
Executing user build command: bun run build
$ next build
...
Type error: Cannot find module '@/i18n/navigation' from ./apps/web/...
```

**What this means:**
- Cloudflare runs the build **from the repository root**.
- The command that actually runs is **`next build`** (not a script that changes directory).
- So either:
  1. **Build command in Cloudflare UI is set to `next build`** (or similar). Then the runner executes `next build` in the root; root has its own `tsconfig.json` with `"@/*": ["./*"]` → `@/` points to **repo root**. There is no `i18n/navigation` at root (it lives in `apps/web/i18n/navigation.ts`), so TypeScript fails.
  2. Or the root `package.json` is not used (e.g. Build command overrides it).

**Canonical build:** Must run **from `apps/web`** so that Next.js uses `apps/web/tsconfig.json` and `@/*` resolves to `apps/web/*`. The app and OpenNext config live in `apps/web`; root is only the monorepo root.

---

## Architectural fix: root tsconfig (so root build can resolve @/)

So that **even when** Cloudflare runs `next build` from repo root (and that build compiles or type-checks files under `apps/web`), the alias `@/` resolves correctly:

**Root `tsconfig.json` was changed:**

- **`compilerOptions.baseUrl`**: `"."`
- **`compilerOptions.paths`**: `{ "@/*": ["apps/web/*"] }`  
  → So `@/i18n/navigation` resolves to `apps/web/i18n/navigation.ts`, and any `@/...` in apps/web code resolves under `apps/web/`.
- **`exclude`**: `node_modules`, `apps/web/audit_*`, `audit_*`, `ios`, `engine`, `archive_*`, `docs`, `reports`, `scripts`, `TestLogs`, `.cursor`  
  → So the root build does not type-check or include unrelated trees (audit artifacts, ios, etc.).

**Why this fixes the error:**  
If the runner executes `next build` in the repo root and the build touches files under `apps/web` (e.g. because the app dir points at apps/web or the project includes those files), TypeScript uses the root `tsconfig.json`. With `@/*` → `apps/web/*`, imports like `@/i18n/navigation` resolve to `apps/web/i18n/navigation.ts`, so the `Cannot find module '@/i18n/navigation'` error goes away.

**What we did not do:**  
We did **not** replace root `app` / `middleware` / `i18n` with symlinks to `apps/web` to “run next build from root but build apps/web”. That led to two copies of Next/React (root vs apps/web `node_modules`) and type/runtime conflicts. The safe approach is: (1) root tsconfig above, and (2) Cloudflare must run **`bun run build`** (so the root script `cd apps/web && npm run cf:build` runs) or use **Root directory = apps/web** and **Build command = `npm run cf:build`**.

---

## Step 0 — Current Cloudflare platform and config (from repo)

| Item | Location | Purpose |
|------|----------|--------|
| **Deploy** | Workers (OpenNext) | `@opennextjs/cloudflare` builds Next.js for Cloudflare Workers. |
| **Root wrangler.toml** | `/wrangler.toml` | Production/staging Worker; `main = ".open-next/worker.js"`, `directory = ".open-next/assets"`. |
| **App wrangler.toml** | `apps/web/wrangler.toml` | Same layout; used when deploying from `apps/web`. |
| **OpenNext config** | `apps/web/open-next.config.ts` | `defineCloudflareConfig({})`. |
| **Build output** | `apps/web/.open-next/` | After `npm run cf:build` in apps/web: `worker.js` + `assets/`. |
| **Current Cloudflare build (observed)** | UI runs `bun run build` | That triggers **root** package.json; if UI instead had "Build command: next build", then **root** would run `next build` and fail (no `cd apps/web`). |

**Conclusion:** So that the log never again shows `$ next build` from root, **Build command in Cloudflare must NOT be `next build`**. It must be **`bun run build`** or **`npm run build`** so that the **root** `package.json` runs and its `build` script does `cd apps/web && npm run cf:build`.

---

## Step 1 — Root build proxy (safe for Cloudflare)

In **root** `package.json` the following is set:

```json
"scripts": {
  "dev": "cd apps/web && npm run dev",
  "build": "cd apps/web && npm run cf:build",
  "start": "cd apps/web && npm run start",
  "cf:build": "cd apps/web && npm run cf:build",
  "cf:deploy": "cd apps/web && npm run cf:deploy",
  "lint": "cd apps/web && npm run lint"
}
```

- **`build`**: Runs OpenNext build in apps/web. When Cloudflare runs **`bun run build`** (or **`npm run build`**), this script runs → `cd apps/web && npm run cf:build` → build runs in apps/web → `@/` resolves correctly, no `@/i18n/navigation` error.
- **`cf:build`**: Same, for explicit OpenNext build from root.
- **`lint`**: Proxied to apps/web so any lint step from root also runs in the app directory.

**Critical:** If the Cloudflare UI "Build command" is set to **`next build`** (or **`npx next build`**), the root package.json is **never** used and you will still see `$ next build` and the TypeScript error. **You must set Build command to `bun run build` or `npm run build`.** After changing this, trigger a new deploy and confirm the log shows `cd apps/web` and `App directory: .../apps/web`.

---

## Step 2 — Build output for Cloudflare

- **`npm run cf:build`** in **apps/web** produces:
  - `apps/web/.open-next/worker.js`
  - `apps/web/.open-next/assets/`
- **Wrangler** (from apps/web): `wrangler.toml` has `main = ".open-next/worker.js"` and `directory = ".open-next/assets"`. So **deploy must be run from apps/web** (e.g. `cd apps/web && npm run cf:deploy` or root script `cf:deploy`).
- **Pages vs Workers:** This repo uses **Workers** (OpenNext + wrangler). There is no Pages “Build output directory” in the UI; the build is consumed by `wrangler deploy` (run from apps/web or via root `npm run cf:deploy`).

---

## Step 3 — Cloudflare UI (what to set)

**Option A — Repository root as project root (recommended if you keep current integration):**

| Setting | Value |
|--------|--------|
| **Root directory** | *(empty / repository root)* |
| **Build command** | **`bun run build`** or **`npm run build`** |
| **Do NOT use** | `next build`, `npx next build`, or any command that runs Next in root. |
| **Environment variables (Build)** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production + Preview). |

Then the log will show something like:
```text
$ cd apps/web && npm run cf:build
...
App directory: .../apps/web
 ✓ Compiled successfully
```

**Option B — App directory as project root:**

| Setting | Value |
|--------|--------|
| **Root directory** | **`apps/web`** |
| **Build command** | **`npm run cf:build`** (or `bun run cf:build`) |
| **Environment variables (Build)** | Same as above. |

Then the build runs directly in apps/web; no `cd` in the script.

---

## Step 4 — Alias resolution in apps/web

- **apps/web/tsconfig.json:**  
  - `compilerOptions.baseUrl`: `"."`  
  - `compilerOptions.paths`: `{ "@/*": ["./*"] }`  
  So `@/i18n/navigation` resolves to `apps/web/i18n/navigation.ts` when the build runs in apps/web.
- **File:** `apps/web/i18n/navigation.ts` exists and is used by login and other pages. No relative-import workaround; the fix is build context (root proxy + correct Cloudflare Build command).

**Local check:**
```bash
# From root (must run apps/web build)
bun run build
# or
npm run build

# From apps/web (canonical)
cd apps/web && npm run cf:build
```
Both must complete without `Cannot find module '@/i18n/navigation'`.

---

## Step 5 — Env and auth (after build is stable)

1. **Supabase env (build-time)**  
   In Cloudflare, set **Build** environment variables (Production + Preview):  
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.  
   Then after deploy, `/login` must **not** show “Supabase env missing”.

2. **Health**  
   `GET https://<production-domain>/api/health/auth` → expect `{"hasSupabaseEnv":true,"authConfigured":true}`.

3. **Auth**  
   - POST `/api/auth/login` (valid credentials) → response headers must include **Set-Cookie** with `sb-*` cookies.  
   - After login, F5 on dashboard → user must stay logged in (no redirect to /login).  
   - In dev/preview or with `DEBUG_AUTH=true`: `GET /api/_debug/auth` after login → `hasSupabaseUser: true`.

---

## Bun lockfile (frozen lockfile fix)

**Почему падало:** В CI (Cloudflare) команда `bun install --frozen-lockfile` падала с ошибкой *"lockfile had changes, but lockfile is frozen"*. Две причины: (1) lockfile был рассинхронизирован с `package.json`; (2) **Cloudflare использует Bun 1.2.15** — lockfile, сгенерированный под Bun 1.3.x, считается изменённым под 1.2.15 (разный формат/разрешение).

**Что обновили:** Lockfile перегенерирован под **Bun 1.2.15** (версия в среде Cloudflare). Локально: установить Bun 1.2.15 (например `BUN_INSTALL=/tmp/bun-1215 curl -fsSL https://bun.sh/install | bash -s "bun-v1.2.15"`), затем в **apps/web** выполнить `PATH="/tmp/bun-1215/bin:$PATH" bun install`. Обновлён только **apps/web/bun.lock**; версии в `package.json` не меняли.

**Как проверить локально (должен быть Bun 1.2.15):**
```bash
cd apps/web && bun install --frozen-lockfile
```
С Bun 1.2.15 команда должна завершиться без ошибок (exit 0). После push шаг install в Cloudflare также должен проходить.

---

## Step 6 — Proof and verification

### What the Cloudflare build log must show after the fix

**Must NOT appear:**
- `$ next build` as the only build step (with no `cd apps/web` before it).
- `Type error: Cannot find module '@/i18n/navigation'`.

**Must appear (example):**
```text
Executing user build command: bun run build
$ cd apps/web && npm run cf:build
$ opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion

┌─────────────────────────────┐
│ OpenNext — Cloudflare build │
└─────────────────────────────┘

App directory: /path/to/AISTROYKA/apps/web
Next.js version : 14.2.18
...
 ✓ Compiled successfully
...
OpenNext build complete.
```

(If you use **Option B** with Root directory = `apps/web`, the log will show `npm run cf:build` or `bun run cf:build` and `App directory: .../apps/web` without a preceding `cd apps/web`.)

### Local verification commands

```bash
# 1) Build from root (must proxy to apps/web and pass)
cd /path/to/AISTROYKA
bun run build
# or
npm run build

# 2) Build from apps/web (canonical)
cd /path/to/AISTROYKA/apps/web
npm run cf:build

# 3) After deploy: health
curl -sS https://<production-domain>/api/health/auth
# Expect: {"hasSupabaseEnv":true,"authConfigured":true}
```

### Definition of Done checklist

- [ ] Cloudflare build log shows **no** `bun run build` → `$ next build` from root only; it shows `cd apps/web` and/or build running in apps/web.
- [ ] TypeScript error `@/i18n/navigation` does **not** appear in Cloudflare build.
- [ ] After deploy, `/login` does **not** show “Supabase env missing”.
- [ ] Auth works: POST `/api/auth/login` returns Set-Cookie `sb-*`; F5 on dashboard does not log out.
- [ ] This report exists and is updated with any further findings.

---

## Summary of changes (for commits)

1. **fix(build): proxy root build to apps/web (critical)**  
   Root `package.json`: `build`, `cf:build`, `dev`, `start`, `cf:deploy`, `lint` all proxy to `apps/web`. Ensures `bun run build` from root runs OpenNext in apps/web.

2. **chore(cloudflare): document correct Pages/Workers settings**  
   This file: root cause, Build command must be `bun run build` (not `next build`), env list, Option A/B, proof checklist.

3. **fix(web): ensure apps/web tsconfig paths**  
   `apps/web/tsconfig.json`: `baseUrl: "."`, `paths: { "@/*": ["./*"] }` (already present; no change if already done).

4. **chore(auth): keep health/debug endpoints**  
   No code change if `/api/health/auth` and `/api/_debug/auth` already exist; only documented in this report.
