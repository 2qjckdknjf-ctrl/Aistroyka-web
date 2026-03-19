# Phase 3 — Release Checklist — AISTROYKA

**Date:** 2026-03-18 (A3 recovery docs linked)

**Recovery / rollback:** `PHASE3_ROLLBACK_RUNBOOK.md` · `PHASE3_RECOVERY_DECISION_MATRIX.md` · `PHASE3_INCIDENT_TRIAGE.md` · `PHASE3_ROLLBACK_REALITY_AUDIT.md`

---

## Before first deploy with automatic smoke

- [ ] Repository secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (deploy); `PILOT_SMOKE_BEARER_STAGING`, `PILOT_SMOKE_BEARER_PRODUCTION` (Supabase JWTs; see PHASE3_PILOT_SMOKE_USAGE.md)
- [ ] If `REQUIRE_CRON_SECRET=true` on target: `CRON_SECRET` in GitHub Actions secrets
- [ ] Staging public URL matches workflow (`https://staging.aistroyka.ai`) or update workflow if your staging domain differs
- [ ] **Env/config gate:** Deploy and migration workflows run `scripts/release/check-env-config.sh` after checkout; they fail fast if required secrets are not set (see PHASE3_ENV_CONFIG_RUNBOOK.md).

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

## Rollback / incident

Follow **`PHASE3_ROLLBACK_RUNBOOK.md`**. Summary: no automated worker rollback — use **git revert + push** or prod **workflow_dispatch** with `ref` to a known-good SHA; smoke failure means new code may already be live. DB: fix-forward or Supabase PITR/backup — not auto-downgrade (see matrix + `docs/security/backup-restore.md`).

---

## Post-release

- [ ] Monitor `/api/v1/health`
- [ ] Pilot tenants / iOS Worker as applicable

---

## Scope

- **Android** — not a release gate for this phase.
- **iOS** — depends on backend; not Android parity.
