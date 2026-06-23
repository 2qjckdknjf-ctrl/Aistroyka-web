# Owner Approval Checklist — Branch Deletion Gate

**Date:** 2026-06-23  
**Use when:** Separate operator task proposes remote branch deletion (not this docs PR)

## Branch list review

- [ ] Exact branch names listed (no globs, no pattern deletes)
- [ ] Each branch classified in `02_BRANCH_CLASSIFICATION_2026-06-23.md`
- [ ] No open PR on any listed branch (`gh pr list --state open`)
- [ ] No active release dependency (tags, deploy workflows, runbooks)
- [ ] No unique commits needed for pending product work

## Backup / export

- [ ] Backup manifest file created under `docs/reconciliation/` with SHA, date, subject per branch
- [ ] Optional archive tag name recorded (if tags used)
- [ ] Backup stored before any `git push --delete`

## Safety gates

- [ ] Branch is not in `DO_NOT_MERGE_DANGEROUS` set unless explicitly waived with written rationale
- [ ] Branch is not `cursor/aistroyka-system-maturity-7957` unless forensic re-review completed
- [ ] No migration-bearing branch deleted without DB parity check
- [ ] Deletion commands reviewed line-by-line (remote + local)

## Process

- [ ] Deletion performed in **separate task** from product/docs PRs
- [ ] Protected merge process unchanged (`enforce_admins`, non-author APPROVED)
- [ ] Post-deletion comment on issue #117 with evidence
- [ ] `docs/CURRENT_PROJECT_TRUTH_INDEX.md` updated if stale-branch status changes

## Sign-off block (operator fills in separate task)

| Field | Value |
|-------|-------|
| Approver | |
| Date | |
| Branches approved for deletion | |
| Backup manifest path | |
| Deletion task / issue link | |

**Default if any box unchecked:** **DO NOT DELETE**
