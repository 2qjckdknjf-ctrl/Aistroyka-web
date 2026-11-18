# AISTROYKA Release Hardening — Security Wave 2

Date: 2026-09-06
Logical dependency: Security Wave 1 / PR #284
Tracking: #282

## Scope

No product features. This wave closes confirmed direct-PostgREST write bypasses still present on current `main` after app-layer authorization checks are bypassed.

## Confirmed current-main findings

### Viewer writes on project/documents/milestones — STILL_REPRODUCIBLE

`is_internal_tenant_reader_for_tenant` includes `viewer`, while current write policies for project-scoped tables use that reader helper. Direct REST therefore bypasses app-level manage checks.

Fix:
- reuse/define `is_internal_tenant_writer_for_tenant` excluding viewer;
- project INSERT/UPDATE use writer cohort;
- project DELETE restricted to tenant owner/admin;
- document/milestone writes require writer cohort and project/tenant consistency.

### Customer estimate approval forgery — STILL_REPRODUCIBLE

`customer_estimates_internal_write` is currently broad enough for internal readers to mutate commercial decision fields directly.

Fix:
- estimate/item writes require `can_manage_project_membership`;
- customer approval/rejection status/timestamps require a service-role-backed authorized app path;
- manager-side estimate actions reuse project-scoped client-request management authorization.

### Jobs lifecycle forgery — STILL_REPRODUCIBLE

Current jobs/job_events policies are broad membership policies. Authenticated clients can otherwise mutate queue status/payload directly.

Fix:
- split jobs read/insert/update policies;
- no authenticated DELETE policy;
- authenticated UPDATE guarded to terminal-job `dedupe_key` clearing only;
- job events split into read/insert with writer cohort for inserts.

## Regression coverage

- `lib/domain/customer-estimates/customer-estimates.service.test.ts`
- `lib/tenant/viewer-project-jobs-estimate-rls.hardening.test.ts`

## Dependency / review strategy

PR #285 is intentionally stacked on current Security Wave 1 head and should be reviewed as a delta against `release-hardening/security-wave-1`.

Do not merge #285 before #284 is accepted. After #284 is merged to `main`, rebase/retarget Wave 2 onto the resulting `main` and re-run all required CI/release gates on the exact resulting SHA.

If repository CI does not trigger for a non-`main` PR base, that is a validation limitation, not permission to merge #285 directly to `main`; exact-head validation must still be produced before merge.

## Required gates

- Clean Wave 2-only diff against Wave 1.
- CI green on exact final head SHA (or explicit documented CI-base limitation plus equivalent exact-head validation).
- No unresolved P0/P1 review findings.
- Verify current policy names/schema in staging before migration apply.
- Negative checks: viewer cannot mutate/delete project/doc/milestone; member/viewer cannot forge estimate approval; authenticated client cannot change job lifecycle fields.
- Positive checks: legitimate manager/owner estimate flow remains functional; legitimate enqueue/retry flow can clear terminal dedupe key.
- No production mutation in this PR.
