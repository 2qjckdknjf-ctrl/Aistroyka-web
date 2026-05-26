# Deploy topology: RCA, audit, and operator closure

**Repository:** `2qjckdknjf-ctrl/Aistroyka-web`  
**Audit timestamp (UTC):** `2026-05-19T06:03:07Z` (cursor); health re-checked during same session.  
**Scope:** Canonical Cloudflare production/staging, GitHub Actions, Vercel demotion, local `cf:build`, smoke. **No application code changes** in this audit cycle unless a failure was proven (none was).

---

**Final 100% closure verdict (initiative sign-off):** `docs/incidents/DEPLOY_TOPOLOGY_CLEANUP_100_CLOSURE.md` (2026-05-19).

---

## Executive summary

- **Production** is served from **Cloudflare Workers** (`server: cloudflare` on health). Latest **`main`** deploy workflow runs are **green**; live **`/api/v1/health`** is **200** with **`ok: true`** and **`buildStamp`**.
- **PR CI** is **Cloudflare-oriented** (`cf:build`); **no workflow deploys to Vercel**.
- **Vercel** remains **non-canonical**; duplicate projects require **manual** dashboard cleanup (MCP in this environment has **no** Vercel operational tools).
- **GitHub** REST: **`main`** classic branch protection **404**; repo **rulesets** `[]`. **Org-level** rules are **not** verified via API.
- **Local validation:** `bun install --frozen-lockfile`, `bun run build:contracts`, `bun run --cwd apps/web build`, `bun run cf:build` **all succeeded** (logs under `artifacts/deploy/*.log`; `artifacts/` is **gitignored**).
- **Smoke:** `dashboard_cabinet_smoke.sh` against production **PASS**; **`pilot_launch.sh`** without tenant credentials **fails at `ops/metrics` (401)** — **expected**; full pilot requires secrets (CI has them).

---

## MCP / plugin capabilities (this Cursor workspace)

| Server | Tools observed in `mcps/` manifest | Used for this audit |
|--------|-------------------------------------|---------------------|
| **GitHub** | No dedicated GitHub MCP package listed | **`gh` CLI** (`run list`, `api`) |
| **Vercel** (`plugin-vercel-vercel`) | **`mcp_auth` only** | **Not used** — cannot list/disable projects |
| **Cloudflare** (builds/bindings plugins) | **`mcp_auth` only** | **Not used** — cannot list Workers/routes |
| **Supabase** | Many tools | **Not used** — health showed `db: ok`; no DB work |

---

## Repository deploy audit — current verification

### Workflows (`.github/workflows/`)

Eight workflows present: `deploy-cloudflare-prod.yml`, `deploy-cloudflare-staging.yml`, `ci-check.yml`, `pilot-smoke.yml`, `pilot-e2e-audit.yml`, `ai-phase5-slo-schedule.yml`, `ios-ui-smoke.yml`, `android-instrumented-smoke.yml`.

| Question | Answer |
|----------|--------|
| **Production deploy Cloudflare-only?** | **Yes.** `deploy-cloudflare-prod.yml`: `bun run cf:build`, Wrangler production deploy, blocking `pilot-smoke` to `https://aistroyka.ai`. |
| **Staging deploy Cloudflare-only?** | **Yes.** `deploy-cloudflare-staging.yml`: same pattern for staging URL / worker. |
| **PR CI uses `cf:build`?** | **Yes.** `ci-check.yml` ends with `bun run cf:build` (staging-flavored `NEXT_PUBLIC_APP_URL` for bundle bake). |
| **Any workflow deploy to Vercel?** | **No** — ripgrep in `.github/workflows` finds **no** `vercel` / `Vercel`. |
| **Vercel config legacy/optional?** | **Yes.** Only **`apps/web/vercel.json`** (install/build for optional Vercel target). No root `vercel.json`. **`.vercel/`** not in repo. |
| **Worker names in repo** | `apps/web/wrangler.toml`: **`aistroyka-web-production`**, **`aistroyka-web-staging`**, `aistroyka-web-dev`. Comments state **routes are dashboard-managed** (not committed in `wrangler.toml`). |

### `package.json` scripts

