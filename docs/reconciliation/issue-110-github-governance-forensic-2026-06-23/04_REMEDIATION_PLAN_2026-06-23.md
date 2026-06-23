# Remediation Plan

**Date:** 2026-06-23  
**Status:** PLAN ONLY — **do not apply in this docs PR**

## P0 — Immediate (settings; owner action required)

### 1. Enforce branch protection for administrators

**Action:** Set **`enforce_admins: true`** on `main` branch protection.

**Why:** Stops owner/admin bypass of required reviews and status checks. This is the **primary fix** for issue #110.

**Verify after apply:**
```bash
gh api repos/2qjckdknjf-ctrl/Aistroyka-web/branches/main/protection \
  --jq '.enforce_admins'
# Expected: {"enabled": true}
```

### 2. Confirm required approving review count

**Action:** Keep **`required_approving_review_count: 1`** (already set).

**Add:** Second human reviewer for high-risk PRs (integration, auth, migrations) via team policy — not necessarily a GitHub setting change.

### 3. Remove/limit bypass paths

**Action:** Audit GitHub org/repo settings for:
- Additional admin users who can bypass
- GitHub Apps with admin write access
- Personal access tokens with admin scope used for merges

**Goal:** At least **one non-author human** must submit `APPROVED` before merge is possible.

### 4. Required status checks

**Action:** Keep required check **`check`** (CI Check). Confirm strict up-to-date remains **true**.

**Add (optional):** Require `Vercel` or deployment preview check if org policy demands it.

### 5. Require conversation resolution

**Action:** Enable **`required_conversation_resolution: true`** on `main`.

**Why:** Prevents merging with unresolved review threads.

### 6. Require up-to-date branch

**Action:** Already **`strict: true`** — maintain.

## P1 — Hardening (within 1–2 weeks)

| Item | Action |
|------|--------|
| CODEOWNERS | Add `CODEOWNERS` for `apps/web/middleware.ts`, `apps/web/app/api/**`, `apps/web/supabase/migrations/**`, `.github/workflows/**`; enable `require_code_owner_reviews` |
| Protected environments | Tie production Cloudflare deploy workflow to GitHub Environment with required reviewers |
| PR template | Require checklist: non-author APPROVED, CI PASS, scope stated, no admin bypass |
| Second collaborator | Add at least one non-owner collaborator who can approve (breaks single-owner bypass habit) |

## P2 — Automation (optional)

| Item | Action |
|------|--------|
| Governance CI check | GitHub Action or ruleset that fails if `reviewDecision != APPROVED` at merge time (for audit trail) |
| Merge bot | Only merge when `gh pr view --json reviewDecision` returns `APPROVED` |
| Post-merge audit | Weekly script listing merged PRs without APPROVED reviews |

## Verification checklist (after P0 applied)

1. Open a test docs-only PR from owner account.
2. Confirm owner **cannot** merge without non-author `APPROVED`.
3. Confirm `gh pr view --json reviewDecision` shows `APPROVED` before merge succeeds.
4. Confirm `enforce_admins.enabled` is **true** in API.
5. Document evidence in issue #110 comment.
6. Close issue #110 only after live verification on a real PR.

## Explicit non-actions in this audit PR

- Do **not** change branch protection via this docs PR
- Do **not** merge this governance audit PR without non-author approval (practice the fix)
