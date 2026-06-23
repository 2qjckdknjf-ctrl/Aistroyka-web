# Branch Protection and Ruleset State

**Date:** 2026-06-23  
**Repo:** `2qjckdknjf-ctrl/Aistroyka-web`  
**Branch:** `main`

## Classic branch protection (API)

Endpoint: `GET /repos/{owner}/{repo}/branches/main/protection`

| Setting | Value | Governance impact |
|---------|-------|-------------------|
| **Required approving review count** | **1** | At least one approval required *when protection applies* |
| **Dismiss stale reviews** | **true** | New pushes invalidate prior approvals |
| **Require code owner reviews** | **false** | CODEOWNERS not enforced |
| **Require last push approval** | **false** | Re-approval after push not required |
| **Required status checks** | `check` (GitHub Actions app id 15368) | CI Check must pass |
| **Strict status checks (up-to-date branch)** | **true** | Branch must be up to date with base |
| **Required conversation resolution** | **false** | Unresolved review threads do not block merge |
| **Enforce for administrators** | **`false`** | **Owners/admins may bypass all rules** |
| **Allow force pushes** | false | Good |
| **Allow deletions** | false | Good |
| **Required signatures** | false | Commits need not be signed |
| **Required linear history** | false | Merge commits allowed |
| **Lock branch** | false | — |

## Rulesets

Endpoint: `GET /repos/{owner}/{repo}/rulesets`

**Result:** `[]` (empty) — **no repository rulesets** configured. Protection is classic branch protection only.

## Collaborators / permissions

| User | Role / permissions |
|------|-------------------|
| `2qjckdknjf-ctrl` | **admin**, maintain, push, triage, pull |

Repo owner = `2qjckdknjf-ctrl`. Current authenticated CLI user = `2qjckdknjf-ctrl` with **admin: true**.

## Bypass actors

| Mechanism | Present? |
|-----------|----------|
| Ruleset bypass actors | N/A (no rulesets) |
| Classic protection bypass list | Not exposed in API response (none listed) |
| **Admin bypass via `enforce_admins: false`** | **YES** |

## Main targeting

Classic branch protection applies to **`main`** directly (API returned protection object for `branches/main/protection`).

## Merge queue

Not enabled (not present in protection response).

## Key governance gap

Protection **requires 1 approving review** and **strict CI check**, but **`enforce_admins.enabled: false`** means repository administrators (including the sole owner `2qjckdknjf-ctrl`) can merge without satisfying those requirements via GitHub's admin bypass path.

This explains merges with `reviewDecision: REVIEW_REQUIRED` and no `APPROVED` reviews when the merge actor is the repo owner.
