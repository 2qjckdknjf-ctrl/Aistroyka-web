# Release Hardening — Copilot Thread API

Date: 2026-09-06
Scope: existing-product release hardening only
Master tracker: #282

## Production finding

Read-only Supabase inspection of AISTROYKA production project `vthfrxehrursfloevnlp` returned no deployed Edge Functions.

The current web Copilot thread client still depended on:

`/functions/v1/aistroyka-ai-chat`

for thread list/detail/create/archive and the non-stream send fallback. The same missing Edge Function also backed `get_thread_summary` and `request_memory_refresh`.

Therefore thread history, Clear/New Thread, fallback behavior, and the visible `Refresh summary` UI depended on an endpoint that is not deployed in the production Supabase project.

## Existing contract recovered

Historical project documentation defines:
- thread history is per project and per user;
- thread status is `active | archived`;
- Clear means archive the current thread and create a new active thread;
- messages are immutable;
- thread/message storage remains in `ai_chat_threads` / `ai_chat_messages`.

## Live schema reconciliation

Production `ai_chat_threads` includes:
- id
- tenant_id
- project_id
- created_by
- title
- status
- last_message_at
- created_at
- updated_at

Production `ai_chat_messages` includes:
- id
- tenant_id
- project_id
- thread_id
- role
- content
- request_id
- error_kind
- created_at

There is no deployed thread-summary table in the current production schema. The historical `low_confidence` message column is also absent.

The replacement history reader therefore selects only live columns and normalizes `low_confidence=false` for the existing web view contract.

## Forward fix

Replace the undeployed Edge dependency with authenticated same-origin Next.js routes:

- `GET /api/v1/projects/:id/copilot/chat/threads`
- `POST /api/v1/projects/:id/copilot/chat/threads`
- `GET /api/v1/projects/:id/copilot/chat/threads/:threadId`
- `PATCH /api/v1/projects/:id/copilot/chat/threads/:threadId` with `status=archived`

Authorization:
- tenant context required;
- authenticated user required;
- existing `getProject` authorization repeated at the route;
- service queries include tenant_id, project_id and created_by;
- Wave 6 RLS remains the database backstop.

Message ordering:
- query newest first with limit;
- reverse selected rows before returning to preserve chronological UI order.

Transport:
- `chatApi.ts` no longer constructs `/functions/v1/aistroyka-ai-chat`;
- thread CRUD uses the same-origin Next API;
- send uses the existing same-origin stream route;
- no fallback to the missing Edge Function.

Broken summary surface:
- remove the only `useThreadSummary` hook consumer and hook file;
- remove `requestMemoryRefresh` usage and the visible `Refresh summary` button;
- do not fabricate a replacement summary endpoint because production has neither the Edge function nor backing summary state;
- existing stream memory injection and memory diagnostics remain intact.

## Validation correction

The first cumulative #302 run (#599) passed lint and then failed TypeScript because `useThreadSummary.ts` and `CopilotChatPanel.tsx` still imported Edge-only exports that had been removed from `chatApi.ts`. That exposed the summary/refresh dependency missed by the first usage audit.

The corrected forward fix removes the undeployed UI surface and adds a regression contract preventing it from returning accidentally.

## Tests

Added regression coverage for:
- own tenant/project/user list filters;
- newest-message bounded window with chronological return order;
- create thread ownership fields;
- archive-not-delete behavior;
- route project authorization and 404 handling;
- transport contract proving no old Edge Function dependency remains;
- no `useThreadSummary`, `requestMemoryRefresh`, or `Refresh summary` surface while no backend/state exists.

## Residual tracked separately

Wave 6 currently allows authenticated message INSERT without role provenance. The existing stream route writes assistant messages through the request-scoped Supabase client. A separate narrow follow-up must move trusted assistant persistence to service-role and then restrict authenticated message inserts to `role='user'`.

This residual is intentionally not mixed into the thread transport replacement because the stream handler is large and should be changed in an isolated, reviewable delta.

## Safety

- no production mutation
- no deploy
- no Supabase migration apply
- no new feature scope
- Draft PR only
- cumulative validation required before release
