# Deploy enterprise final report (Phase 6 + A–H)

**Date:** 2026-03-05 (updated 2026-03-06)  
**Purpose:** Summary of multi-env setup, success criteria, Phase A–H status, and doc index.

---

## 1. Success criteria and Phase A–H status

| Criterion | Status | Notes |
|-----------|--------|--------|
| Cloudflare PROD build green | Pending | Repo cf:build green locally (styled-jsx fix). **Dashboard:** set Root directory empty, Build = `bun run cf:build`, then Retry (plugin cannot change settings). |
| Site on aistroyka.ai | Pending | After build green + deploy; custom domains on production Worker. |
| www → 301 to canonical, no loops | Pending | Redirect Rule in Dashboard (REPORT-DNS-DOMAINS). Custom domains + rule not settable via plugin. |
| STAGING on staging.aistroyka.ai | Pending | Staging Worker + custom domain + DNS CNAME (Dashboard / cf-dns-setup script). |
| Vercel not owner of apex/www | Pending | **No Vercel plugin.** Remove aistroyka.ai and www.aistroyka.ai in Vercel Dashboard → each project → Settings → Domains. |
| Supabase Auth redirect URLs | Pending | **Plugin:** list/get project only; no Auth URL API. Set in Supabase Dashboard: prod `https://aistroyka.ai/**`, staging `https://staging.aistroyka.ai/**` (staging project if created). |
| Smoke tests pass | Fail (expected until deploy) | See §5. Run after deploy + DNS. |
| Changes committed and documented | Done | fix(opennext), docs(ops), chore(cloudflare) smoke scripts committed. |

### Phase A–H (plugin limits)

| Phase | What | Plugin capability | Action |
|-------|------|-------------------|--------|
| A | CF build settings | Read-only (list builds, logs). Cannot set Root/Build or trigger rebuild. | Dashboard: Root = empty, Build = `bun run cf:build`, Retry. |
| B | Domains + redirect | No API for custom domains or Redirect Rules. | Dashboard: add domains to Workers; create Redirect Rule www → apex. |
| C | DNS | No Cloudflare DNS plugin. | Use repo script `cf-dns-list-aistroyka.mjs` (before snapshot), `cf-dns-setup-aistroyka.mjs` (target state). |
| D | Vercel detach | No Vercel plugin in MCP. | Dashboard: remove apex/www from all projects. |
| E | Supabase redirects | list_projects, get_project only; no Auth redirect API. | Dashboard: Authentication → URL Configuration → Redirect URLs. |
| F | Smoke tests | — | `bun run smoke:prod`, `bun run smoke:staging` (see §5). |
| G | Commits + push | — | Commits done; push to main/staging when ready. |
| H | Final report | — | This document. |

---

## 2. Domain → platform → Worker

| Domain | Platform | Worker / env | Notes |
|--------|----------|--------------|--------|
| aistroyka.ai | Cloudflare | aistroyka-web-production (production) | Canonical. Custom domain in Worker. |
| www.aistroyka.ai | Cloudflare | (same Worker) → 301 to aistroyka.ai | Redirect Rule; CNAME www → apex. |
| staging.aistroyka.ai | Cloudflare | aistroyka-web-staging (staging) | Custom domain in Worker; CNAME staging. |

**Vercel:** Must not have aistroyka.ai or www.aistroyka.ai on any project.

---

## 3. Document index

