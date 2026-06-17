# Expert Review Queue Git / CI Evidence

**Date:** 2026-06-17  
**Branch:** `ai/expert-review-queue-mvp`  
**Base:** `ai/gold-memory-mvp`

| Item | Value |
|------|-------|
| Branch | `ai/expert-review-queue-mvp` |
| Commit SHA | _pending push_ |
| CI Check run | _pending_ |
| Tests | 1621/1621 pass (local) |
| Lint | pass |
| i18n:check | pass |
| next build | pass |
| cf:build | pass |

## Migration

- `20260617160000_ai_expert_review_queue.sql` applied via Supabase MCP (AISTROYKA `vthfrxehrursfloevnlp`)

## Dry-runs

- `build-expert-review-queue.ts --dry-run`: 2 scanned, 1 eligible
- `build-gold-memory.ts --dry-run --source expert_reviews --limit 10`: pass
