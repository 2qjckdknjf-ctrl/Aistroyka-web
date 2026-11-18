# Workspace reconciliation — 2026-10-04

Branch: `docs/workspace-reconciliation-2026-10-04`, based on current origin/main.

Goal: stop repeated implementation caused by stale local directories, obsolete open PRs and conflicting status pointers.

Scope: private local preservation, close only proven superseded PRs, reversible relocation of clean integrated temporary worktrees, current entry point and existing Dev OS task registry, read-only preflight guard. Product features, database apply, runtime deployment, store upload, billing changes and dirty-tree cleanup are outside this task.

Allowed: root operating docs, docs/dev-os, docs/tasks/handoff/agent-memory/reconciliation, two scripts/ops preflight files. No app code, workflows, migrations or secret files are committed.

Validation: byte-verified private archives; Git bundle verification; HEAD/status recheck before closing or relocating; preflight tests with real temporary repos; document links/CSV/head evidence; git diff --check; required remote CI check and current-head non-author approval for protected merge.

Completion: preservation, 20 proven superseded PR closures, 9 reversible clean worktree relocations, canonical checkout and entry points, one registry for all remaining PRs, protected docs/ops PR. Remaining product PRs and local salvage explicitly remain unfinished work.

Recovery: reopen closed PRs; move archived worktrees back using git worktree move; use private patches/files and bundle; revert this docs/ops PR through the protected path. Never overwrite a dirty checkout.

Final state: merged through #381 and context follow-up #383. Owner-requested recheck verified 46 archive hashes, two Git bundles, nine relocated paths/HEADs and 29 remote archive tags. Follow-up scope includes pointer/registry corrections and one CI step running the existing preflight safety tests; no product or deployment behavior changes.