| Doc | Purpose |
|-----|--------|
| REPORT-INVENTORY-CF-PROD-20260305.md | Phase 0: Cloudflare, DNS, Vercel, Supabase state. |
| REPORT-BUILD-CF-20260305.md | Phase 1: Build order, styled-jsx fix, cf:build green. |
| REPORT-BUILD-SETTINGS-CF-20260305.md | Phase 2: Dashboard build/install commands, env names. |
| REPORT-DNS-DOMAINS-20260305.md | Phase 3: BEFORE snapshot script, target DNS, custom domains, Redirect Rule, Vercel. |
| REPORT-MULTI-ENV-CF-20260305.md | Phase 4: PROD/STAGING Workers, branches, domains. |
| REPORT-SUPABASE-20260305.md | Phase 5: Env vars, Auth redirect URLs, health. |
| ENVIRONMENT-MATRIX-20260305.md | Var names, scope, required, prod/staging. |
| RELEASE-FLOW-20260305.md | Branch → deploy → smoke. |
| REPORT-PLUGIN-CHECK-20260306.md | Plugin check: CF build cause, Supabase projects, no Vercel plugin. |
| REPORT-DEPLOY-ENTERPRISE-FINAL-20260305.md | This file. |

---

## 4. Repo changes

- **apps/web/scripts/ensure-styled-jsx-dist.cjs** — copy styled-jsx/dist before OpenNext bundle.
- **apps/web/package.json** — cf:build chain includes ensure-styled-jsx-dist.
- **package.json (root)** — smoke:prod, smoke:staging scripts.
- **apps/web/scripts/cf-dns-list-aistroyka.mjs** — list DNS records (before snapshot); requires CLOUDFLARE_API_TOKEN.
- **docs/** — reports and matrices; REPORT-DNS-DOMAINS updated with BEFORE state and custom domains/redirect checklist.

---

## 5. Smoke test results (run 2026-03-06)

Until deploy + DNS are done, expect non-green:

| Target | Command | Result | HTTP / note |
|--------|---------|--------|-------------|
| PROD | `bun run smoke:prod` | FAIL | GET https://aistroyka.ai/api/v1/health → 404 (site not deployed or route not attached). |
| STAGING | `bun run smoke:staging` | FAIL | Could not resolve host: staging.aistroyka.ai (DNS or staging Worker not set). |

**After** Dashboard: build green, deploy, custom domains, DNS, redirect rule — re-run and expect: prod 200 or 503 with JSON `ok`; staging 200/503 with `"env":"staging"`.

---

## 6. Rollback notes

- **DNS:** Before changing, run `node apps/web/scripts/cf-dns-list-aistroyka.mjs` and save output. Restore records in Cloudflare Dashboard → aistroyka.ai → DNS if needed.
- **Redirect Rule:** Dashboard → Rules → Redirect Rules → disable or delete the www → apex rule.
- **Custom domains:** Workers & Pages → each Worker → Settings → Domains → remove domain.
- **Build:** Dashboard → Build → set Root/Build back to previous values and Retry.
- No secrets in this report.

---

## 7. Manual checklist (one-time)

1. **Cloudflare:** Root directory empty, Build = `bun run cf:build`, Install = `bun install --frozen-lockfile`; Retry build. Add custom domains (prod + staging); create Redirect Rule www → apex 301. Apply DNS target state (script or Dashboard).
2. **Vercel:** Remove aistroyka.ai and www.aistroyka.ai from every project.
3. **Supabase:** Prod project → Redirect URLs: https://aistroyka.ai/**, https://www.aistroyka.ai/** (if needed). Staging project (if any) → https://staging.aistroyka.ai/**.
4. **Push:** Merge/release to main (prod) and staging branch (staging); run smoke after deploy.

---

## 8. Lockfile / “lockfile is frozen” in Cloudflare build

If the build fails with **lockfile had changes, but lockfile is frozen** after committing an updated lockfile:

- **Branch:** Cloudflare may be building from **main**. The lockfile fix is on `release/vercel-prod-hardening-2026-03-05`; merge that branch into main (or cherry-pick the lockfile commit) and push so the build uses the new lockfile.
- **Cache:** In Cloudflare Dashboard → Worker → Builds → open the failed build → **Clear build cache** (if available), then **Retry**.
- **Check commit:** In the build log, confirm the commit hash includes the “chore(deps): refresh lockfile” commit.
