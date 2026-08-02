# Phase 3 / A3 — Rollback & recovery runbook — AISTROYKA

> **STALE PATH RISK (Phase 8, 2026-07-30):** Canonical runtime is **Cloudflare Workers + OpenNext** via `.github/workflows/deploy-cloudflare-{staging,prod}.yml`. Staging trigger is **`main`**, not `develop`. Do **not** treat Vercel as production proof. Prefer the tabletop + procedure in `docs/roadmap/AISTROYKA_PHASE8_ROLLBACK_REHEARSAL_2026-07-30.md` and `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`. Keep this file as historical operator notes; do not delete.

**Date:** 2026-03-18  
**Short operator guide.** There is **no** one-command automated rollback in this repo.

---

## Prerequisites

- GitHub access: merge to `main` / `develop`, or run **Deploy Cloudflare (Production)** with `ref`.
- Cloudflare credentials (for manual wrangler from laptop if ever needed — same as CI secrets).
- Read: `PHASE3_RECOVERY_DECISION_MATRIX.md`, `PHASE3_INCIDENT_TRIAGE.md`.
- Migration path: `docs/closure/A1_MIGRATION_APPLY_RUNBOOK.md`.

---

## Stop-the-line rules

1. **Do not** run production migration apply while production is unstable and cause is unknown.
2. **Do not** “reverse migrations” with ad-hoc SQL unless explicitly approved — prefer fix-forward or Supabase PITR per `docs/security/backup-restore.md`.
3. **Do not** force-push `main` / `develop` to “roll back” git history (use **revert** commits).
4. If smoke fails after deploy, assume **new code is live** until you redeploy something else.

---

## Classify the incident

1. **Web only?** (build/deploy/smoke/runtime) → matrix rows A–C, F.  
2. **DB involved?** → D–E, G.  
3. **Unclear?** → H: freeze deploys, triage.

---

## Web rollback path (realistic today)

**Production**

1. Identify last **known-good** commit SHA on `main`.
2. **Option A (preferred):** `git revert` the bad commit(s), push to `main` → normal deploy workflow runs.  
3. **Option B:** GitHub → Actions → **Deploy Cloudflare (Production)** → **Run workflow** → set `ref` to the good SHA (branch or tag that points to it).  
4. Wait for deploy + smoke green (or validate manually with `pilot_launch.sh` if smoke secrets broken).

**Staging**

1. Revert or push fix to `develop`, or dispatch is not on staging workflow — use **push to `develop`** with revert/fix.

**Manual wrangler (emergency, same as CI intent)**

```bash
cd apps/web
# Production (matches CI): build + patch + deploy — see deploy-cloudflare-prod.yml steps
bun install --frozen-lockfile   # from repo root first
# Then follow the same sequence as CI: cf:build, dry-run, patch, wrangler deploy --env production ...
```

Only use manual path if Actions unavailable; keep a second operator to verify commands.

---

## Fix-forward path

- **Hotfix commit** on `main` / `develop` after minimal repro.  
- **Secrets-only:** fix GitHub/Cloudflare/Supabase env, redeploy same SHA (prod: re-run deploy workflow with same `ref`).

---

## DB escalation path

1. **Failed migration (no/partial apply):** A1 runbook + Supabase dashboard + `migration list`.  
2. **Corruption / partial DDL:** stop; involve **infra/DB owner**; consider **PITR / restore** via Supabase (not automated here).  
3. Document outcome in internal incident log.

---

## What NOT to do

- Claim “rollback complete” without checking `/api/v1/health` and critical user paths.
- Run `db push` to production without dry-run + approval path.
- Share secrets in Slack/email.

---

## Post-recovery verification

- `GET /api/v1/health`, `GET /api/v1/config` on affected URL.  
- `bash scripts/smoke/pilot_launch.sh` with `BASE_URL` + `AUTH_HEADER` / `CRON_SECRET` as needed.  
- Confirm GitHub Actions deploy workflow **green** for the recovery commit.

---

## Communication / logging

- Record: incident id, start time, deploy SHA before/after, migration ids if any, decision (revert vs fix-forward vs DB escalate).  
- Customer comms per your playbook; no secret values in tickets.
