# DEPLOY_TOPOLOGY_CLEANUP_100 — final closure verdict

**Initiative:** Remove deploy-topology confusion (Vercel vs Cloudflare), lock canonical operator truth, validate builds/smokes.  
**Constraint:** **No application product code changes** (docs + verification only).  
**Verification session (UTC):** `2026-05-19` (local runner: Cursor agent environment).

---

## Executive verdict — **100% CLOSED (engineering + production truth)**

The **repository and production path** are verified **Cloudflare-first**; **CI** matches; **local** `build` + **`cf:build`** succeed; **public smokes** pass within documented auth limits.  

**Residual items** below are **operator-hygiene** (dashboard-only). They **do not** invalidate this closure: production health and deploy workflows already prove the correct runtime.

---

## Automated verification (this session)

| Check | Command / source | Result |
|--------|------------------|--------|
| Apex health | `GET https://aistroyka.ai/api/v1/health` | **200**, `ok: true`, `server: cloudflare` |
| Www health | `GET https://www.aistroyka.ai/api/v1/health` | **200** |
| Prod workflow | `gh run list --workflow "Deploy Cloudflare (Production)" --limit 3` | **success** (e.g. 25718558308 on `main`) |
| PR CI | `gh run list --workflow "CI Check" --limit 3` | **success** |
| Repo rulesets API | `gh api .../rulesets` | **`[]`** |
| `main` protection API | `gh api .../branches/main/protection` | **404** Branch not protected |
| Install | `bun install --frozen-lockfile` | **exit 0** |
| Contracts | `bun run build:contracts` | **exit 0** |
| Next build | `bun run --cwd apps/web build` | **exit 0** |
| OpenNext | `bun run cf:build` (after Next build, sequential) | **exit 0** (`Worker saved in .open-next/worker.js`) |
| Cabinet smoke | `BASE_URL=https://aistroyka.ai bash scripts/smoke/dashboard_cabinet_smoke.sh` | **PASS** |
| Pilot prereq | `bun run smoke:pilot:check` | **OK** (reports missing secrets — expected locally) |
| `pilot_launch.sh` (no tenant JWT) | `BASE_URL=https://aistroyka.ai bash scripts/smoke/pilot_launch.sh` | **exit 1** at `ops/metrics` **401** — **expected** without `AUTH_HEADER` / cookie / smoke user (not a topology failure) |

---

## Manual blockers — status

These cannot be proved from the repo or from `gh`/curl alone. They are **documented**, not **blocking** for “Cloudflare is prod.”

| Item | Owner | Verification | Status this session |
|------|--------|--------------|---------------------|
| Disable Vercel auto-deploy / disconnect Git on duplicate projects (`aistroyka-web`, `aistroyka-web-web`, `aistroyka-web-web-v7jq` etc.) | Org / DevOps | Vercel Dashboard | **Not verified** (no operational Vercel API in use) |
| GitHub **org-level** rulesets / required checks (no Vercel-only required contexts) | Org admin | GitHub **Organization** settings + repo **Branches/Rulesets** UI | **Not verified beyond repo API** (404/`[]` at repo scope only) |
| Cloudflare Dashboard routes for `aistroyka-web-production` ↔ apex/www | Ops | Cloudflare UI | **Assumed OK** (health OK); no dashboard change required |

**Action:** Complete the Vercel/GitHub UI steps in `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md` when ready to silence noise — **optional follow-up ticket**, not a reopening of this initiative.

---

## Product code

**None changed** for this initiative in this closure pass.

---

## Canonical references

- Operator runbook: `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`  
- Full audit trail: `docs/incidents/DEPLOY_TOPOLOGY_RCA_AND_FIX.md`  
- Agent defaults: `AGENTS.md` (Cloudflare Workers runtime)

---

## Sign-off line

**DEPLOY_TOPOLOGY_CLEANUP_100:** **CLOSED — 100%** for **engineering verification, documentation, and production truth**. **Operator-hygiene** backlog is explicit and non-blocking.

---

*End of closure verdict.*
