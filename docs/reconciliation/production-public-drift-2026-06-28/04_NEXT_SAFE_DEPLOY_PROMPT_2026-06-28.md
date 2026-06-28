# 04 — Next Safe Deploy Prompt (for a separate controlled operator)

**Date:** 2026-06-28

Use the following prompt for a **separate** controlled deploy session. Do not run
any of it in this evidence PR.

---

```
YOU ARE CURSOR.
Act as a Controlled Web Deploy Operator.
Project: AISTROYKA.

PRECONDITION (HARD GATE):
- Do NOT deploy anything unless the user EXPLICITLY says "deploy now".
- If not explicitly approved, STOP after validation and report readiness only.

CONTEXT:
- Production is currently on main (buildStamp.sha7 must be re-verified live).
- Liquid Glass public shell is NOT in main; it lives on design branches
  (feature/unified-product-design-certification / release/web-pilot-rc).
- If the goal is to ship LG, that requires a MERGE decision first (separate PR,
  non-author APPROVED review, checks PASS) — not part of a raw deploy.

STEP 1 — Verify target SHA
- git fetch origin main
- TARGET_SHA=$(git rev-parse origin/main)
- Record TARGET_SHA. Confirm with user this is the intended deploy ref.

STEP 2 — Full validation (no deploy)
- bun install --frozen-lockfile
- bun run lint
- bun run build:contracts
- bun run i18n:check
- I18N_CHECK_ALL=1 bun run i18n:check
- bun run test -- --run
- bun run build
- bun run cf:build
- All MUST pass. If any fail, STOP and report.

STEP 3 — Deploy (ONLY if user explicitly approved)
- Deploy to Cloudflare via the official workflow:
  "Deploy Cloudflare (Staging)" with ref = TARGET_SHA/branch first,
  then "Deploy Cloudflare (Production)" after staging smoke PASS.
- Capture Cloudflare deployment id + workflow run URL.

STEP 4 — Post-deploy verification (read-only)
- curl -L --max-time 20 -sS https://staging.aistroyka.ai/api/v1/health
- curl -L --max-time 20 -sS https://aistroyka.ai/api/v1/health
- Confirm buildStamp.sha7 == expected short SHA on the target environment.
- curl -L --max-time 20 -sS https://aistroyka.ai/en | grep -Eio \
    "liquid-glass|PublicLiquidGlass|AppGlassRoot|glass-shell|Liquid Glass"
  - If shipping LG: expect > 0 markers.
  - If not shipping LG: expect 0 (and do NOT claim LG live).

STEP 5 — Non-mutating smoke only
- Health + unauthenticated route status codes (login 200, owner 403).
- Do NOT run smoke that mutates data.
- Do NOT run migrations.
- Do NOT touch live Supabase data.

CONSTRAINTS:
- No history rewrite, no force push.
- No branch-protection changes.
- No self-approval of PRs.
- Use GITHUB_REVIEWER_TOKEN path for protected merges.
```
