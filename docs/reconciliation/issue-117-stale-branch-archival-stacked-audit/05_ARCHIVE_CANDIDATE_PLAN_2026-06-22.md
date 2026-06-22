# Archive Candidate Plan

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

No deletion is authorized by this plan.

## Likely Archive Candidates After PR #109 Merge

Candidate groups:

- branches already contained in `main`
- snapshot branches already contained in `main`
- docs/fix/chore branches with `ahead_main=0`
- superseded release/hotfix branches whose PRs are merged
- old duplicate refs that point to commits already reachable from `main`

Examples:

- `origin/snapshots/2026-03-*` and `origin/snapshots/2026-04-*` where contained
- `origin/develop` if no active workflow uses it
- old merged `docs/*`, `fix/*`, `chore/*`, `ops/*`, `release/*` branches with no unique commits
- `origin/cursor-test` if operator agrees it has no unique current work

## Require Operator Confirmation

Before archive/delete:

- confirm no open PR uses the branch
- confirm no workflow references the branch
- confirm no issue uses the branch as active evidence
- confirm branch is contained in `main` after PR #109 merge
- record deletion list in an issue comment
- get explicit operator approval

## Require Issue Linkage Before Archive

Do not archive until linked:

- AI branches to issue #111
- mobile branches to issue #112
- design branches to issue #113
- security branches to issue #114
- live/staging smoke branches to issue #115
- docs truth branches to issue #116

## Must Retain

Retain:

- `origin/main`
- PR #109 branch until merged and post-merge validation complete
- all open PR head branches
- all stacked audit branches until retarget/rebase decision
- all deferred-tail branches until their issue-specific plan completes
- final global audit branch

## Plan Verdict

Archive candidates exist, but branch deletion is not safe before PR #109 merges and explicit operator approval is recorded.
