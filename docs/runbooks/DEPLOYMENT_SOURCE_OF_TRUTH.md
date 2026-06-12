# Deployment source of truth (operators)

**Last updated:** 2026-05-19 (closure: `docs/incidents/DEPLOY_TOPOLOGY_CLEANUP_100_CLOSURE.md`)  
**Applies to:** AISTROYKA web (`apps/web`), GitHub repo **Aistroyka-web** (`git@github.com:2qjckdknjf-ctrl/Aistroyka-web.git`)

---

## Production source of truth (memorize)

| | |
|--|--|
| **Runtime** | **Cloudflare Workers** + OpenNext (`cf:build` + Wrangler) |
| **Deploy workflow** | `.github/workflows/deploy-cloudflare-prod.yml` — **Deploy Cloudflare (Production)** |
| **Post-deploy gate** | **Post-deploy pilot smoke** (blocking) against `https://aistroyka.ai` |
| **Fast prod check** | `curl -i https://aistroyka.ai/api/v1/health` |

**Staging source of truth:** `.github/workflows/deploy-cloudflare-staging.yml` → worker **`aistroyka-web-staging`** → `https://staging.aistroyka.ai`.

### Ignore for “is production ready?”

- **Vercel** deployment rows (Canceled / Queued / Building / Ready), especially on duplicate projects (`aistroyka-web`, `aistroyka-web-web`, `aistroyka-web-web-v7jq`)
- **Vercel preview** noise from docs/mobile/experiment branches
- Legacy assumptions that staging is `develop`-driven (current canonical trigger is `main`)

---

## Production — canonical path

| Layer | Source of truth |
|------|------------------|
| **Runtime** | **Cloudflare Workers** (OpenNext Cloudflare adapter) |
| **Build** | `bun run cf:build` (repo root) — see `apps/web/package.json` `cf:build` |
| **Deploy** | Wrangler production env — workflow `.github/workflows/deploy-cloudflare-prod.yml` |
| **Worker name (expected)** | `aistroyka-web-production` (per deploy workflow / `wrangler.toml` comments) |
| **Public URL** | https://aistroyka.ai (apex and `www` should both serve the app; validate with health below) |

**GitHub workflow (production):** **Deploy Cloudflare (Production)** — triggers on **successful completion of “Deploy Cloudflare (Staging)” on `main`** (`workflow_run`; the deploy job is gated by `workflow_run.conclusion == 'success'`) and on manual `workflow_dispatch` (optional `ref` input, default `main`). There is no direct push-to-main trigger.

**Blocking production gate after deploy:** **Post-deploy pilot smoke** (reusable workflow), targeting `https://aistroyka.ai`.

**Non-blocking:** **Post-deploy AI Phase 5 gate** (`continue-on-error: true`).

---

## Staging — canonical path

| Layer | Source of truth |
|------|------------------|
| **Deploy workflow** | `.github/workflows/deploy-cloudflare-staging.yml` — **Deploy Cloudflare (Staging)** |
| **Trigger** | Push to **`main`** and `workflow_dispatch` |
| **Public URL** | `https://staging.aistroyka.ai` |
| **Worker name (expected)** | `aistroyka-web-staging` |

---

## Pull requests — what must pass

| Workflow file | Display name (Actions) | Role |
|---------------|------------------------|------|
| `.github/workflows/ci-check.yml` | **CI Check** | **Required engineering gate for PRs:** install, `i18n:check`, lint, test, **`bun run cf:build`** (no deploy). **No Vercel.** |

**Note:** **Deploy Cloudflare (Production)** does **not** run on pull requests; it runs when code lands on `main`. Do not wait for that workflow on an open PR to validate the PR itself — use **CI Check** + review.

---

## Vercel — explicitly non-canonical

**Vercel is not the production runtime.** Duplicate or noisy projects (e.g. `aistroyka-web`, `aistroyka-web-web`, `aistroyka-web-web-v7jq`) may show **CANCELED**, **QUEUED**, **BUILDING**, **READY** in the Vercel UI — **that is not proof of Cloudflare production health or failure.**

Residual repo config: **`apps/web/vercel.json`** exists for optional / legacy Vercel builds; it does **not** define canonical production.

### Ignore for “is production OK?”

- Vercel deployment list state (especially canceled/queued rows on duplicate projects)
- Vercel “Production” labels unless you have explicitly chosen Vercel as a preview host
- Preview deployments from unrelated branches (docs, mobile, experiments)

### Manual cleanup (recommended)

For **each** duplicate Vercel project you no longer want driving noise:

