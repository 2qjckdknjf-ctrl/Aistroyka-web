# A1 Migration Apply — Inventory

**Purpose:** Authoritative inventory for migration apply strategy closure.  
**Date:** 2026-03-16

---

## 1. CI/CD Layout

### Workflows (repo root and apps/web)

| File | Trigger | What it does | DB migration? |
|------|--------|--------------|---------------|
| `.github/workflows/deploy-cloudflare-prod.yml` | push to `main`, workflow_dispatch | Checkout → Bun → install → build stamp → **Build** → verify output → patch bundle → **Deploy** to CF (production) → post-deploy verification | **No** |
| `.github/workflows/deploy-cloudflare-staging.yml` | push to `develop` | Checkout → Bun → install → build stamp → **Build** → verify output → **Deploy** to CF (staging) | **No** |
| `apps/web/.github/workflows/deploy.yml` | push to `main`, workflow_dispatch (env choice) | Checkout → Bun → install → **Build** → Deploy (dev/staging/production by input) | **No** |
| `apps/web/.github/workflows/ci.yml` | PR/push to `main`, `feature/**` | Lint, test, cf:build, e2e smoke | **No** |
| `.github/workflows/snapshot-backup.yml` | cron / workflow_dispatch | Git snapshot branch; no deploy, no DB | **No** |
| `.github/workflows/update-lockfile-linux.yml` | — | Lockfile update | **No** |

No workflow runs `supabase db push` or any migration apply step.

### Deploy / release scripts

| Script | Purpose | Invoked from CI? |
|--------|---------|------------------|
| `scripts/release/apply-migrations.sh` | Runs `supabase db push` from `apps/web`; requires Supabase CLI and linked project | **No** — operator-only |
| `scripts/release/check-migrations.sh` | Validates migration filenames (no future-dated, no duplicates, strict order) | **No** — not referenced in any workflow |
| `apps/web/scripts/apply-step13-only.mjs` | Applies single migration via `SUPABASE_DB_URL` + pg | No — one-off / ops |
| `apps/web/scripts/verify-cost-migration.mjs` | Verifies `project_cost_items` exists | No |

Phase 3 reports (PHASE3_CI_RELEASE_GATE_REPORT, PHASE3_RELEASE_HARDENING_SUMMARY) state that migration sanity and tests were added to prod/staging deploy workflows; **current YAML does not contain those steps**. Migration sanity script exists but is not wired in CI.

---

## 2. Supabase Migration Setup

### Migration directory

- **Path:** `apps/web/supabase/migrations/`
- **Format:** `YYYYMMDDHHMMSS_name.sql` (e.g. `20260307500000_project_cost_items.sql`)
- **Count:** 47+ files (chronological order)
- **Tooling:** Supabase CLI (`supabase db push`, `supabase migration list`, `supabase migration repair`)

### Supabase CLI usage

- **In repo:** Documented in `docs/pilot-launch/DB_MIGRATION_APPLY_SEQUENCE.md`, `apps/web/docs/cursor/SUPABASE.md`, `docs/db/STEP13_MIGRATION_GOVERNANCE_SAFEGUARDS.md`.
- **Script:** `scripts/release/apply-migrations.sh` runs `supabase db push` from `apps/web`; assumes `supabase link` already done (or linked project available).
- **No `config.toml`** under `apps/web/supabase/` in repo; linking is environment-specific (local or CI with token + project ref).

### Linked project assumptions

- Apply is always against a **linked** Supabase project (via `supabase link --project-ref <ref>`).
- No single “linked” ref in repo; each operator/CI uses its own link (env or local).
- Production and staging may use different Supabase projects (different refs).

### Current migration sanity script

- **Path:** `scripts/release/check-migrations.sh`
- **Behavior:** Checks `apps/web/supabase/migrations/`: valid 14-digit timestamps, no future-dated, no duplicate timestamps, strict ascending order. Exits 0/1.
- **Does not:** Connect to DB, apply migrations, or run in any workflow.

