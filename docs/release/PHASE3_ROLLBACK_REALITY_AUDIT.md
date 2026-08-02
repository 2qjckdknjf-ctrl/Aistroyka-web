# Phase 3 / A3 — Rollback & recovery reality audit — AISTROYKA

> **STALE PATH RISK (Phase 8, 2026-07-30):** Production deploy is gated on successful **Deploy Cloudflare (Staging)** (`workflow_run`), not a direct push-to-main production deploy. Prefer `docs/roadmap/AISTROYKA_PHASE8_ROLLBACK_REHEARSAL_2026-07-30.md` + `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`. Historical snapshot — do not delete.

**Date:** 2026-03-18  
**Purpose:** Truthful picture of what exists today (no invented automation).

---

## 1. Web deploy path (current)

| Target | Trigger | Build | Deploy command (from `apps/web`) |
|--------|---------|-------|----------------------------------|
| **Staging** | Push to `main` | `bun run cf:build` | `npx wrangler deploy --env staging --no-bundle --config wrangler.deploy.toml` (after dry-run + `patch-bundle-require.cjs`) |
| **Production** | Push to `main` or `workflow_dispatch` (optional `ref`) | Same + patch step for production bundle | `npx wrangler deploy --env production --no-bundle --config wrangler.deploy.toml` (after dry-run + `patch-bundle-require.cjs`) |

- Worker names (as logged in workflows): staging worker from `[env.staging]` in `wrangler.toml`; production expected `aistroyka-web-production`.
- **Post-deploy:** Job `pilot-smoke` runs **after** wrangler deploy succeeds. A failed smoke does **not** undo the deploy — traffic already hits the new worker.

---

## 2. Migration apply path (current)

- There is currently **no canonical repo workflow** for migration apply.
- Current operator path is manual:
  - `supabase migration list`
  - `supabase db push --dry-run --linked`
  - `supabase db push --linked` (explicit operator decision)
- **There is no automated migration rollback** in repo workflows. Recovery stays fix-forward or PITR (operator + Supabase).

---

## 3. Smoke path (context for recovery)

- `scripts/smoke/pilot_launch.sh`: health, config, cron-tick, ops/metrics.
- Used in CI via `.github/workflows/pilot-smoke.yml` after deploy.
- Manual rerun: `BASE_URL=...` + auth env as in `PHASE3_PILOT_SMOKE_USAGE.md`.

---

## 4. Current rollback reality

| Layer | What exists | What does **not** exist |
|-------|-------------|-------------------------|
| **Web (Cloudflare)** | Redeploy by pushing **revert** or older commit to `main`, or prod/staging **`workflow_dispatch`** with `ref` pointing at a known-good SHA/branch | One-click “rollback to last release” in repo; no stored golden artifact in CI |
| **DB** | Fix-forward migrations; operator-driven **Supabase backup / PITR** per plan (see `docs/security/backup-restore.md`) | Automatic reverse migration; `supabase db pull` as rollback |
| **CI** | Failed deploy job → previous worker unchanged on that env (if deploy step never completed) | Smoke failure does not auto-revert worker |

---

## 5. Reversible vs fix-forward vs escalation

| Situation | Typical handling |
|-----------|------------------|
| Build failed before deploy | No production/staging worker change. Fix code; push again. |
| Deploy step failed mid-flight | May be partial; check Cloudflare dashboard + health. Redeploy after fix. |
| Deploy OK, smoke failed | **New code is live.** Roll back web via git revert + push or dispatch older `ref`. |
| Migration dry-run failed | No DB mutation. Fix migrations; re-run workflow. |
| Migration apply failed mid-way | **Stop.** Assess schema state; may need repair migration or Supabase support / PITR — not scripted here. |
| Migration succeeded, app incompatible | Often **fix-forward** (deploy matching code) or **DB restore** if data corrupted — judgment call. |
| Wrong secrets / env | Fix secrets; redeploy; no DB rollback needed unless bad data written. |

---

## 6. Operator judgment required

- Whether smoke failure is **false negative** (JWT/cron secret) vs **real outage** — affects whether to revert web or fix secrets and redeploy.
- Whether DB state is safe after a **partial** migration — often requires DBA / Supabase console inspection.
- **Freeze deploys** when blast radius unknown (see `PHASE3_INCIDENT_TRIAGE.md`).

---

## 7. Known-good deployment identifier

- **Web:** Last known-good is a **commit SHA** (or branch/tag pointing to it) on `main` (prod and staging deploy workflows). No CI-stored “golden” deployment ID; operator uses git history and Actions run list to identify the SHA to revert to or to pass as `ref` in workflow_dispatch.
- **DB:** Migration history is in Supabase; no single “version” token in repo. Use `supabase migration list` and A1 runbook to align.

---

## 8. Biggest recovery gap

- **Smoke failure does not auto-revert.** New code is already live when pilot-smoke runs; if smoke fails, the operator must decide (revert web vs fix secrets/false negative) and execute manually. No in-repo automation to “roll back to previous deployment” — only git revert + push or workflow_dispatch with known-good `ref`.
- **DB:** No automated migration rollback; partial apply or schema drift requires operator/Supabase judgment and possibly PITR (see `docs/security/backup-restore.md`).

---

## 9. Related docs

- `PHASE3_ROLLBACK_RUNBOOK.md` — steps.
- `PHASE3_RECOVERY_DECISION_MATRIX.md` — case-by-case.
- `PHASE3_INCIDENT_TRIAGE.md` — severity and freeze rules.
- `docs/closure/A1_MIGRATION_APPLY_RUNBOOK.md` — migration apply operator path.
- `docs/security/backup-restore.md` — backup / PITR expectations.
