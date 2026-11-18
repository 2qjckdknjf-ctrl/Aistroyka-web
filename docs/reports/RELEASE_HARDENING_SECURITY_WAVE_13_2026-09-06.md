# Release Hardening — Security Wave 13

Date: 2026-09-06
Scope: worker report lifecycle and report evidence integrity
Master tracker: #282

## Confirmed live/candidate finding

Production live RLS currently allows internal tenant readers to INSERT/UPDATE/DELETE `worker_reports` and `worker_report_media`. Earlier release hardening changes that cohort to tenant writers, but still leaves every tenant `member` able to mutate all report fields directly through PostgREST.

That is materially broader than the application contract:

- Worker create: own report, initial `draft`.
- Worker submit/resubmit: own `draft|changes_requested -> submitted` only.
- Manager review: tenant owner/admin, or project manager for the report project; `submitted -> approved|rejected|changes_requested` only.
- Worker report media: only the report owner while status is `draft|changes_requested`.
- No supported report/media delete flow exists.

Without database enforcement, direct PostgREST can forge report approvals/rejections/reviewer identity, mutate another worker's report, delete reports/evidence, and attach evidence from another tenant.

## Production data preflight

Read-only checks before writing the migration:

- 127 existing reports;
- 0 cross-tenant `task_id` references;
- 0 cross-tenant `day_id` references;
- 0 task-assignment mismatches for report owners;
- 0 day-owner mismatches;
- 15 existing report-media links;
- 0 cross-tenant `media_id` links;
- **1 existing cross-tenant `upload_session_id` link**.

The migration does not delete or mutate that historical row. The tightened SELECT policy makes inconsistent evidence links inaccessible through normal RLS paths, and new INSERT policy prevents recurrence. Physical cleanup remains a separate controlled data-repair action.

## Forward fix

Migration `20260906130500_harden_worker_report_lifecycle_and_media.sql` adds:

1. Link/project-scope helpers for tenant consistency, worker assignment, and report-review authorization.
2. Worker report INSERT policy:
   - internal writer;
   - `user_id = auth.uid()`;
   - `status = draft`;
   - no submitted/review fields;
   - own worker day / assigned task links.
3. Scoped UPDATE RLS for report owner or authorized reviewer.
4. `enforce_worker_report_lifecycle` trigger:
   - immutable tenant/user/day/created identity fields;
   - Worker only `draft|changes_requested -> submitted`;
   - worker cannot change review fields;
   - submission time normalized server-side;
   - reviewer only `submitted -> approved|rejected|changes_requested`;
   - reviewer cannot change worker content;
   - review time/reviewer normalized from `auth.uid()`;
   - reject/changes-requested requires manager note.
5. No authenticated report DELETE policy.
6. Report media SELECT rejects cross-tenant media/session links.
7. Report media INSERT is own-report + editable-status only, with same-tenant media or own finalized `report_before|report_after` upload session.
8. No authenticated media UPDATE/DELETE policies.

## Compatibility

The transition model is derived directly from:

- `report.service.ts` ownership/submit gates;
- `report.repository.ts` create/submit/resubmit/updateReview writes;
- `GET/PATCH /api/v1/reports/:id` manager review authorization, including project-manager check for tenant members.

Existing report-reference preflight is clean, so the tenant/ref guard is not expected to strand current valid reports.

## Safety

- no production mutation
- no migration apply
- no deploy
- no feature scope
- stacked Draft PR only
- cumulative exact CI + mobile validation required before release