### Existing migration apply docs

- `docs/pilot-launch/DB_MIGRATION_APPLY_SEQUENCE.md` — order, correct path (list → repair if drift → push), verify tables.
- `docs/db/STEP13_MIGRATION_GOVERNANCE_SAFEGUARDS.md` — do/don’t, runbook checklist, repair.
- `apps/web/docs/cursor/SUPABASE.md` — link, db push, migrations dir.

---

## 3. Secrets / Config Reality

### Secret names referenced today

| Where | Secret / config | Purpose |
|-------|------------------|---------|
| Deploy workflows | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | CF deploy only |
| ENVIRONMENT-VARIABLES.md / app | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | App + server; not used by migration apply |
| apply-step13-only.mjs | `SUPABASE_DB_URL` or `DATABASE_URL` | Direct Postgres apply (one-off) |
| apply-migrations.sh | None in script; relies on `supabase link` (local) | CLI uses local link |

No workflow references `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, or `SUPABASE_DB_URL`.

### GitHub Actions environments

- **Not used.** No workflow sets `environment: production` or `environment: staging`.
- Protected environments with approval gates are **available** but not configured.

### Staging vs production separation

- **App deploy:** Staging = push to `develop` (deploy-cloudflare-staging); Production = push to `main` (deploy-cloudflare-prod). Different wrangler envs.
- **DB:** Staging and production may use different Supabase projects (different project refs); not encoded in repo.

### Release flow (Vercel + Supabase + GitHub Actions)

- **Web:** Production deploy is Cloudflare Workers (main → deploy-cloudflare-prod), not Vercel (per AGENTS.md and wrangler).
- **DB:** Supabase; migrations applied **outside** CI, manually or via operator script.
- **Coupling:** Web deploy and DB migration apply are **decoupled**; either can happen without the other.

---

## 4. Release Coupling Risk

| Question | Answer |
|----------|--------|
| Is DB apply mixed with web deploy? | **No.** No workflow runs both. |
| Can web deploy happen without DB apply? | **Yes.** Deploy runs on push; migrations are separate. |
| Can DB apply happen without clear operator confirmation? | **Yes.** Apply is manual (script or Dashboard); no CI gate, no required approval, no audit in Actions. |

**Main human-error risk:** Operator runs `apply-migrations.sh` (or `supabase db push`) against the **wrong** target (e.g. production instead of staging), or applies without having run `supabase migration list` / repair, with no audit trail in CI and no approval gate for production.

---

## 5. Summary: How Migrations Are Checked / Applied Today

- **Migration check today:** Script `scripts/release/check-migrations.sh` exists and validates filenames/order; it is **not** run in any CI workflow.
- **Migration apply today:** Manual only: (1) `scripts/release/apply-migrations.sh` from repo root (Supabase CLI + linked project), or (2) Supabase Dashboard SQL Editor (copy/paste migrations in order), or (3) one-off scripts like `apply-step13-only.mjs` with `SUPABASE_DB_URL`.
- **Main human-error risk:** Wrong target (prod vs staging), no preflight (list/repair) enforced, no approval for production, no single audit trail in GitHub Actions.

---

## 6. Safest Realistic Closure Option (from inventory)

- **Dedicated migration apply path** separate from web deploy.
- **Explicit operator control:** Production apply only via explicit workflow_dispatch (and optionally GitHub Environment “production” with required reviewers).
- **Preflight in workflow:** Run migration sanity script; run `supabase migration list` before push where possible.
- **Secrets:** Use GitHub secrets (and optionally environment secrets) for Supabase CLI; no tokens in logs or docs.
- **Runbook and validation doc:** So operators know how to run staging vs production, what success/failure looks like, and when to use repair flow.

Implementing a **workflow_dispatch-only** workflow that runs migration sanity, links the chosen target (staging/production), runs `supabase migration list`, then `supabase db push`, with optional use of GitHub Environment “production” for an approval gate, is the chosen strategy (see A1_MIGRATION_APPLY_STRATEGY.md).
