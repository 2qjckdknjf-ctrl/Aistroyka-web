# Gold Memory Retrieval

**Module:** `gold-memory.retriever.ts`  
**Function:** `retrieveGoldMemoryExamples()`

## Inputs

- `tenant_id` (required)
- `task_type` (required)
- `audience` (required)
- `sanitized_input_json` or `sanitized_text`
- `limit` (default 3)
- `similarity_threshold` (default 0.72)

## Rules

- `AI_GOLD_MEMORY_READ_ENABLED=false` → `[]`
- No embedding provider → `[]`
- Tenant + task + audience filters always applied
- Owner/customer: only `finance_guard_passed=true` rows
- Inactive rows excluded
- No cross-tenant retrieval in MVP
- Failure → `[]`, caller continues

## Return shape

Safe examples only: scrubbed input/output, provenance, rationale, similarity score — no private source identifiers exposed to prompt layer beyond provenance label.