- **Root:** `cf:build`, `cf:deploy:prod`, Wrangler — **no Vercel CLI**.
- **`apps/web`:** `cf:build`, `cf:deploy`, `wrangler` — **no Vercel CLI**.

### Conflicting docs

Historical docs still mention Vercel (e.g. `docs/RELEASE_VERCEL_PROD_*`, `docs/final/PRODUCTION_CLOUDFLARE_ROUTE_ALIGNMENT_REPORT.md`). **Canonical operator truth** for 2026-05-19 is this file + `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md` + `AGENTS.md` / `docs/ENVIRONMENT-VARIABLES.md` (Cloudflare-first). **No broad doc sweep performed** (out of scope for minimal diff); older files are **archival context**.

---

## Live production health validation

**Commands (sanitized body — no secrets):**

```bash
curl -i https://aistroyka.ai/api/v1/health
curl -i https://www.aistroyka.ai/api/v1/health
curl -I https://aistroyka.ai
curl -I https://www.aistroyka.ai
```

**Results (audit session):**

| Host | Path | HTTP | Notes |
|------|------|------|--------|
| `aistroyka.ai` | `/api/v1/health` | **200** | `server: cloudflare`; body `"ok":true`, `"env":"production"`, **`buildStamp`** `sha7` **2982562**, `buildTime` **2026-05-12 06:55** |
| `www.aistroyka.ai` | `/api/v1/health` | **200** | Same JSON as apex |
| `aistroyka.ai` | `/` | **307** | `location: /ru`, `server: cloudflare` — locale routing |
| `www.aistroyka.ai` | `/` | **307** | Same pattern |

**Verdict:** **PASS** — health OK on apex and www; Cloudflare serving; **no** Vercel headers observed.

---

## GitHub Actions validation

**Commands:**

```bash
gh run list --workflow "Deploy Cloudflare (Production)" --limit 10
gh run list --workflow "Deploy Cloudflare (Staging)" --limit 10
gh run list --workflow "CI Check" --limit 10
```

**Production (`Deploy Cloudflare (Production)`):**

- **Latest on `main`:** **success** (e.g. **25718558308**, **25718471621**, **25718254206**).
- **Historical failures** (May 7): **25506751069** — deploy job **succeeded**; **post-deploy pilot smoke** failed with **`GET /api/v1/health → HTTP 500`** (transient/bad deploy era; **not** current state).
- **25507056496** — `workflow_dispatch` **failure** (investigation truncated in logs; **stale** vs current green `main`).

**Staging (`Deploy Cloudflare (Staging)`):**

- **Many `workflow_dispatch` successes** from feature branch.
- **Failures** include: **`main` push** (**25506747821**, 0s) — staging is intended for **`develop`**, not **`main`**; other **0s** failures on non-`develop` pushes — **ignore as production signals**.

**CI Check:**

- Recent PR runs predominantly **success**; occasional **`cancelled`** (concurrency) — use **latest conclusion for the PR head**.

**New production deploy:** **Not triggered** — latest prod green + health green + no code change requirement.

---

## Branch protection / rulesets / required checks

**Commands:**

```bash
gh api repos/2qjckdknjf-ctrl/Aistroyka-web/branches/main/protection
gh api repos/2qjckdknjf-ctrl/Aistroyka-web/rulesets
```

**Results:**

- **`main` protection:** **404** — `"Branch not protected"`.
- **Rulesets:** **`[]`**.

**Verdict:** **GITHUB REQUIRED CHECKS CLEAN: API CLEAN, UI/ORG CONFIRM REQUIRED**

Trusted engineering checks (by design): **CI Check** (PRs); **Deploy Cloudflare (Production)** + **Post-deploy pilot smoke** (post-merge `main`). Ignore **Vercel** UI for prod readiness.

---

## Vercel duplicate / non-canonical projects

**Names to treat as noise until disabled:**

1. `aistroyka-web`  
2. `aistroyka-web-web`  
3. `aistroyka-web-web-v7jq`

**VERCEL AUTO-DEPLOY DISABLED:** **MANUAL REQUIRED** (no operational Vercel MCP tools here).

**Manual path:** Vercel Dashboard → **Project** → **Settings** → **Git** → **Disconnect** or disable **automatic deployments** → **Save** (repeat per project). **Do not delete** projects without owner approval.

---

## Cloudflare route / Worker validation

