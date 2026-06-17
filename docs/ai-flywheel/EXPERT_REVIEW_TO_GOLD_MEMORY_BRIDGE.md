# Expert Review → Gold Memory Bridge

**Flag:** `AI_EXPERT_REVIEW_GOLD_MEMORY_BRIDGE_ENABLED` (default **false**)

When enabled on submit:

- Builds Gold Memory candidate from completed review  
- Calls `buildGoldMemoryFromCandidates` with `dryRun: true` unless `AI_GOLD_MEMORY_WRITE_ENABLED`  
- Consent still required for actual Gold Memory write  

**Dry-run command after reviews exist:**

```bash
bun scripts/ai/build-gold-memory.ts --dry-run --source expert_reviews --limit 10 --live
```

**Current:** CONSENT_EMPTY + DATA_SUPPLY_EMPTY (0 reviews, 0 consented tenants)
