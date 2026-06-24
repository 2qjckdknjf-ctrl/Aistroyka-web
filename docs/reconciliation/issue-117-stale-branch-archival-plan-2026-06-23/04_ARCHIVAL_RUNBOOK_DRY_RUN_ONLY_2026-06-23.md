# Archival Runbook — Dry-Run Only

**Date:** 2026-06-23  
**Status:** Planning only — **no deletion in this PR or runbook execution**

## Purpose

Define the **future** procedure for stale branch cleanup after owner approval. This runbook is dry-run documentation only.

## Preconditions (all required)

- [ ] This plan merged to `main`
- [ ] Owner reviewed exact branch list in `02_BRANCH_CLASSIFICATION_2026-06-23.md`
- [ ] Owner signed `05_OWNER_APPROVAL_CHECKLIST_2026-06-23.md`
- [ ] Separate operator task opened (not bundled with product PRs)
- [ ] `docs/CURRENT_PROJECT_TRUTH_INDEX.md` updated if runtime/status claims change

## Dry-run procedure

### Step 1 — Verify no open PR

```bash
gh pr list --repo 2qjckdknjf-ctrl/Aistroyka-web --state open --head <branch>
```

**Stop** if any open PR references the branch.

### Step 2 — Verify merged/contained in main

```bash
git fetch origin main
git branch -r --merged origin/main | grep '<branch>'
git log origin/main..origin/<branch> --oneline
```

**Stop** if unique commits exist that are still needed (see `NEEDS_MANUAL_REVIEW`).

### Step 3 — Create backup export list

Before any deletion:

```bash
git fetch origin <branch>
git log -1 --format='%H %ci %s' origin/<branch> >> docs/reconciliation/branch-deletion-backup-YYYY-MM-DD.txt
git tag archive/<branch>-$(date +%Y%m%d) origin/<branch>   # operator task only; requires explicit approval
```

Record tag name and SHA in the backup manifest. **Do not push tags** without owner approval.

### Step 4 — Owner approves exact branch list

Owner must approve a **named list** (copy from classification table). No wildcard deletes.

### Step 5 — Deletion (separate operator task only)

Example command shape ( **NOT executed in this plan** ):

```bash
# FORBIDDEN until Steps 1–4 complete and separate task approved
# git push origin --delete <branch>
```

Local branch cleanup (optional, separate task):

```bash
# git branch -d <branch>   # only after remote deletion approved
```

### Step 6 — Post-deletion verification

```bash
git fetch --prune origin
git branch -r | grep '<branch>' && echo 'STILL EXISTS' || echo 'removed from remote'
```

Update issue #117 or closure comment with exact deleted branches and backup tag manifest.

## Explicit prohibitions

- Never delete from this docs PR
- Never run `git push origin --delete` without owner checklist
- Never delete `main`, open-PR branches, or `DO_NOT_MERGE_DANGEROUS` branches without architecture review
- Never delete `DELETE_NEVER_WITHOUT_BACKUP` branches without export/tag evidence
