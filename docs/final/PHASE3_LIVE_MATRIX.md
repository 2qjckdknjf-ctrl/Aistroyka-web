# Phase 3 — Live vs repo vs unknown matrix

**Project:** Aistroyka  
**Date:** 2026-03-23  
**Scope:** Runtime truth vs repository for canonical prod (`https://aistroyka.ai`) and agreed staging (separate verification required).

---

## Legend

| Tag | Meaning |
|-----|---------|
| **PROVEN** | Observed in this audit with command/output reference (see `PHASE3_RUNTIME_VALIDATION.md`). |
| **REPO** | Defined in repo/CI only; live not re-proven here. |
| **OPEN** | Not verified in this pass or blocked on operator credentials/targets. |

---

## A. Deploy / edge

| Item | Production (`aistroyka.ai`) | Staging | Notes |
|------|----------------------------|---------|--------|
| Public HTTPS + redirect | **PROVEN** — site responds (follow redirects) | **OPEN** | No staging `BASE_URL` approved for this run. |
| Build stamp in health JSON | **PROVEN** — `buildStamp.sha7` present | **OPEN** | Same codebase path assumed; not double-checked on staging. |
| CI deploy + blocking smoke | **REPO** — `.github/workflows/pilot-smoke.yml` + deploy workflow wiring per `CLOSURE_A_RELEASE_VALIDATION.md` | **OPEN** | This heartbeat did not re-run GitHub Actions. |

---

## B. Database / Supabase migrations

| Item | Linked remote (CLI on dev machine) | Production DB | Staging DB |
|------|-----------------------------------|---------------|------------|
| Repo migration files | **PROVEN** — 62 SQL files under `apps/web/supabase/migrations/`; `check-migrations.sh` **PASSED** | **REPO** (same files) | **REPO** (same files) |
| `supabase migration list` parity | **PROVEN** — last local `20260323000000` **not** on remote (empty Remote column) | **OPEN** | **OPEN** |
| `supabase db push --dry-run` | **PROVEN** — would apply `20260323000000_project_members_owner_role.sql` | **OPEN** | **OPEN** |

**Interpretation:** The CLI-linked project is **behind** the repo by **one** migration. Production and staging must each be checked with the correct `SUPABASE_PROJECT_REF` / linked project; this matrix treats them as **OPEN** until an operator records per-environment output.

---

## C. Application health / API

| Endpoint / behavior | Production | Staging |
|---------------------|------------|---------|
| `GET /api/v1/health` | **PROVEN** — HTTP **503**, `ok:false`, `db:"error"`, reason references RLS recursion on `tenant_members` | **OPEN** |
| `GET /api/v1/config` | **PROVEN** — HTTP **200**, JSON body | **OPEN** |
| `POST /api/contact` | **PROVEN** — HTTP **200** (with `-L`), prior AISAA-7 marker flow | **OPEN** |
| Full `scripts/smoke/pilot_launch.sh` (cron + metrics) | **OPEN** — requires `CRON_SECRET` (if enforced) and tenant **Bearer** / cookie | **OPEN** |

---

## D. Environment variables (live dashboard)

Cross-check of Vercel / Cloudflare / Supabase dashboards against `docs/ENVIRONMENT-VARIABLES.md` (presence/absence only, no values): **OPEN** — not accessible from this agent run.

---

## E. Summary counts

| Category | PROVEN (prod) | REPO-only | OPEN |
|----------|---------------|-----------|------|
| Rows above (coarse) | 5 | 2 | All staging + prod DB parity + live env audit + full pilot smoke |
