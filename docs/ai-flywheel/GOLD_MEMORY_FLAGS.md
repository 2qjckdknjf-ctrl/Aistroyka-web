# Gold Memory Feature Flags

**Date:** 2026-06-17  
**Default:** all **false**

## Flags

| Flag | Master gate | Default | Purpose |
|------|-------------|---------|---------|
| `AI_GOLD_MEMORY_ENABLED` | `AI_FLYWHEEL_ENABLED` | false | Master gold memory gate |
| `AI_GOLD_MEMORY_WRITE_ENABLED` | `AI_GOLD_MEMORY_ENABLED` | false | Allow embedding + DB write |
| `AI_GOLD_MEMORY_READ_ENABLED` | `AI_GOLD_MEMORY_ENABLED` | false | Allow retrieval queries |
| `AI_GOLD_MEMORY_PROMPT_INJECTION_ENABLED` | `AI_GOLD_MEMORY_ENABLED` | false | Inject few-shot section into Copilot stream |

## Behavior matrix

| Write | Read | Injection | Builder `--write` | Retrieval | Copilot prompt |
|-------|------|-----------|-------------------|-----------|----------------|
| off | off | off | dry-run only | `[]` | unchanged |
| on | off | off | writes rows | `[]` | unchanged |
| on | on | off | writes rows | examples | unchanged |
| on | on | on | writes rows | examples | sanitized section appended |

## Failure behavior

Any embedding, retrieval, or injection failure → safe metadata only; primary AI route continues without gold memory.

## Tests

- `gold-memory.flags.test.ts` — defaults + gate chain
- `gold-memory.prompt.test.ts` — prompt unchanged when flags false
