# Phase 3 / A2 — Release Checklist — AISTROYKA

**Date:** 2026-03-18

---

## Before first deploy with automatic smoke

- [ ] Repository secrets: `PILOT_SMOKE_BEARER_STAGING`, `PILOT_SMOKE_BEARER_PRODUCTION` (Supabase JWTs; see PHASE3_PILOT_SMOKE_USAGE.md)
- [ ] If `REQUIRE_CRON_SECRET=true` on target: `CRON_SECRET` in GitHub Actions secrets
- [ ] Staging public URL matches workflow (`https://staging.aistroyka.ai`) or update workflow if your staging domain differs

---

## Pre-release

- [ ] CI green on target branch
- [ ] Migration sanity / tests as you require (not in deploy workflow by default)
- [ ] Build passes locally if needed: `bun run cf:build`
- [ ] Env documented: docs/ENVIRONMENT-VARIABLES.md

---

## Migration checks

- [ ] Migrations applied (A1 workflow or `supabase db push`) before relying on new schema

---

## Deploy step

- [ ] Push to `develop` (staging) or `main` (prod)
- [ ] **Deploy job** completes (Cloudflare)
- [ ] **Pilot smoke job** completes — workflow is red until smoke passes

---

## Smoke (automatic + manual)

- **Automatic:** Blocking job after deploy (no extra action if secrets are set).
- **Manual (optional):** `BASE_URL=... npm run smoke:pilot` for extra checks or debugging.

---

## Rollback

No automated rollback. Revert + push, or wrangler deploy prior artifact. If deploy succeeded but smoke failed, app may already serve new code.

---

## Post-release

- [ ] Monitor `/api/v1/health`
- [ ] Pilot tenants / iOS Worker as applicable

---

## Scope

- **Android** — not a release gate for this phase.
- **iOS** — depends on backend; not Android parity.
