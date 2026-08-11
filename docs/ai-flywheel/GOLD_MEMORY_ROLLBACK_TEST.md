# Gold Memory Rollback / Kill Switch Test

**Date:** 2026-06-17

## Test matrix

| Flag state | Retrieval | Prompt injection | Copilot impact |
|------------|-----------|------------------|----------------|
| all unset/false | `[]` | unchanged | normal |
| master false | `[]` | unchanged | normal |
| read false | `[]` | unchanged | normal |
| injection false | may retrieve internally | unchanged | normal |

## Verified by

- `gold-memory.flags.test.ts` — gate chain
- `gold-memory.retriever.test.ts` — read flag false → `[]`
- `gold-memory.prompt.test.ts` — flags false → context unchanged
- `behavior-safety.test.ts` — Copilot stream does not import master flywheel flags directly

## Kill switch procedure

1. Unset `AI_GOLD_MEMORY_PROMPT_INJECTION_ENABLED`
2. Unset `AI_GOLD_MEMORY_READ_ENABLED`
3. Unset `AI_GOLD_MEMORY_WRITE_ENABLED`
4. Unset `AI_GOLD_MEMORY_ENABLED` / `AI_FLYWHEEL_ENABLED`

**Result:** immediate disable; no user-facing error; no deploy required beyond env change.

## Verdict

**Rollback tested: YES** (via automated tests + documented kill switch)
