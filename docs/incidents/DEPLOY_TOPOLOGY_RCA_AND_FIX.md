# Deploy topology: root cause (confusion) and fix — RCA

**Date:** 2026-05-19 (audit refresh)  
**Role:** Release engineering / deployment topology  
**Scope:** Clarify canonical runtime (Cloudflare Workers + OpenNext), demote Vercel to non-authoritative, and document operator actions. **No application code changes** were required.

---

## 0. MCP / plugin verification summary (what was actually used)

This Cursor workspace registers **Vercel** and **Cloudflare** MCP servers with **only** a `mcp_auth` tool in the tool manifest (no `list_projects`, `list_deployments`, Workers introspection, or write APIs exposed to the agent). **Those servers were not used to mutate or read live Vercel/Cloudflare accounts.**

| System | Tooling used | Result |
|--------|----------------|--------|
| **GitHub** | No GitHub MCP in `mcps/`; **`gh` CLI** + REST via `gh api` | Branch protection, rulesets, workflow runs |
| **Vercel** | MCP **not operational** (auth-only stub) | **No** project/deployment listing; **manual** dashboard steps documented |
| **Cloudflare** | MCP **not operational** (auth-only stub) | Worker/routes validated via **HTTP** + workflow docs |
| **Supabase** | **Not used** | No DB/deploy/env fault proven; no migrations |

---

## 1. What was failing visually

**Symptom:** Operators saw **no single “source of truth”** for deploy status:

- **Vercel** showed deployments in states such as **CANCELED**, **QUEUED**, **BUILDING**, **READY**, often across **multiple projects** with similar names. That reads like production is broken or “stuck,” even when the real production path is healthy.
- **GitHub** may show **Vercel-provided commit statuses** alongside **GitHub Actions** (e.g. **CI Check**, **Deploy Cloudflare …**). Without a documented rule, reviewers merge based on the wrong row.
- **Perception:** “Red / yellow Vercel === failed prod deploy.”

**Important:** This is primarily **UX and governance confusion**, not evidence that Cloudflare production failed.

---

## 2. Did Cloudflare production actually fail?

