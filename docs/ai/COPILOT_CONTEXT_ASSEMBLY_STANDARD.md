# Copilot Context Assembly Standard

**Date:** 2026-03-19  
**Purpose:** Explainable context assembly for Brief and Chat Copilot; no magic.

---

## 1. Brief Copilot context

**Source:** Single request; no thread, no user/assistant history.

**Assembly:**

1. **buildCopilotContext** (copilot.context-builder) loads:
   - Snapshot (project state)
   - Health (from ai-brain)
   - Report signals, evidence signals, task signals, risk signals
   - Recommendations, executive summary
2. **applyBriefContextBudget** truncates string fields by BRIEF_FIELD_ORDER to fit maxTotalTokens (Brief-specific limits).
3. **buildPrompt** (copilot.prompt-builder) turns budgeted context + useCase into a single prompt string.
4. **Provider** receives one prompt; no separate system vs user; no history.

**Historical context:** None. Brief is stateless.

**Retrieval / memory:** None. No RAG, no memory chunks.

---

## 2. Chat Copilot context (stream route)

**Source:** POST body (user_text, decision_context, locale) + DB (ai_chat_messages for thread_id).

**Assembly:**

1. **Load messages:** Up to 20 recent messages for the thread (or [] if new thread).
2. **Split:**
   - `RECENT_KEEP = 5`: last 5 messages → **recentForContext** (full content in prompt).
   - Older messages → **olderMessages** → turned into a single string **historicalSummary** (truncated per message to 80 chars, joined with " | ").
3. **ChatContextInput:**
   - `summary`: historicalSummary (the inline older-messages summary)
   - `memoryChunks`: **[]** (no retrieval in this route)
   - `recentMessages`: recentForContext
   - `currentUserMessage`: userText
4. **applyContextBudget** (context-budget.ts):
   - Trims summary to maxSummaryTokens (500)
   - Takes up to maxMemoryChunks (10); currently 0 supplied
   - Trims recent messages to fit maxRecentMessagesTokens (2000)
   - Reserves space for current user message; total cap maxTotalTokens (8000)
5. **Prompt:**
   - System: "You are a construction project assistant..." + contextBlock (budgeted.summary + decision_context).
   - Then budgeted.recentMessages (role + content), then current user message.

**Historical context:** Yes — as **historicalSummary** built in-route from older messages (not from a separate thread_summary table or getThreadSummary API). So "historical context" in the stream = inline truncation of messages beyond the last 5.

**Retrieval / memory:** **Not integrated.** memoryChunks is always []. The type and budget logic support memory chunks, but no RAG or vector retrieval is called in the stream route. Strongest safe fallback: continue with summary + recent messages only; document limitation.

---

## 3. Thread summary (UI) vs stream context

- **getThreadSummary (Supabase function):** Returns a stored or computed summary for the thread. Used by the UI (CopilotChatPanel, "Thread summary" details). **Not** sent to the Next.js stream route. So the summary the user sees in the panel is not the same as the context the model sees.
- **Stream route historical context:** Built inside the route from olderMessages (slice + truncate). This is what the model actually gets as "earlier conversation."

**Intentional difference:** Until we unify backends or pass thread summary into the stream request, the two remain separate. Document and avoid implying they are the same.

---

## 4. Safe limits (current)

| Item | Limit | Notes |
|------|--------|--------|
| Summary (chat) | 500 tokens | historicalSummary trimmed to maxSummaryTokens |
| Memory chunks (chat) | 0 supplied, 10 max if used | No RAG in stream route |
| Recent messages (chat) | 5 kept, 2000 tokens total | Oldest-first trim |
| Total context (chat) | 8000 tokens | User message reserved |
| Brief | Brief-specific field order | applyBriefContextBudget |

---

## 5. Recommended practice

- **Context path:** Keep assembly in one place per path (Brief: context-builder + prompt-builder; Chat: stream route + context-budget). Do not add hidden context injection.
- **Historical context:** Chat stream uses inline historicalSummary only. If a stored thread summary is later passed in, it should be clearly named (e.g. stored_thread_summary) and composed with or instead of inline historicalSummary in a single, documented step.
- **Retrieval:** Do not enable memoryChunks in the stream route until a safe retrieval path (source, tenant isolation, cost) is defined and implemented. Document "memory_chunks empty" as the current standard.
