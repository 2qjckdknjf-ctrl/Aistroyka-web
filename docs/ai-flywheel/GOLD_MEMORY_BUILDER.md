# Gold Memory Builder

**Script:** `scripts/ai/build-gold-memory.ts`

## Modes

| Flag | Behavior |
|------|----------|
| default | dry-run with fixture candidates |
| `--write` | persist rows (requires write flags + Supabase for `--live`) |
| `--live` | load from `ai_expert_reviews` / `ai_preference_pairs` |
| `--limit N` | cap candidates |
| `--task-type` | filter |
| `--tenant-id` | filter |
| `--source` | `expert_reviews`, `preference_pairs`, or `all` |

## Pipeline

1. Load candidate  
2. `trainingConsentFilter` / tenant consent  
3. PII scrub + verifier  
4. Finance dataset guard  
5. Input hash  
6. Embed (if write flag + provider)  
7. Upsert `ai_gold_memory`

## Dry-run output

```
candidates_scanned
consent_rejected
pii_rejected
finance_rejected
duplicate_skipped
embedding_skipped
eligible
written
```

## Write gate

Requires `AI_FLYWHEEL_ENABLED` + `AI_GOLD_MEMORY_ENABLED` + `AI_GOLD_MEMORY_WRITE_ENABLED=true`.
