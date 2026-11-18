# AISTROYKA Release Hardening — Security Wave 6

Date: 2026-09-06
Dependency: canonical Auth/Worker forward-fix / PR #298
Tracking: #282
Legacy reference: #222

## Scope

Release hardening only. No product features, no deploy, no production/staging mutation.

This wave closes remaining direct-PostgREST cross-user, cross-project, viewer-write and wipe paths around idempotency, Copilot history, manager inboxes, plan-fit persistence, contractor directory, and stakeholder discussion entries.

## Confirmed current-main findings

- `idempotency_keys` still has authenticated `FOR ALL` tenant-reader access even though production idempotency callers use `getAdminClient()`.
- `ai_chat_threads` and `ai_chat_messages` are tenant-wide `FOR ALL`, allowing another internal tenant reader to enumerate/write/delete chat history outside the intended project/thread boundary.
- `manager_notifications` is tenant-reader `FOR ALL`, exposing other users' inbox rows and allowing viewer write/delete.
- `workspace_plan_state` / `plan_fit_recommendations` writes use reader cohort even though application routes require `canManageProjects` (member+).
- `tenant_contractor_profiles` is reader-cohort `FOR ALL`.
- stakeholder discussion entry INSERT permits any internal reader and does not bind the internal author to `auth.uid()`.

## Changes

Migration: `20260906121000_harden_idempotency_ai_chat_notifications_plan_directory.sql`.

### Idempotency

Authenticated policies are removed. Known production request paths already read/store keys with the server service-role client. This prevents direct forged cached responses, cache deletion and cross-user cache inspection.

### AI chat

Authenticated thread access now requires all of:
- internal tenant reader;
- `can_read_project_membership(tenant_id, project_id)`;
- same-tenant project;
- `created_by = auth.uid()`.

Thread create/update remains available to the thread owner for compatibility with the external `aistroyka-ai-chat` Edge function. Authenticated thread DELETE is removed.

Messages are readable/insertable only through a thread owned by the caller on a project they can read. Authenticated message UPDATE/DELETE is removed, keeping history append-only.

**Residual provenance note:** the external Edge function source is not present in this workspace, and the current streaming route historically writes assistant messages with the user-scoped client. Therefore Wave 6 does not yet restrict authenticated message INSERT to `role='user'`; doing so before all server/Edge assistant writers are proven service-role-backed could break Copilot. Cross-user/project/write/wipe isolation is closed here; assistant/system role provenance is tracked as a narrow follow-up.

### Manager notifications

- SELECT only own inbox row (`user_id = auth.uid()`) with internal tenant access.
- INSERT only writer cohort, only to a real internal recipient of the same tenant, and only with a same-tenant project link when present.
- UPDATE only own row.
- Trigger makes content/identity immutable for authenticated users, leaving `read_at` as the mutable field.
- No authenticated DELETE.

### Plan fit

Reader SELECT remains. Recommendation insert and selected-plan insert/update require `is_internal_tenant_writer_for_tenant`, matching member+ application authorization and excluding viewer. Recommendation rows remain append-only; no authenticated selected-plan DELETE.

### Contractor directory

Reader SELECT remains; INSERT/UPDATE/DELETE require writer cohort, excluding viewer direct writes.

### Stakeholder discussion entries

Internal INSERT requires project manager/owner scope, same-tenant project and `author_user_id = auth.uid()`. Portal INSERT requires active portal project scope, same-tenant project and the same author binding.

## Regression coverage

`apps/web/lib/tenant/idempotency-ai-chat-plan-directory-rls.hardening.test.ts`

Locks:
- no authenticated idempotency policy;
- own/project-scoped AI thread/message access and no history wipe policy;
- private notification inbox + constrained recipient + immutable content;
- reader/writer plan split;
- reader/writer contractor directory split;
- manager/portal discussion entry author binding.

## Validation gates

- clean Wave 6-only diff against PR #298;
- full main-based CI on exact cumulative stack through validation-only #288;
- no unresolved P0/P1 review findings;
- fresh staging/prod policy-name/schema reconciliation before migration apply;
- direct REST negative matrix by role;
- Copilot positive thread create/list/archive/send flow against staging before release;
- no production/staging migration apply in this PR.
