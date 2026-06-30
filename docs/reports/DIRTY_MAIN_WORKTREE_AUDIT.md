# Dirty `main` Worktree Audit (read-only)

> **Audit only. Nothing cleaned, reset, stashed, committed, or checked out.**
> Date: 2026-06-30 · Auditor: read-only inspection · Policy: non-destructive
> Context: `origin/main` tip `5bfdc3b0`; Slice 1 landed; Slice 2 NOT approved.

## A. Dirty worktree path

| Field | Value |
|---|---|
| Path | `/Users/alex/Projects/AISTROYKA-release-closure` |
| Checked-out branch | `main` |
| Worktree HEAD | **`c600b7e6`** — "Merge PR #12 … platform-owner-cabinet" |
| HEAD age | Old (May 2026); `origin/main` is **452 commits ahead** at `5bfdc3b0` |

> The branch `main` here points at a stale commit `c600b7e6`, far behind `origin/main`. On top of that stale base, the working tree has 306 uncommitted changes.

## B. File count by category

Status codes: **174 deleted (D)**, **132 modified (M)**, 0 untracked. Net `+858 / −21754` lines.

| Category | Count | Notes |
|---|---|---|
| Web product src (`apps/web/app|components|lib|middleware`) | 162 | Largest block — dashboard/admin/public/auth/api routes |
| Other `apps/` (incl. tests/config) | ~19 | Within 181 total under `apps/` |
| iOS src (`ios/`) | 31 | Manager/Worker Swift views + localizations |
| Android src (`android/`) | 8 | build.gradle.kts, Compose, strings |
| Docs (`docs/`) | 71 | Audit/report docs |
| Scripts (`scripts/`) | 4 | incl. the duplicate-suffixed `(1)` files + `scan-secrets-history.sh` |
| i18n messages (`messages/*.json`) | 4 | en/ru/es/it |
| Supabase migrations | 3 | ⚠️ see risky files |
| Root config (`AGENTS.md`, `.gitignore`, `bun.lock`) | 3 | All differ from `origin/main` |
| maestro | 5 | mobile flow files |
| env/local/wrangler | ~1 | minimal |

## C. Top risky files

1. **`apps/web/supabase/migrations/*` (3 changed)** — migration churn on a stale base is the highest-risk item; could conflict with the reconciled remote migration history. Must not be applied or merged blindly.
2. **`apps/web/middleware.ts`** — tenant/auth/lite-allow-list gate; differs from `origin/main`. Divergent middleware is security-sensitive.
3. **`AGENTS.md`, `.gitignore`** — differ from `origin/main`; merging the stale version could regress durable rules / ignore patterns.
4. **174 deleted `apps/web` / `ios` source files** — many (e.g. `admin/operator/page.tsx`, `AdminProductControlCenterClient.tsx`) **still exist on `origin/main`**. The deletions are a **local-only divergent reduction**, not something main did — fast-forwarding or merging this state would risk dropping live files.
5. **`messages/en|ru|es|it.json`** — i18n bundles differ; partial edits could break `i18n:check` parity.

## D. Assessment of the changes

- **Not a stale mirror of main:** sampled modified files (`AGENTS.md`, `.gitignore`, `middleware.ts`, `messages/en.json`) all **differ from `origin/main`**, so the working tree is divergent content, not just an old copy waiting to fast-forward.
- **Mostly deletions vs an old base:** the −21754/+858 shape, with many deleted files still present on `origin/main`, looks like a **partial/experimental reduction or an abandoned in-progress state** layered on a May-era HEAD.
- **Provenance unknown:** cannot prove from git alone whether any of these 306 changes are unique/valuable or superseded by the 452 commits already on `origin/main`. Per safety policy → classify **dangerous/unknown; preserve; do not clean.**
- **Likely-ignorable:** none confidently — even the duplicate `(1)` scripts are deletions that should go through review, not silent loss.

## E. Recommended safe options (owner decides; none executed here)

In ascending risk, all reversible:

1. **Preserve via a new branch (safest):** from inside the worktree, `git switch -c salvage/main-worktree-2026-06-30` then `git add -A && git commit` to capture the 306 changes for review — **no data loss**, frees `main` to fast-forward afterward. (Requires owner go; involves a commit, so deferred.)
2. **Stash later:** `git stash push -u -m "main-worktree-dirty-2026-06-30"` to park changes recoverably (deferred — needs explicit instruction).
3. **Clean later:** only after the owner confirms the changes are superseded/worthless — `git restore`/`git checkout` to discard. Destructive; owner-gated.
4. **Abandon later:** if the entire `AISTROYKA-release-closure` worktree is obsolete, remove the worktree (clean it first) and let a fresh worktree track `origin/main`. Owner-gated.

> Recommended path: **Option 1 (salvage branch)** — preserves everything, then `main` can fast-forward to `5bfdc3b0` cleanly.

## F. Final verdict

- **SAFE_TO_FAST_FORWARD_MAIN_NOW: NO** — 306 uncommitted changes on a stale base would block/overwrite; ff is refused while the tree is dirty.
- **OWNER_ACTION_REQUIRED: YES** — owner must choose preserve (salvage branch) / stash / clean / abandon before local `main` can sync. `origin/main` @ `5bfdc3b0` remains the trusted pointer meanwhile.

### Not done (per hard rules)
No delete, reset, checkout-over-changes, stash, commit, merge, Slice 2, other-worktree access, or deploy. This audit produced only this report.
