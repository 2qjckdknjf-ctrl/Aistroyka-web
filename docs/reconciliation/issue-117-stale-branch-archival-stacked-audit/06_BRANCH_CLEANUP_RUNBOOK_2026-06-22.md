# Branch Cleanup Runbook

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Preconditions

Do not start cleanup until:

- PR #109 is merged.
- Updated `main` is fetched and validated.
- PR #109 head is contained in `main`.
- Issue #111-#117 audit branches are retargeted/rebased or intentionally left as evidence.
- Open PR heads are excluded.
- Operator approves the exact branch list.

## Safe Order

1. Generate fresh branch inventory from updated `main`.
2. Separate open PR branches.
3. Separate deferred-tail branches by issue.
4. Identify `ahead_main=0` contained branches.
5. Confirm no workflow references candidate branches.
6. Post candidate list to issue #117.
7. Wait for explicit operator approval.
8. Archive/delete only approved branches.
9. Re-fetch and verify deleted branches are gone.
10. Record final cleanup evidence.

## Rollback Notes

Branch deletion is reversible only if the commit SHA is known and retained. Before deletion:

- record branch name
- record full SHA
- record category and reason
- record related PR/issue

If a branch was deleted by mistake, recreate it from the recorded SHA and push normally, without force.

## Branch Protection Caveats

Do not delete protected branches or branches with active PRs.

Do not use force-push or history rewriting for cleanup.

Do not change branch protection rules as part of cleanup.

## Command Policy

This audit does not provide deletion commands. A future operator-approved cleanup task may include exact commands after the candidate list is approved.

## Runbook Verdict

Cleanup can be safe only after PR #109 merge, fresh inventory, and explicit branch-by-branch operator approval.
