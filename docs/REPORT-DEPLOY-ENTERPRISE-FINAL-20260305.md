# Deploy enterprise final report (Phase 6)

**Date:** 2026-03-05  
**Purpose:** Summary of multi-env setup, success criteria, and doc index.

---

## 1. Success criteria (from plan)

| Criterion | Status | Notes |
|-----------|--------|--------|
| Cloudflare PROD build green | Done | cf:build green (styled-jsx fix in Phase 1). |
| Site on aistroyka.ai | Manual | Deploy + DNS + domains in Dashboard. |
| www → 301 to canonical, no loops | Doc | REPORT-DNS-DOMAINS: Redirect Rule + DNS. |
| STAGING on staging.aistroyka.ai | Doc | REPORT-MULTI-ENV-CF: Worker + domain. |
| Supabase env vars and redirect URLs | Doc | REPORT-SUPABASE, ENVIRONMENT-MATRIX. |
| Smoke tests pass | Scripts | smoke-prod.sh, smoke-staging.sh; bun run smoke:prod / smoke:staging. |
| Changes committed and documented | Pending | Phase 7 commits. |

---

## 2. Document index

| Doc | Purpose |
|-----|--------|
| REPORT-INVENTORY-CF-PROD-20260305.md | Phase 0: Cloudflare, DNS, Vercel, Supabase state. |
| REPORT-BUILD-CF-20260305.md | Phase 1: Build order, styled-jsx fix, cf:build green. |
| REPORT-BUILD-SETTINGS-CF-20260305.md | Phase 2: Dashboard build/install commands, env names. |
| REPORT-DNS-DOMAINS-20260305.md | Phase 3: Canonical, www redirect, Vercel detach, DNS script. |
| REPORT-MULTI-ENV-CF-20260305.md | Phase 4: PROD/STAGING Workers, branches, domains. |
| REPORT-SUPABASE-20260305.md | Phase 5: Env vars, Auth redirect URLs, health. |
| ENVIRONMENT-MATRIX-20260305.md | Var names, scope, required, prod/staging. |
| RELEASE-FLOW-20260305.md | Branch → deploy → smoke. |
| REPORT-DEPLOY-ENTERPRISE-FINAL-20260305.md | This file. |

---

## 3. Repo changes (this session)

- **apps/web/scripts/ensure-styled-jsx-dist.cjs** — copy styled-jsx/dist before OpenNext bundle.
- **apps/web/package.json** — cf:build chain includes ensure-styled-jsx-dist.
- **package.json (root)** — smoke:prod, smoke:staging scripts.
- **docs/** — reports and matrices above.

---

## 4. Manual steps (Dashboard / external)

- Cloudflare: Build command = `bun run cf:build`, root empty, install = `bun install --frozen-lockfile`; env vars per ENVIRONMENT-MATRIX; custom domains for prod and staging; Redirect Rule www → apex.
- Vercel: Remove aistroyka.ai and www.aistroyka.ai from any project.
- Supabase: Redirect URLs for prod and staging; two projects preferred.

---

## 5. Final

- All phases 0–6 documented. Phase 7: small commits (fix/chore/docs). No secrets in any report.
