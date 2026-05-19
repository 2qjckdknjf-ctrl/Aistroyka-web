# Deployment source of truth (operators)

**Last updated:** 2026-05-19  
**Applies to:** AISTROYKA web (`apps/web`), GitHub repo **Aistroyka-web**

---

## Production — canonical path

| Layer | Source of truth |
|------|------------------|
| **Runtime** | **Cloudflare Workers** (OpenNext Cloudflare adapter) |
| **Build** | `bun run cf:build` (repo root) — see `apps/web/package.json` `cf:build` |
| **Deploy** | Wrangler production env — workflow `.github/workflows/deploy-cloudflare-prod.yml` |
| **Worker name (expected)** | `aistroyka-web-production` (per deploy workflow / `wrangler.toml` comments) |
| **Public URL** | https://aistroyka.ai (apex and `www` should both serve the app; validate with health below) |

**GitHub workflow (production):** **Deploy Cloudflare (Production)** — triggers on **push to `main`** and `workflow_dispatch`.

**Blocking production gate after deploy:** **Post-deploy pilot smoke** (reusable workflow), targeting `https://aistroyka.ai`.

**Non-blocking:** **Post-deploy AI Phase 5 gate** (`continue-on-error: true`).

---

## Staging — canonical path

| Layer | Source of truth |
|------|------------------|
| **Deploy workflow** | `.github/workflows/deploy-cloudflare-staging.yml` — **Deploy Cloudflare (Staging)** |
| **Trigger** | Push to **`develop`** and `workflow_dispatch` |
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

---

## Manual UI checks (when automating hit limits)

| Platform | Where to look |
|----------|----------------|
| **GitHub** | **Settings → Branches** — classic branch protection / required status checks |
| **GitHub** | **Settings → Rules → Rulesets** — repo rulesets |
| **GitHub** | **Organization** rules (org admin) — not visible via all API tokens |
| **Vercel** | **Project → Settings → Git** — auto-deploy, connected repo |
| **Cloudflare** | **Workers & Pages** → worker **aistroyka-web-production** → routes, custom domains, logs |

**Remove** any **required** GitHub status check that is **only** from the Vercel GitHub App if production is exclusively Cloudflare — exact context names vary (e.g. `Vercel`, `Vercel Preview`, project slug).

---

## Related documents

- Incident / RCA: `docs/incidents/DEPLOY_TOPOLOGY_RCA_AND_FIX.md`
- DNS notes: `docs/REPORT-DNS-DOMAINS-20260305.md`
- Env vars: `docs/ENVIRONMENT-VARIABLES.md`
- Agent memory: `AGENTS.md` (Cloudflare-first runtime)

---

**End of runbook.**