1. **Vercel Dashboard** → select **Project**  
2. **Settings** → **Git**  
3. **Disconnect** Git integration **or** disable **automatic deployments** for the linked repo  
4. Save  

Do **not** delete projects unless the owner approves; **disconnect / disable** is enough to reduce confusion.

---

## Trusted validation commands

### Production health (primary smoke)

```bash
curl -i https://aistroyka.ai/api/v1/health
curl -i https://www.aistroyka.ai/api/v1/health
```

**Expect:**

- HTTP **200** (or a **single canonical redirect** to HTTPS then **200** — both hosts validated 200 JSON on 2026-05-19 audit)
- JSON: `"ok": true`
- Header **`server: cloudflare`**
- JSON **`buildStamp`** with `sha7` and `buildTime`

### Recent production deploys (GitHub Actions)

```bash
gh run list --workflow "Deploy Cloudflare (Production)" --limit 5
```

### Recent staging deploys

```bash
gh run list --workflow "Deploy Cloudflare (Staging)" --limit 5
```

### Recent PR CI

```bash
gh run list --workflow "CI Check" --limit 5
```

### Local OpenNext bundle (developer / release engineer)

Run **sequentially** (do **not** run `bun run build` / `next build` and `cf:build` in parallel — risk of corrupting `apps/web/.next`):

```bash
bun install --frozen-lockfile
bun run build:contracts
bun run --cwd apps/web build    # requires apps/web/.env.local or exported NEXT_PUBLIC_* at build time
bun run cf:build                # from repo root; OpenNext worker bundle
```

If builds behave oddly after experiments: `rm -rf apps/web/.next apps/web/.open-next` and rerun **in order**.

---

## Manual UI checks (when automating hit limits)

### GitHub — branch protection and required checks

1. Open the repository on GitHub: **https://github.com/2qjckdknjf-ctrl/Aistroyka-web**
2. **Settings → Branches**  
   - Inspect **Branch protection rules** for **`main`** (and any release branches).  
   - Under **Require status checks to pass**, **remove** any **Vercel**-origin contexts if production is Cloudflare-only (names vary: `Vercel`, `Vercel Preview`, project slug, etc.).  
   - **Keep** **`CI Check`** (and any org-mandated checks you intend).
3. **Settings → Rules → Rulesets**  
   - Inspect **Repository rulesets**; confirm none **require** Vercel-only statuses.
4. **Organization** (if applicable, org owners only)  
   - **Organization → Settings → Rules → Rulesets** (or org **Branch protection** policies) — same **Vercel** rule: do not require for merge if Cloudflare is canonical.

**API snapshot (non-admin token):** `GET /repos/.../branches/main/protection` may return **404** (“not protected”) and `GET /repos/.../rulesets` may return **`[]`** — that does **not** prove org-level rules are absent. **Always confirm in UI.**

### Vercel — reduce duplicate-project noise

**Path:** **Vercel Dashboard → Project → Settings → Git →** disconnect repo **or** disable automatic deployments → **Save**.

Repeat for: **`aistroyka-web`**, **`aistroyka-web-web`**, **`aistroyka-web-web-v7jq`** (prefer **disable** over **delete**).

### Cloudflare — manual route verification

**Repo note:** `apps/web/wrangler.toml` documents that **`[[env.production.routes]]` are commented** — **routes are managed in the Cloudflare Dashboard**, not committed as Wrangler routes.

**UI path:**

1. **Cloudflare Dashboard → Workers & Pages**
2. Select worker **`aistroyka-web-production`**
3. **Settings / Triggers / Routes / Custom domains** (exact labels vary in dashboard versions)
4. Confirm **`aistroyka.ai`** and **`www.aistroyka.ai`** (and `/*` patterns as appropriate) route to this Worker.

**Staging:** repeat for **`aistroyka-web-staging`** vs `https://staging.aistroyka.ai`.

**Do not** change routes in this pass unless **health** or **pilot smoke** proves mis-routing.

---

## Related documents

- **Initiative closure (100% engineering sign-off):** `docs/incidents/DEPLOY_TOPOLOGY_CLEANUP_100_CLOSURE.md`
- Incident / RCA: `docs/incidents/DEPLOY_TOPOLOGY_RCA_AND_FIX.md`
- DNS notes: `docs/REPORT-DNS-DOMAINS-20260305.md`
- Env vars: `docs/ENVIRONMENT-VARIABLES.md`
- Agent memory: `AGENTS.md` (Cloudflare-first runtime)
- Final release decision checklist: `docs/release-hardening/GO_NO_GO_COUNCIL_CHECKLIST.md`

---

**End of runbook.**
