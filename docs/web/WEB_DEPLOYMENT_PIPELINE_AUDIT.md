# WEB Deployment Pipeline Audit

**Date:** 2026-06-20  
**Source of truth:** `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md` (validated against workflows)

---

## Answers

| Question | Answer |
|----------|--------|
| **What branch deploys production?** | **`main`** by default (via staging success → prod chain). Manual dispatch accepts any `ref` input. |
| **Does production auto-deploy from main?** | **Indirectly:** push to `main` → staging deploy → on success triggers production workflow (`workflow_run`). Prod does **not** deploy on push alone. |
| **Is staging available?** | **Yes** — `https://staging.aistroyka.ai` (worker `aistroyka-web-staging`) |
| **Can `release/web-pilot-rc` be deployed safely?** | **Yes** via `workflow_dispatch` with `ref: release/web-pilot-rc` on staging first; prod after smoke PASS. |
| **Are env vars aligned?** | Health shows prod/staging both OK (db, AI, service role). Build-time `NEXT_PUBLIC_*` must be present in CI secrets (same as main deploys). |

---

## Cloudflare Workers

| Env | Worker name (expected) | URL |
|-----|------------------------|-----|
| Production | `aistroyka-web-production` | `https://aistroyka.ai` |
| Staging | `aistroyka-web-staging` | `https://staging.aistroyka.ai` |

Build: `bun run cf:build` (OpenNext + Wrangler) from repo root.

---

## GitHub Actions workflows

| Workflow file | Display name | Trigger |
|---------------|--------------|---------|
| `.github/workflows/deploy-cloudflare-staging.yml` | Deploy Cloudflare (Staging) | Push **`main`**, `workflow_dispatch` (`ref` input) |
| `.github/workflows/deploy-cloudflare-prod.yml` | Deploy Cloudflare (Production) | Successful staging on **`main`**, `workflow_dispatch` (`ref` input) |
| `.github/workflows/ci-check.yml` | CI Check | PRs — lint, test, `cf:build` (no deploy) |

### Staging dispatch inputs

```yaml
workflow_dispatch:
  inputs:
    ref:
      description: "Branch or ref to deploy (default: main)."
      default: "main"
```

### Production dispatch inputs

```yaml
workflow_dispatch:
  inputs:
    ref:
      description: "Branch or ref to deploy (default: main)."
      default: "main"
```

**Note:** Auto prod chain uses `workflow_run` on staging completion for **`main` branch only**. Deploying `release/web-pilot-rc` requires **manual staging dispatch**, then **manual prod dispatch** (or merge to main).

---

## Current production SHA

| Source | SHA | Time |
|--------|-----|------|
| Live health | `ff537c8` | 2026-06-20 14:58 UTC |
| Latest staging GHA success | `ff537c8` | 2026-06-20 14:53 UTC |

**Conclusion:** Pipeline is healthy; latest **main** is deployed. RC branch not yet deployed.

---

## Recent GitHub Actions (public API)

Staging workflow runs (last 5):

| Conclusion | SHA | Created |
|------------|-----|---------|
| success | ff537c8 | 2026-06-20T14:53:44Z |
| success | 13c40fe | 2026-06-20T14:51:06Z |
| success | 89bfde2 | 2026-06-20T14:41:57Z |
| failure | cb90eae | 2026-06-20T14:38:55Z |
| success | 1d6cf82 | 2026-06-17T06:25:17Z |

---

## Required secrets (deploy)

- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- `PILOT_SMOKE_BEARER_STAGING` / `PILOT_SMOKE_BEARER_PRODUCTION`
- Optional: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` (migrations preflight)

---

## wrangler config

See `apps/web/wrangler.toml` — production and staging envs referenced by deploy workflows.

---

## Local operator blocker (this audit run)

- `gh` CLI installed at `/usr/local/bin/gh` is **x86_64** on Apple Silicon host → **cannot execute** (`bad CPU type`).
- No GitHub OAuth token in `~/.config/gh/hosts.yml`.
- **Staging dispatch not executed from this machine** — use GitHub UI or fix `gh` (arm64) + auth.

### Recommended staging dispatch (operator)

```bash
gh workflow run "Deploy Cloudflare (Staging)" \
  --ref release/web-pilot-rc \
  -f ref=release/web-pilot-rc
```

Then verify:

```bash
curl -sS https://staging.aistroyka.ai/api/v1/health | jq .buildStamp
# Expect sha7 != ff537c8 (expect 9d6a781 prefix after RC deploy)
```

---

## Vercel

**Non-canonical** for production. Ignore Vercel deployment noise per runbook.