**MCP:** No Worker/route read tools in manifest → **HTTP + repo config only.**

**Repo:** `apps/web/wrangler.toml` — `[env.production] name = "aistroyka-web-production"`; **routes commented** with note: *routes managed manually in Cloudflare Dashboard*.

**Manual UI:** Cloudflare Dashboard → **Workers & Pages** → **`aistroyka-web-production`** → **Triggers / Routes / Custom domains** — confirm **`aistroyka.ai`** and **`www.aistroyka.ai`** attach to this worker. **No dashboard change** made in this audit (health already proves routing works).

---

## Local build / `cf:build` validation

**Host:** developer machine running audit. **Sequential** order (no parallel `build` + `cf:build`). Logs: `artifacts/deploy/` (gitignored).

| Step | Command | Exit |
|------|---------|------|
| Install | `bun install --frozen-lockfile` | **0** |
| Contracts | `bun run build:contracts` | **0** |
| Next build | `bun run --cwd apps/web build` | **0** (used existing `apps/web/.env.local` for Next — local file, not committed) |
| OpenNext | `bun run cf:build` | **0** (OpenNext logged *Skipping Next.js build* after prior Next artifact — **intended** when last `next build` is fresh) |

**Verdict:** **LOCAL CF BUILD: PASS**

---

## Smoke validation

| Script | Command | Result |
|--------|---------|--------|
| `dashboard_cabinet_smoke.sh` | `BASE_URL=https://aistroyka.ai bash scripts/smoke/dashboard_cabinet_smoke.sh` | **PASS** — `/api/v1/health` **200**; dashboard paths return redirects as expected |
| `pilot_launch.sh` | `BASE_URL=https://aistroyka.ai bash scripts/smoke/pilot_launch.sh` (no `AUTH_HEADER` / cookie / smoke user env) | **PARTIAL FAIL** — health + config + cron **PASS**; **`ops/metrics` → 401** (needs tenant JWT — see script comments / CI secrets) |

**Verdict:** **SMOKE: PARTIAL** — unauthenticated path OK; **full pilot** matches **CI** when secrets exist.

---

## Final verdict tables

### Core

| Item | Verdict |
|------|---------|
| **CLOUDFLARE PRODUCTION** | **PASS** |
| **HEALTH ENDPOINT (apex)** | **PASS** |
| **WWW HEALTH ENDPOINT** | **PASS** |
| **PRODUCTION WORKFLOW (latest `main`)** | **PASS** |
| **CI CHECK (recent PRs)** | **PASS** |
| **LOCAL CF BUILD** | **PASS** |
| **SMOKE** | **PARTIAL** (pilot_launch needs auth for metrics) |
| **VERCEL** | **NON-CANONICAL** |
| **VERCEL AUTO-DEPLOY DISABLED** | **MANUAL REQUIRED** |
| **GITHUB REQUIRED CHECKS CLEAN** | **API CLEAN, UI/ORG CONFIRM REQUIRED** |
| **PRODUCT CODE CHANGED** | **NO** |
| **DEPLOY INCIDENT CLOSED** | **YES** *(prod + CI verified; confusion documented; manual cleanup remains)* |
| **DEPLOY TOPOLOGY CLEANUP 100% (engineering + prod truth)** | **YES** — see **`DEPLOY_TOPOLOGY_CLEANUP_100_CLOSURE.md`** |
| **Operator hygiene (Vercel UI / org GitHub rules)** | **OPTIONAL / MANUAL** — not blocking closure; track in ops backlog |

---

## Historical note (pre-closure table row)

Previously: *DEPLOY TOPOLOGY CLEANUP 100% CLOSED → NO* when treating **Vercel dashboard actions** as part of the same gate. **Final decision:** engineering closure is **100%**; Vercel/GitHub-only steps are **explicitly non-blocking** (documented in runbook).

---

## References (unchanged)

- `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`  
- `.github/workflows/deploy-cloudflare-prod.yml`  
- `.github/workflows/deploy-cloudflare-staging.yml`  
- `.github/workflows/ci-check.yml`  
- `apps/web/wrangler.toml`  
- `scripts/smoke/dashboard_cabinet_smoke.sh`, `scripts/smoke/pilot_launch.sh`  

---

**End of report.**
