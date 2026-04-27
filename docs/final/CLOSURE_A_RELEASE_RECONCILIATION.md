# Closure Sprint A — Release discipline reconciliation

**Project:** Aistroyka (AISTROYKA monorepo)  
**Scope:** Workstream A — *what the repository says* vs *what operators must decide*  
**Repo proof date:** 2026-03-23  

---

## 1. Canonical deploy path (GitHub → production)

| Fact | Source in repo |
|------|----------------|
| **Production CI** | [`.github/workflows/deploy-cloudflare-prod.yml`](../../.github/workflows/deploy-cloudflare-prod.yml) — trigger: `push` to `main` or `workflow_dispatch` |
| **Runtime target** | Cloudflare Workers via OpenNext (`bun run cf:build`, `wrangler deploy`, worker name `aistroyka-web-production`) |
| **Install / toolchain in CI** | `bun install --frozen-lockfile` (`packageManager`: `bun@1.2.15` in root [`package.json`](../../package.json)) |
| **Post-deploy gate** | Same workflow invokes reusable [`.github/workflows/pilot-smoke.yml`](../../.github/workflows/pilot-smoke.yml) with `base_url: https://aistroyka.ai` — **blocking** on `pilot-smoke` job after `deploy` |

**Operator truth:** Production traffic for `aistroyka.ai` is expected to match this pipeline. **CEO decision (2026-03-23):** this Cloudflare + GitHub Actions path is **authoritative** for `aistroyka.ai` production; Vercel remains **secondary** (documented only). Rationale aligns with blocking `pilot-smoke` on `https://aistroyka.ai` in the prod workflow — see §3.

---

## 2. Migrations apply strategy

| Fact | Source in repo |
|------|----------------|
| **Not auto-on-push** | [`.github/workflows/apply-migrations.yml`](../../.github/workflows/apply-migrations.yml) — **only** `workflow_dispatch` |
| **Targets** | `staging` / `production` (GitHub Environment name = target) |
| **CLI setup** | `supabase/setup-cli@v1` (official action per project norms) |
| **Working directory** | `apps/web` — `supabase link`, `supabase migration list`, `supabase db push --dry-run`, then `supabase db push --yes` |
| **Preflight** | [`scripts/release/check-env-config.sh`](../../scripts/release/check-env-config.sh) mode `migrations`; [`scripts/release/check-migrations.sh`](../../scripts/release/check-migrations.sh) |

**Implication:** Schema drift between repo and DB is an **operator responsibility**. Deploy and DB migrate are **decoupled** by design.

---

## 3. Alternate / secondary deploy surface (Vercel)

| Fact | Source in repo |
|------|----------------|
| **Vercel build from monorepo root** | [`apps/web/vercel.json`](../../apps/web/vercel.json) — `installCommand` / `buildCommand` run from repo root with `npm` + `build:contracts:npm` + `build:web:npm` |
| **AGENTS.md** | States Vercel Root Directory `apps/web` and root install/build — consistent with `vercel.json` |

**Reconciliation:** The repo supports **two** hosting configurations. **Automated** prod in GitHub Actions is **Cloudflare**. Vercel remains a **documented secondary** path (e.g. teams using Vercel UI); it is **not** the canonical production lane unless the board explicitly reverses the CEO decision above. Secrets, domains, and smoke targets should stay aligned with **Cloudflare prod**.

---

## 4. Smoke, env gates, rollback

| Topic | Repo state |
|-------|------------|
| **Pilot smoke script** | `scripts/smoke/pilot_launch.sh` (called from reusable workflow); local alias `npm run smoke:pilot` with `BASE_URL` + `AUTH_HEADER` |
| **CI env gate** | [`scripts/release/check-env-config.sh`](../../scripts/release/check-env-config.sh) — modes: `deploy-staging`, `deploy-production`, `migrations`, `pilot-smoke` |
| **Release readiness** | `npm run release:check` — [`scripts/release-readiness-check.mjs`](../../scripts/release-readiness-check.mjs); **fails without** Supabase public + service keys (expected locally; must pass in gated CI or release job if used as gate). Контракт поведения: [`CLOSURE_A_RELEASE_READINESS.md`](./CLOSURE_A_RELEASE_READINESS.md) |
| **Rollback** | No single-button automated rollback workflow in repo; operational rollback = **previous Worker version** / redeploy known-good ref + **DB caution** (migrations not automatically reversed). Document runbooks in ops docs, not assumed here. |

---

## 5. Unknowns (live / dashboard — not repo-provable)

- Whether **every** migration file in `apps/web/supabase/migrations/` is applied to production/staging **right now**.
- Cloudflare **secrets** and **vars** actual values and parity with [`docs/ENVIRONMENT-VARIABLES.md`](../ENVIRONMENT-VARIABLES.md).
- Historical **incident** or **manual** deploys outside GitHub Actions.

---

## Verdict (reconciliation doc only)

**Repo narrative is internally consistent:** Cloudflare prod pipeline + explicit migration workflow + blocking pilot smoke. **Canonical prod** is **Cloudflare via GitHub Actions** (CEO, 2026-03-23); Vercel is **secondary**.
