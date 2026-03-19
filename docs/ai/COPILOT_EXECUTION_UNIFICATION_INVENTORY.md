# Copilot Execution Unification — Inventory

**Date:** 2026-03-19  
**Scope:** Brief Copilot vs Chat Copilot execution paths, streaming, context, cancellation, and verification.

---

## 1. Brief Copilot execution path

| Step | Location | Description |
|------|----------|--------------|
| Entry | `GET /api/v1/projects/:id/copilot?useCase=...` | Single request; no stream. |
| Auth / project | route.ts | getTenantContextFromRequest, getProject; 401/403/404 on failure. |
| Orchestration | `lib/copilot/copilot.service.ts` → runCopilot | buildCopilotContext → applyBriefContextBudget → buildPrompt → provider.generateFromPrompt (sync) → parseCopilotOutput → toCopilotResponse. |
| Context | copilot.context-builder.buildCopilotContext | Snapshot, health, reportSignals, evidenceSignals, taskSignals, riskSignals, recommendations, executive (all from ai-brain services). No thread, no historical messages. |
| Budget | context-budget.applyBriefContextBudget | Truncates string fields to fit maxTotalTokens; BRIEF_FIELD_ORDER. |
| Provider | copilot.provider | createAdapterCopilotProvider(llmAdapter) or nullCopilotProvider; generateFromPrompt is non-streaming. |
| Fallback | copilot.fallback.deterministicFallback | When provider unavailable or throws; returns deterministic text per useCase. |
| Response | JSON `{ data: CopilotResponse }` | useCase, summary/managerBrief/executiveBrief/risks/missingEvidence/blockedTasks, at, source. |
| UI | CopilotSummaryPanel | useQuery fetches GET copilot?useCase=...; no AbortController; dropdown for useCase. |

**Persistence:** None. Brief is stateless per request.

**Cancellation:** Not applicable (single GET; no stream).

---

## 2. Chat Copilot execution path

| Step | Location | Description |
|------|----------|--------------|
| Entry | `POST /api/v1/projects/:id/copilot/chat/stream` | Body: thread_id?, user_text, decision_context, locale?. |
| Auth / project | stream/route.ts | Same as Brief. 503 when !isOpenAIConfigured(). |
| Thread / messages | stream/route.ts | If thread_id: load thread + recentMessages (ai_chat_messages, limit 20). Else: create thread (ai_chat_threads), recentMessages = []. |
| User message persist | stream/route.ts | insert ai_chat_messages (user, content: userText) before streaming. |
| Historical context | stream/route.ts | RECENT_KEEP = 5; olderMessages = messages.slice(0, -5); recentForContext = last 5; historicalSummary = truncated string of olderMessages (not from a separate thread_summary table). |
| Memory chunks | stream/route.ts | contextInput.memoryChunks = [] (always empty). applyContextBudget supports them but none are supplied. |
| Context budget | context-budget.applyContextBudget | summary (historicalSummary), memoryChunks, recentMessages, currentUserMessage → budgeted. |
| System prompt | stream/route.ts | "You are a construction project assistant..."; contextBlock = budgeted.summary + decision_context. openaiMessages = [system, ...recentMessages, user]. |
| Stream | stream/route.ts | ReadableStream; meta event; fetch(OpenAI, stream: true, signal: abortCtrl.signal); request.signal?.addEventListener("abort", () => abortCtrl.abort()); token events; then persist assistant message, update thread, send done. On catch: send error (cancellation/timeout/unknown), optionally persist error assistant message. |
| UI | CopilotChatPanel | useCopilotThread → sendMessageMutation with signal (AbortController) and onToken; handleCancel aborts controller. Cancel button when isPending. |

**Persistence:** ai_chat_threads, ai_chat_messages (tenant_id, project_id, thread_id). User message persisted before stream; assistant message persisted after stream completes (or error message on failure).

**Cancellation:** Client: AbortController passed to sendChatMessageStream(..., signal). Server: request.signal aborts abortCtrl → OpenAI fetch aborted → stream catch → send("error", kind: "cancelled"), persist error assistant message, controller.close().

