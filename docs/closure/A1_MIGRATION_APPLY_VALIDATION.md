# A1 Migration Apply — Validation Report

**Purpose:** What was implemented and how it was validated. Clear separation of repo vs workflow vs environment vs live evidence.  
**Date:** 2026-03-16

---

## 1. Repo validation

| Check | Result |
|-------|--------|
| Migration sanity script | `bash scripts/release/check-migrations.sh` — PASSED (53 migrations). |
| Apply script | `scripts/release/apply-migrations.sh` — no secrets; runs check-migrations then db push; reference to runbook. |
| Full test suite | `bun run test` — 483 tests passed (98 files). |
| Production build | `bun run cf:build` — completed successfully. |
| No secret values in docs/workflow | Grep: only secret **names** (e.g. SUPABASE_ACCESS_TOKEN) appear; no tokens or URLs. |

Repo validation is **complete** and repeatable from the repo.

---

## 2. Workflow validation

| Check | Result |
|-------|--------|
| Trigger | **workflow_dispatch only** — no push/pull_request triggers. Confirmed by inspection of `on:` in `.github/workflows/apply-migrations.yml`. |
| Target selection | Explicit input `target` with type choice, options: staging, production. |
| Environment | Job uses `environment: ${{ github.event.inputs.target }}` so staging/production environments are used when they exist. |
| Preflight steps | (1) Check required secrets, (2) Checkout, (3) Migration sanity check, (4) Setup Supabase CLI, (5) Link Supabase project, (6) Preflight — migration list, (7) Dry-run (preview migrations to apply), (8) Apply migrations (db push), (9) Post-apply summary. |
| Dry-run support | Step "Dry-run (preview migrations to apply)" runs `supabase db push --dry-run`; log boundary "--- DRY RUN ... ---" and "--- END DRY RUN ---". Dry-run does not validate SQL execution (Supabase CLI limitation); it shows which migrations would be applied. |
| Real apply step | Step "Apply migrations (db push)" runs `supabase db push` with log boundaries "--- APPLY BOUNDARY ---" and "--- APPLY COMPLETE ---". |
| Secrets | Passed via `secrets.SUPABASE_ACCESS_TOKEN` and `secrets.SUPABASE_PROJECT_REF`; not echoed. |

Workflow validation is **complete** by inspection and runbook alignment.

---

## 3. GitHub environment enforcement status

| Item | Status | Verified by |
|------|--------|-------------|
| Environments `staging` and `production` | **Not verified from repo.** Workflow references them; GitHub creates them on first use if absent (with no protection). | — |
| Environment secrets (SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF) | **Not verified.** Expected to be set by operator per `docs/closure/A1_MIGRATION_APPLY_ENVIRONMENT_SETUP.md`. | — |
| Required reviewers on production | **Not verified.** Optional; operator must configure in Settings → Environments → production. | — |
| Prevent self-review | **Not verified.** Optional; depends on GitHub plan. | — |

**Conclusion:** GitHub environment setup and enforcement are **external**. No gh CLI or API access was used in this task to create or verify environments or protection rules. The strongest available control in repo is: workflow_dispatch + explicit target + use of `environment:` so that **when** an operator configures required reviewers on "production", approval is enforced. Exact operator steps are in `docs/closure/A1_MIGRATION_APPLY_ENVIRONMENT_SETUP.md`.

**External blocker (for full proof of enforcement):** Access to GitHub Settings (Environments, protection rules) and to Actions secrets is outside this execution context. An operator must perform the setup and document that production has required reviewers if that is the intended control.

**MCP/CLI check (performed):** See `docs/closure/A1_MIGRATION_APPLY_ACCESS_AUDIT.md`. Summary: `gh` CLI is installed but **not authenticated** (no `GH_TOKEN`; `gh auth status` reports not logged in). No GitHub MCP (Actions, Settings, Secrets, Environments) is available. Supabase project ref `vthfrxehrursfloevnlp` (AISTROYKA) is documented from prior context; MCP does not provide a way to set GitHub secrets. Therefore: **cannot** verify or create Environments, **cannot** set or verify Secrets, **cannot** trigger the Apply Supabase migrations workflow, **cannot** read workflow run logs.

---

## 4. Live execution evidence status

| Run type | Executed | Evidence / blocker |
|----------|----------|--------------------|
| Staging workflow run | **Partial** | Workflow now reaches apply; **blocked** by schema drift (existing RLS policy) during `supabase db push`. History mismatch for remote-only versions was repaired to `reverted`; see `A1_STAGING_MIGRATION_MISMATCH_AUDIT.md` §10 and run `23239004913`. |
| Production workflow run | **NO** | Not attempted. |

**Blocker for full staging success (current):** `supabase db push` fails because policy `tenant_members_select_own` on `public.tenant_members` already exists (SQLSTATE 42710). This indicates staging schema drift vs the canonical migration chain. Do not blind-repair beyond the two known versions; resolve drift explicitly (e.g. align policy creation to be idempotent, or reconcile existing policy definition) before re-running apply.

---

## 5. Exact blocker summary

- **Staging dry-run / db push:** Migration history mismatch (documented audit + CASE B repair path). Not a workflow defect.
- **GitHub environment enforcement proof:** May still require operator verification in Settings (Environments, protection rules).

Repo workflow and scripts are aligned; staging repair требует CLI с токеном. **2026-03-18:** токен в терминале пользователя ≠ env агента Cursor — см. `A1_STAGING_MIGRATION_MISMATCH_AUDIT.md` §9.2; либо `.env.local` с `SUPABASE_ACCESS_TOKEN`, либо ручной прогон §9 + `gh workflow run`.

---

## 6. Workflows / scripts changed (current)

| Item | Change |
|------|--------|
| `.github/workflows/apply-migrations.yml` | workflow_dispatch only; target (staging \| production); environment from target; migration sanity → install CLI → link → migration list → **dry-run** → apply (db push); log boundaries for dry-run and apply; no echo of secrets. |
| `scripts/release/apply-migrations.sh` | Unchanged from A1 initial closure: preflight check-migrations, then db push; runbook reference. |

---

## 7. Docs reference

| Doc | Purpose |
|-----|--------|
| A1_MIGRATION_APPLY_INVENTORY.md | CI/CD and migration apply inventory. |
| A1_MIGRATION_APPLY_STRATEGY.md | Safety model: enforced vs optional controls, limitations. |
| A1_MIGRATION_APPLY_RUNBOOK.md | Operator steps; matches final workflow (including dry-run). |
| A1_MIGRATION_APPLY_VALIDATION.md | This file. |
| A1_MIGRATION_APPLY_ACCESS_AUDIT.md | What access is available vs blocked (MCP/gh/API); operator action list. |
| A1_MIGRATION_APPLY_ENVIRONMENT_SETUP.md | Exact GitHub Environment and secret setup steps. |
| A1_MIGRATION_APPLY_LIVE_EVIDENCE.md | Live run status, blocker, operator procedure to produce evidence. |
| A1_STAGING_MIGRATION_MISMATCH_AUDIT.md | Staging local vs remote migration versions; CASE B repair commands. |
