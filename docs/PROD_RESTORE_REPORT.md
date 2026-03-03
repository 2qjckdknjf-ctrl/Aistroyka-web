# Production restore report — aistroyka.ai

**Purpose:** Restore production website after deleting an extra worker in Cloudflare; ensure repo/deploy config is correct and the expected (enterprise) UI is served.

---

## Phase 0 — Snapshot (findings)

- **Repo:** Single monorepo; two Next.js apps exist:
  - **Root** `app/`, `components/`, `lib/` — simpler app (old dashboard: plain table, no locale, no design tokens).
  - **apps/web** — full app with `[locale]`, design tokens, Nav, Admin, projects, portfolio, team, billing; **this is the enterprise UI**.
- **Current commit (at report creation):** See "Final commit SHA" at end of this doc (updated after Phase 5).
- **Recent deploy-related commits:** Production deploy was switched to `apps/web` (feat(deploy): switch production build to apps/web). All workflow/wrangler changes since then target `apps/web`.
- **Wrangler configs:**
  - **apps/web/wrangler.toml** — used by CI (`working-directory: apps/web`, `--config wrangler.toml`). Defines `[env.production]` with `name = "aistroyka-web-production"`. Routes are commented out (managed in Dashboard).
  - **Root wrangler.toml** — not used by CI; routes commented out.
- **Open-next:** `apps/web/open-next.config.ts` (empty `defineCloudflareConfig({})`). Root has `open-next.config.ts`; CI only builds from apps/web.
- **Package scripts:** CI runs `npm run cf:build` and `npx wrangler deploy --env production --config wrangler.toml` from **apps/web** only.

---

## Phase 1 — Build verification

- **npm ci --legacy-peer-deps** and **npm run cf:build** were run in **apps/web**. Build succeeded.
- **.open-next/worker.js** and **.open-next/assets** (with `_next/`, BUILD_ID, _headers) are produced.
- **Routes that serve the enterprise UI (apps/web):**
  - `/dashboard` → redirect to `/en/dashboard` (middleware + `app/dashboard/page.tsx`).
  - **Real dashboard UI:** `app/[locale]/(dashboard)/dashboard/page.tsx` (e.g. `/en/dashboard`, `/ru/dashboard`).
  - Other authenticated routes: `/projects`, `/admin`, `/portfolio`, `/team`, `/billing` under `app/[locale]/(dashboard)/`.
  - **No** top-level `/reports` or `/ai-assistant` in repo; AI/observability is under **/admin/ai** (e.g. `/en/admin/ai`).
- **"Old simple dashboard":** Rendered by **root** `app/(dashboard)/dashboard/page.tsx` (plain "Dashboard" heading, table of projects). **Root app is not built or deployed by CI.** If production ever showed that UI, it was because a different worker (built from root or an old artifact) was attached to the domain; that worker may have been the one deleted.

---

## Phase 2 — Single source of truth

- **Deployment source of truth:** **apps/web only.** CI has `defaults.run.working-directory: apps/web`; all build and deploy steps run there. Root Next app is **not** built or deployed; it is legacy/unused for production.
- No code change was required to "wire" the enterprise UI — it is already the only app deployed. Ensuring Cloudflare routes point to **aistroyka-web-production** (the worker built from apps/web) is sufficient.

---

## Phase 3 — CI/CD hardening (done in repo)

- **Working directory:** `apps/web` for build, install, and deploy.
- **Cache:** `cache-dependency-path: apps/web/package-lock.json` (lockfile in apps/web).
- **Bun:** Installed in workflow (opennext may use it); no change.
- **Wrangler deploy:** `npx wrangler deploy --env production --config wrangler.toml`; `wrangler.toml` has `[env.production]` with `name = "aistroyka-web-production"`.
- **New step:** "Verify build output and app source" after cf:build:
  - Prints build directory (`pwd`).
  - Asserts `.open-next/worker.js` and `.open-next/assets` exist.
  - Asserts `app/[locale]/(dashboard)/dashboard/page.tsx` and `app/[locale]/(dashboard)/layout.tsx` exist (confirms enterprise app source).
  - (Prod only) Prints worker name from wrangler and confirms it equals `aistroyka-web-production`.

---

## Phase 4 — Cloudflare Dashboard: exact steps

**You must perform these in the Cloudflare dashboard** (repo cannot change them).

### 4.1 Ensure routes point to aistroyka-web-production

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) and select the account that owns aistroyka.ai.
2. Go to **Workers & Pages**.
3. Open the **aistroyka-web-production** worker (the one deployed by CI from apps/web).
4. Go to **Settings** → **Triggers** (or **Routes** / **Custom Domains**, depending on UI).
5. **Add/ensure the following routes** (if missing):
   - **Route 1:** `aistroyka.ai/*` → Worker: **aistroyka-web-production**.
   - **Route 2:** `www.aistroyka.ai/*` → Worker: **aistroyka-web-production**.
   - Optionally (if you want apex): `aistroyka.ai` (no path) → **aistroyka-web-production**.
6. **Remove any routes** that point to a **deleted** worker or to a different worker (e.g. an old "aistroyka-web" or root-built worker). If a route still points to a deleted worker, the domain will fail or show errors.
7. Save changes.

### 4.2 Remove routes pointing to deleted workers

1. In **Workers & Pages** → **Overview** or **Triggers**, list all routes for the zone aistroyka.ai.
2. For each route that references a worker that **no longer exists** (the one you deleted), **delete that route**.
3. Re-add the route with Worker = **aistroyka-web-production** (see 4.1).

### 4.3 DNS (proxied)

1. Go to **Websites** → **aistroyka.ai** → **DNS** → **Records**.
2. **A** (or **AAAA**) for **@**: ensure **Proxy status** is **Proxied** (orange cloud).
3. **CNAME** for **www** to the target (e.g. aistroyka.ai or the Workers custom hostname): ensure **Proxied** (orange cloud).
4. Save. Propagation may take a few minutes.

### 4.4 Verification checklist (5 browser checks)

1. **workers.dev (if enabled):** Open the workers.dev URL shown in the "Deploy to Cloudflare" step in GitHub Actions. Log in if required; confirm the **enterprise** dashboard (Nav, design tokens, build stamp) loads. This confirms the worker build is correct.
2. **Domain (apex):** Open `https://aistroyka.ai`. You should be redirected to login or to a locale path (e.g. `/en/dashboard`). No 5xx or "worker unreachable".
3. **Login:** Open `https://aistroyka.ai/en/login` (or your locale). Login page should render; after login you should land on the **enterprise** dashboard (Nav, cards, build stamp in top-right).
4. **Dashboard:** Open `https://aistroyka.ai/en/dashboard` (or `/ru/dashboard`). You must see the **new** UI (AppLayout, Nav, design tokens, build stamp), not the old simple table-only dashboard.
5. **Assets:** Hard refresh (Cmd+Shift+R / Ctrl+Shift+R). Check that CSS and images load (no broken layout). Optional: open DevTools → Network, reload, and confirm no 404s for `_next/*` or critical assets.

If any check fails, re-verify routes (4.1–4.2) and DNS (4.3); then clear browser cache or try incognito.

---

## Phase 5 — Commit and push

- All fixes are in a **single commit** (CI verification step; no business logic changes).
- Branch: **main**.
- **Final commit SHA:** *(updated below after push)*

---

## Final commit SHA

*(Will be filled after Phase 5 push.)*
