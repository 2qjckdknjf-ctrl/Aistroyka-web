# Gold Memory Observability

**Module:** `gold-memory.observability.ts`

## Allowed metadata

- `request_id`
- `tenant_id` (existing audit patterns only)
- `task_type`
- `audience`
- `gold_memory_used`
- `gold_memory_count`
- `retrieval_latency_ms`
- `retrieval_failed`
- `gold_memory_trimmed`
- `build_sha7` (when env present)

## Not logged

- Raw prompt text  
- Raw user messages  
- Raw gold example content  
- PII  
- Secrets  
- Provider payloads  

## Copilot stream

Gold memory meta merged into SSE `meta` event via `goldMemoryMetaForStreamMeta()`.
