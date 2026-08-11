# Gold Memory Prompt Injection

**Date:** 2026-06-17  
**MVP route:** `POST /api/v1/projects/:id/copilot/chat/stream` only

## Activation

All must be true:

- `AI_GOLD_MEMORY_ENABLED`
- `AI_GOLD_MEMORY_READ_ENABLED`
- `AI_GOLD_MEMORY_PROMPT_INJECTION_ENABLED`

## Injection format

Appended to system context block:

```
Relevant sanitized examples from previous expert/manager corrections:
Example 1 (expert_review, score 0.91):
Input: {...}
Gold output: {...}
```

## Limits

- Max 3 examples  
- Max ~2400 chars total section  
- Scrubbed JSON only  
- Provenance labels included  

## Stream meta fields

- `gold_memory_used`
- `gold_memory_count`
- `gold_memory_task_type`
- `gold_memory_audience`
- `gold_memory_trimmed`
- `retrieval_failed`
- `retrieval_latency_ms`

## Failure

Retrieval/injection failure → original prompt unchanged; `retrieval_failed: true` in meta only.
