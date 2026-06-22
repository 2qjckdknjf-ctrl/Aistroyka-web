# Gold Memory Flags Verify

**Date:** 2026-06-17

## Production required state

All Gold Memory behavior **disabled** unless explicitly enabled via env.

| Flag | Code default | Wrangler/production env set? | Production effective |
|------|--------------|------------------------------|----------------------|
| `AI_FLYWHEEL_ENABLED` | false | **Not set** in wrangler.toml | **false** |
| `AI_GOLD_MEMORY_ENABLED` | false | **Not set** | **false** |
| `AI_GOLD_MEMORY_WRITE_ENABLED` | false | **Not set** | **false** |
| `AI_GOLD_MEMORY_READ_ENABLED` | false | **Not set** | **false** |
| `AI_GOLD_MEMORY_PROMPT_INJECTION_ENABLED` | false | **Not set** | **false** |

## Gate chain (code)

1. Sub-flags require `AI_GOLD_MEMORY_ENABLED`
2. `AI_GOLD_MEMORY_ENABLED` requires `AI_FLYWHEEL_ENABLED`
3. Prompt injection requires **both** read + injection flags
4. Unset env → falsy → disabled (`gold-memory.flags.ts`)

## Accidental enablement risk

**LOW** — no production env vars set; master + sub-flag chain; tests prove defaults false.

## Staging rollout plan (documented)

| Step | Flags | Purpose |
|------|-------|---------|
| 1 | none | Default safe |
| 2 | `AI_FLYWHEEL_ENABLED` + `AI_GOLD_MEMORY_ENABLED` + `AI_GOLD_MEMORY_WRITE_ENABLED` | Builder write smoke only |
| 3 | + `AI_GOLD_MEMORY_READ_ENABLED` | Retrieval smoke |
| 4 | + `AI_GOLD_MEMORY_PROMPT_INJECTION_ENABLED` | Copilot injection smoke |
| Kill switch | unset all / set master false | Instant disable |

## Kill switch

Unset any flag or set `AI_GOLD_MEMORY_ENABLED=false` → retrieval `[]`, prompt unchanged, Copilot normal.

Verified via `gold-memory.flags.test.ts`, `gold-memory.prompt.test.ts`, `gold-memory.retriever.test.ts`.
