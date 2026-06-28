# 06 — Next Execution Prompt (for a separate LG code-slice operator)

**Date:** 2026-06-28

Use the following prompt in a **separate** session to implement **Slice 1** only.
Do not run any of it here.

---

```
YOU ARE CURSOR.
Act as a Liquid Glass Slice-1 Code Operator.
Project: AISTROYKA.

MISSION:
Re-apply ONLY the minimal Liquid Glass foundation + public shell + home hero
onto fresh main, in a new branch, and open a PR. Do NOT deploy. Do NOT merge.

SOURCE OF TRUTH:
- Latest origin/main (re-fetch; do not assume a SHA).
- LG payload source: origin/release/web-pilot-rc (web-only LG branch).
- Plan + allowlist: docs/reconciliation/liquid-glass-fresh-recon-2026-06-28/
  04_RECOMMENDED_LG_SHIP_PLAN_2026-06-28.md (Slice 1).

HARD RULES:
- New branch from latest main: feat/lg-slice1-public-shell-<date>.
- Cherry-pick / copy ONLY the Slice 1 allowlist files. NO broad branch merge.
- FORBIDDEN: apps/web/app/api/**, middleware.ts, lib/supabase/**,
  lib/platform-owner/**, ios/**, android/**, .github/workflows/**, scripts/**,
  env files, migrations, package.json / lockfile tooling reverts.
- i18n: add ONLY the visible-copy keys the home hero needs, to en/ru/es/it.
- Do NOT deploy, no mutating smoke, no migrations, no live data.
- No self-approve; no branch-protection bypass.

STEPS:
1. git fetch origin main; branch from origin/main.
2. For each allowlisted file, bring the LG version from
   origin/release/web-pilot-rc (git checkout origin/release/web-pilot-rc -- <path>),
   then manually drop any package.json tooling reverts and reconcile globals.css
   to be additive only.
3. Reconcile i18n keys; ensure en/ru/es/it parity.
4. Validate:
   bun install --frozen-lockfile
   bun run lint
   bun run build:contracts
   bun run i18n:check
   I18N_CHECK_ALL=1 bun run i18n:check
   bun run test -- --run            # expect 1546/1546 unless legitimately changed
   bun run build
   bun run cf:build
   (also: bun run --cwd apps/web check:design for raw colors)
5. Confirm strict diff scope == Slice 1 allowlist only (git diff --name-status).
6. Commit; push; open PR to main. DO NOT MERGE.
7. Request non-author APPROVED review (reviewer 6262265-cpu via
   GITHUB_REVIEWER_TOKEN); wait for CI check PASS.

AFTER MERGE (separate controlled deploy operator):
- Deploy staging → non-mutating smoke → production.
- Verify /api/v1/health buildStamp.sha7 == new main short SHA.
- Verify https://aistroyka.ai/en LG marker count > 0
  (liquid-glass|PublicLiquidGlass|AppGlassRoot|glass-shell).
- Only then may "Liquid Glass live" be claimed.
```
