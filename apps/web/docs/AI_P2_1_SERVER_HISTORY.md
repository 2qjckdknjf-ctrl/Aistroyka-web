# AI P2.1 — Server-side conversation history

**Scope:** DB storage for chat threads/messages, RLS, Edge API, web integration. P0/P1/P2 UX preserved.

---

## Where chat history lives

- **DB:** `ai_chat_threads` (per project, per user; status active/archived), `ai_chat_messages` (immutable).
- **Edge:** `aistroyka-ai-chat` (list_threads, get_thread, create_thread, archive_thread, send_chat_message).
- **Web:** Copilot tab uses server as source of truth; `useCopilotThread` fetches via chatApi, Clear = archive + create new thread.

---

## Schema (summary)

- **ai_chat_threads:** id, tenant_id, project_id, created_by, title, created_at, updated_at, last_message_at, status (active | archived).
- **ai_chat_messages:** id, tenant_id, project_id, thread_id, role (user | assistant | system), content, request_id, error_kind, low_confidence, groundedness_passed, retrieval_used, retrieval_count, retrieval_avg_similarity, fallback_reason, error_category, injection_detected, pii_detected, security_blocked, security_score, created_at.

Indexes: threads(project_id, updated_at desc), messages(thread_id, created_at asc), messages(project_id, created_at desc), messages(request_id).

---

## RLS

- **Threads:** SELECT/INSERT for project members (project_members); UPDATE/DELETE only for created_by = auth.uid().
- **Messages:** SELECT/INSERT for project members; no UPDATE/DELETE (immutable). Cross-check thread.tenant_id/project_id on insert.

---

## request_id and audit

- **Authoritative:** Edge returns X-Request-Id from copilot (or body.request_id); stored in ai_chat_messages.request_id.
- **Cross-audit:** ai_chat_messages.request_id links to ai_llm_logs.request_id and ai_security_events.request_id for tracing.

---

## Retention

- Do not delete messages; archive threads (status = 'archived') instead of delete. Clear chat in UI = archive current thread + create new active thread.

---

## Web flow

1. **Load:** list_threads(project_id) → pick first active thread → get_thread(thread_id) → show messages.
2. **Send:** send_chat_message(project_id, thread_id?, user_text, decision_context, locale) → Edge inserts user message, calls aistroyka-llm-copilot, inserts assistant message → client invalidates and refetches thread.
3. **Clear:** archive_thread(thread_id), create_thread(project_id) → set active thread to new id, refetch.

---

## Files

- **DB:** engine/Aistroyk/supabase/migrations/20260302195000_ai_chat_history.sql
- **Edge:** engine/Aistroyk/supabase/functions/aistroyka-ai-chat/index.ts
- **Web:** lib/features/ai/api/chatApi.ts, useCopilotThread.ts (server), storage.ts (draft only), CopilotChatPanel.tsx
