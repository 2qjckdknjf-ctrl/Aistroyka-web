# Gold Memory Embedding Strategy

**Date:** 2026-06-17

## Current state

| Provider | Status |
|----------|--------|
| pgvector in repo migrations | **Not present** |
| Workers AI embedding | **Not present** |
| Dedicated embedding API route | **Not present** |
| OpenAI via `fetchWithOpenAiRetry` | **Used when configured** |

## MVP approach

1. **Disabled no-op embedder** — default; no blocking, no fake vectors  
2. **OpenAI `text-embedding-3-small`** — when `AI_GOLD_MEMORY_WRITE_ENABLED` + `OPENAI_API_KEY`  
3. **Storage** — `embedding_json jsonb` (float array); pgvector migration deferred  
4. **Retrieval** — in-app cosine similarity over tenant-filtered rows  

## Blocker handling

If embedding provider unavailable:

- Builder skips embedding (`embedding_skipped` counter)  
- Row may still be written without embedding  
- Retrieval returns `[]` when query embedding unavailable  
- Prompt injection unchanged (no examples)

## Not allowed

- Direct provider calls bypassing `fetchWithOpenAiRetry`  
- Hardcoded secrets  
- Logging raw text sent to embeddings  
- Blocking Copilot on embedding failure