**No.** For run **25718254206** (“Merge PR #13…”), GitHub Actions reports:

| Job | Outcome |
|-----|---------|
| Build and deploy to production | **success** |
| Post-deploy pilot smoke (blocking) | **success** |
| Post-deploy AI Phase 5 gate (non-blocking) | **success** |

### 2.1 Workflow run samples (`gh` CLI, 2026-05-19)

**Deploy Cloudflare (Production)** — latest lines:

- Multiple **`completed` / `success`** on `main` pushes (e.g. runs **25718558308**, **25718471621**, **25718254206**).
- One older **`workflow_dispatch`** failure (**25507056496**) — historical; **not** contradicting current green path.

**Deploy Cloudflare (Staging)** — latest lines:

- Mostly **`success`** on `workflow_dispatch` from feature branches.
- One **`failure`** on `main` push (**25506747821**) — staging is intended for **`develop`**; push to `main` can fail early by design/config — **not** used as production signal.

**CI Check** — latest lines:

- Mostly **`success`** on PRs; one **`cancelled`** run (concurrency) — normal noise; trust **latest green** on the PR head.

---

## 3. Live HTTP validation (Cloudflare)

**Executed:** `curl -i` against production health.

| URL | HTTP | `server` | `ok` | `buildStamp` |
|-----|------|----------|------|--------------|
| `https://aistroyka.ai/api/v1/health` | **200** | **cloudflare** | **true** | **present** (`sha7`, `buildTime`) |
| `https://www.aistroyka.ai/api/v1/health` | **200** | **cloudflare** | **true** | **present** (same body as apex at audit time) |

**No new production workflow dispatch** was triggered: recent production runs are green and health is OK.

---

## 4. Canonical deploy topology (repository truth)

### 4.1 Production

- **Workflow:** `.github/workflows/deploy-cloudflare-prod.yml` — **Deploy Cloudflare (Production)**  
- **Trigger:** Push to `main` and `workflow_dispatch` (optional `ref`).  
- **Build:** `bun run cf:build` (OpenNext), patched deploy bundle, `wrangler deploy` to production env (**expected worker name `aistroyka-web-production`** per workflow comments).  
- **Blocking post-check:** reusable **pilot-smoke** against `https://aistroyka.ai`.  
- **Non-blocking:** AI Phase 5 gate (`continue-on-error: true`).

### 4.2 Staging

- **Workflow:** `.github/workflows/deploy-cloudflare-staging.yml` — **Deploy Cloudflare (Staging)**  
- **Trigger:** Push to **`develop`** and `workflow_dispatch`.  
- **Target:** Staging worker (**expected name `aistroyka-web-staging`**) + `https://staging.aistroyka.ai`.

### 4.3 PR merge gate (GitHub Actions in repo)

- **Workflow:** `.github/workflows/ci-check.yml` — **CI Check**  
- **Contents:** `bun install`, `i18n:check`, `lint`, `test`, **`bun run cf:build`** (Cloudflare bundle, **no deploy**).  
- **There is no Vercel deploy or `vercel` CLI** in this workflow.

**Root `package.json`:** scripts center on `cf:build`, `cf:deploy:*`, Wrangler — **no Vercel CLI scripts**.  
**`apps/web/package.json`:** `cf:build`, `cf:deploy`, `wrangler` — **no Vercel CLI scripts**.

**Conclusion:** **Production and staging deploy use Cloudflare only** in GitHub Actions. **PR CI validates Cloudflare bundle via `cf:build` only.** **Vercel is not required** for canonical production.

---

## 5. Vercel in the repo (non-canonical artifacts)

| Item | Notes |
|------|--------|
| `apps/web/vercel.json` | Present: monorepo `installCommand` / `buildCommand` for an **optional** Vercel build. **Does not** define canonical production. |
| `.github/workflows/*` | **No** `vercel` references (ripgrep). |
| `.vercel/` | **Not** checked in (expected). |

### 5.1 Non-canonical Vercel project names (operator cleanup list)

Reported duplicates / noise sources:

1. `aistroyka-web`  
2. `aistroyka-web-web`  
3. `aistroyka-web-web-v7jq`

**MCP did not list deployments** (see §0). Operators should in **Vercel Dashboard** → each **Project** → **Settings** → **Git**:

- **Disable automatic Git deployments** and/or **Disconnect** Git, **or** leave one project as **preview-only**.

**Do not delete** projects without owner approval; **prefer disable/disconnect.**

---

## 6. GitHub branch protection / required checks

### 6.1 Trusted checks (engineering meaning)

| Trust | Name / workflow | When it applies |
|-------|-----------------|-----------------|
| **Trust** | **CI Check** | **PRs** to `main` — lint, tests, i18n, `cf:build`. |
| **Trust** | **Deploy Cloudflare (Production)** | After merge to **`main`** — deploy + **blocking** pilot smoke. |
| **Trust** | **Deploy Cloudflare (Staging)** | **`develop`** / manual — deploy + **blocking** pilot smoke. |
| **Trust (job)** | **Post-deploy pilot smoke** | Part of deploy workflows above — **blocking** gate for that deploy. |

### 6.2 Ignore for production readiness

| Ignore | Reason |
|--------|--------|
| Vercel UI deployment rows (Canceled/Queued/etc.) on duplicate projects | **Non-canonical** for prod |
| Optional / informational Vercel GitHub statuses | Unless explicitly made **required** — remove from required if so |
| Staging workflow failures triggered from wrong branch (e.g. `main`) | Staging source branch is **`develop`** |

### 6.3 API snapshot (`gh api`, 2026-05-19)

- `GET .../branches/main/protection` → **404** `"Branch not protected"` (classic protection **not** reported for `main`, or not visible to token).
- `GET .../rulesets` → **`[]`**.

**Org-level rulesets** are **not** verified here (need org admin / UI).

**Operator must still confirm** in **GitHub UI**: **Settings → Branches** and **Settings → Rules → Rulesets**, and any **organization** rules, that **no Vercel-only context is required** for merge.

---

## 7. What changed vs previous commits

| Area | Change |
|------|--------|
| **Product code** | **None** |
| **Repo docs** | This file + `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md` created/updated |
| **Vercel / GitHub settings via MCP** | **None** (no write-capable MCP tools available in workspace) |

---

## 8. Operator actions still required (manual)

1. **Vercel:** For `aistroyka-web`, `aistroyka-web-web`, `aistroyka-web-web-v7jq` — **Settings → Git** → disable auto-deploy or disconnect; confirm no production custom domains on Vercel if Cloudflare owns apex/www (`docs/REPORT-DNS-DOMAINS-20260305.md`).  
2. **GitHub:** Confirm **required status checks** in UI/org rules — remove **Vercel** contexts from **required** if present.  
3. **Cloudflare (optional sanity):** Dashboard → **aistroyka-web-production** → routes/domains match `aistroyka.ai` / `www`.

---

## 9. Final verdict tables

### 9.1 Executive verdict (prior format)

| Verdict | Value |
|---------|--------|
| **CLOUDFLARE PRODUCTION** | **PASS** |
| **VERCEL** | **NON-CANONICAL** |
| **GITHUB REQUIRED CHECKS CLEAN** | **API CLEAN, UI CONFIRM REQUIRED** |
| **DEPLOY INCIDENT CLOSED** | **YES** *(production verified; Vercel demoted in docs; manual UI cleanup documented)* |

### 9.2 Extended verdict (mandatory closure checklist)

| Item | Verdict |
|------|---------|
| **CLOUDFLARE PRODUCTION** | **PASS** |
| **HEALTH ENDPOINT** | **PASS** (apex + `www`, 200, `ok`, `server: cloudflare`, `buildStamp`) |
| **VERCEL** | **NON-CANONICAL** |
| **VERCEL AUTO-DEPLOY DISABLED** | **MANUAL REQUIRED** *(MCP could not; operator uses Vercel UI)* |
| **GITHUB REQUIRED CHECKS CLEAN** | **API CLEAN, UI CONFIRM REQUIRED** |
| **PRODUCT CODE CHANGED** | **NO** |
| **DEPLOY INCIDENT CLOSED** | **YES** |

---

## 10. References

- `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md` — operator runbook  
- `.github/workflows/deploy-cloudflare-prod.yml`  
- `.github/workflows/deploy-cloudflare-staging.yml`  
- `.github/workflows/ci-check.yml`  
- `apps/web/vercel.json`  
- `AGENTS.md`  

---

**End of report.**