---

## 3. What is shared

- **Auth / tenant / project:** Same getTenantContextFromRequest, getProject in both routes.
- **Context budget types:** ContextBudgetConfig, estimateTokens, truncateToTokens, ContextBudgetMeta (context_tokens_estimated, context_trim_applied, memory_used, memory_chunks_count, summary_used). Chat uses applyContextBudget; Brief uses applyBriefContextBudget.
- **Observability:** ai-telemetry (logCopilotNonStreamComplete, logCopilotStreamLifecycle, logCopilotStreamComplete, logCopilotStreamError), emitAiRuntimeAudit.
- **Request id:** X-Request-Id generated or forwarded in both.

---

## 4. What is split

- **Context assembly:** Brief = buildCopilotContext (brain-only; no thread). Chat = decision_context + historicalSummary (from older messages) + recentMessages (last 5) + current user; no brain snapshot in stream path (only decision_context).
- **Provider:** Brief uses runCopilot → ICopilotProvider (OpenAI adapter or null). Chat stream route calls OpenAI fetch directly (no copilot.service).
- **Thread CRUD (list/get/create/archive):** chatApi (listThreads, getThread, createThread, archiveThread) calls **Supabase function** `aistroyka-ai-chat`. Stream route uses **Next.js** and **Supabase client** to read/write ai_chat_threads and ai_chat_messages. So thread listing comes from Edge function; stream creates/updates threads in same DB via Next.js. Consistency relies on same Supabase project.
- **Thread summary in UI:** useThreadSummary → getThreadSummary(threadId) → Supabase function. This summary is **not** sent to the stream route; stream route builds its own historicalSummary from raw messages. So "Thread summary" in the UI is display-only from another backend.
- **Memory/retrieval:** Stream route passes memoryChunks: [] and summary from historicalSummary only. No RAG/vector retrieval in stream route. chatApi types (SendChatMessageResult) have memory_summary_used, memory_chunks_count for compatibility with a different backend (Edge function send_chat_message); stream response does not set these on the client-visible result when using sendChatMessageStream (client gets ok, thread_id, request_id, assistant_content, etc. from onDone callback, not from a response body).

---

## 5. Current risks / confusion

- **Two backends for chat:** Thread list/get/create/archive via Supabase function; send message via Next.js stream route. Developers must know which endpoint does what.
- **Thread summary not in stream context:** Stored thread summary (get_thread_summary) is not injected into the stream request; stream uses inline truncation of older messages. So "thread summary" in UI and "historical context" in stream are different things.
- **Memory chunks always empty:** applyContextBudget is ready for memoryChunks but stream route never supplies any; retrieval/RAG is not integrated in this route.
- **Brief has no cancellation:** Brief is a single GET; no AbortController. If user navigates away, in-flight request still completes (acceptable).
- **Cancel and persistence:** On cancel, stream route sends error event and can persist an error assistant message; client clears streamingContent. Thread invalidation happens only on successful completion (onSuccess). So after cancel, thread might show the user message but no assistant message until next send or refetch.

---

## 6. Priority and recommended closure actions

| Priority | Item | Action |
|----------|------|--------|
| P0 | Document context assembly (Brief vs Chat) | Create COPILOT_CONTEXT_ASSEMBLY_STANDARD.md. |
| P0 | Document cancellation end-to-end | Create COPILOT_CANCELLATION_MODEL.md. |
| P0 | Document streaming verification | Create COPILOT_STREAMING_VERIFICATION.md. |
| P1 | Unify naming and conventions where minimal | Create COPILOT_SURFACE_UNIFICATION.md; align wording Brief vs Chat. |
| P1 | Clarify historical_context vs thread summary | In docs: stream uses inline historicalSummary; getThreadSummary is separate and not fed into stream. |
| P2 | Memory/retrieval | Document "memory_chunks empty; no RAG in stream route" as current state; no new retrieval without product decision. |
