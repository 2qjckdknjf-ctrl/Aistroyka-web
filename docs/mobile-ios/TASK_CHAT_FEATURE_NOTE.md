# Task Chat (Worker ↔ Manager)

**Date:** 2026-07-18
**Status:** Merged to `main` in PR #187 (media `size_bytes` list enrichment: PR #188)
**Scope:** Task-scoped chat with text, voice notes, photo, and video. No live calls.

## Surfaces

| Surface | Entry |
|---------|--------|
| Web dashboard | `/dashboard/tasks/[id]` — `TaskChatPanel` |
| iOS Worker | `TaskDetailView` — Shared `TaskChatView` |
| iOS Manager | `TaskDetailManagerView` — Shared `TaskChatView` |
| Android | API/RLS ready; UI deferred (P3) |

## Backend

- Migration: `apps/web/supabase/migrations/20260718120000_task_messages.sql`
- API:
  - `GET /api/v1/tasks/:id/messages`
  - `POST /api/v1/tasks/:id/messages`
  - `DELETE /api/v1/tasks/:id/messages/:messageId`
- Upload purpose: `task_chat` (MIME/size caps for image/voice/video)
- Push type: `task_message`
- Lite allow-list: messages paths for `ios_worker` / `android_worker`
- Realtime helper: `apps/web/lib/realtime/task-messages-realtime.ts`
- API contract: [`API-v1-ENDPOINTS.md#task-chat`](../API-v1-ENDPOINTS.md#task-chat)
- Push / offline ops: [`PUSH-NOTIFICATIONS.md`](../PUSH-NOTIFICATIONS.md), [`runbooks/MOBILE_OFFLINE_QUEUE.md`](../runbooks/MOBILE_OFFLINE_QUEUE.md)

## Audit

Closure audit: [`TASK_CHAT_AUDIT_2026-07-18.md`](./TASK_CHAT_AUDIT_2026-07-18.md)
Automated: 40 Vitest cases green (messages routes/service/media/cursor + push data map + lite allow-list).

## Staging smoke (manual)

1. Apply migration to project **AISTROYKA** (`vthfrxehrursfloevnlp`).
2. Manager (web or iOS): open assigned task → Chat → send text.
3. Worker (iOS): open same task → confirm message appears (poll ≤5s / Realtime on web).
4. Worker: send voice + photo; Manager: reply with video or text.
5. Soft-delete own message; confirm hidden for both.
6. Offline Worker: send text while offline → reconnect → message delivers via op queue.

## Non-goals (v1)

Live calls, DMs outside tasks, stakeholder chat, Android UI, AI thread summary.
