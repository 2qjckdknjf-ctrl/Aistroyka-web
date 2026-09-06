# Release Hardening — Security Wave 10

Date: 2026-09-06
Scope: migration-order final-state reconciliation
Master tracker: #282

## Finding

Read-only release audit found that the SQL files were individually correct but their **timestamp order weakened the final applied policy state**.

`20260906092000_harden_viewer_project_jobs_estimate_writes.sql` correctly:
- restricted `projects` DELETE to tenant owner/admin;
- required `project_belongs_to_tenant(project_id, tenant_id)` for document/milestone INSERT and UPDATE.

Later, `20260906104000_project_write_authorization_hardening.sql` recreated the same policy names with generic tenant-writer checks. Because Supabase migration order is filename/timestamp order, the later definitions win.

Residual final-state regressions before Wave 10:
- tenant `member` could again reach direct PostgREST project DELETE;
- `project_documents` INSERT/UPDATE lost explicit project/tenant consistency;
- `project_milestones` INSERT/UPDATE lost explicit project/tenant consistency.

## Forward fix

Add the final ordered migration:

`20260906125000_reassert_project_write_scope_after_wave_ordering.sql`

It runs after Waves 9A/9B and reasserts the intended final state:
- project create/update: internal writer cohort;
- project delete: tenant owner/admin only;
- document/milestone insert/update: internal writer + project belongs to row tenant;
- document/milestone delete: internal writer cohort.

No older migration is rewritten. This keeps the stacked review history stable and makes the final state explicit.

## Regression coverage

`migration-final-project-write-ordering.hardening.test.ts` verifies:
- `092000 < 104000 < 125000` in lexical migration order;
- the earlier stronger policy and later generic overwrite are both detected;
- the final migration restores owner/admin-only project deletion;
- the final migration restores project/tenant consistency for document and milestone writes;
- delete behavior for documents/milestones remains in the intended writer cohort.

## Live database status

Read-only production reconciliation performed before this Wave found:
- live migration head: `20260831023354_user_identities_google`;
- 0/14 previous release-hardening candidate migrations present in live migration history;
- therefore none of these Draft hardening migrations has been applied to production.

Wave 10 adds one more unapplied candidate migration. No production mutation or migration apply occurred during this work.

## Safety

- Draft stacked PR only
- no merge
- no deploy
- no production mutation
- no migration apply
- intended for cumulative CI/iOS validation before any controlled database rollout
