# Dataset Export Dry Run

**Date:** 2026-06-17

## Script

`scripts/ai/export-dataset-dry-run.ts`

```bash
bun scripts/ai/export-dataset-dry-run.ts
bun scripts/ai/export-dataset-dry-run.ts --write-test-output /tmp/flywheel-test.jsonl
```

## Pipeline

1. Count candidates
2. Apply `trainingConsentFilter()` / `filterTenantsWithTrainingConsent()`
3. PII scrub + verifier (drop failures)
4. `financeDatasetGuard()`
5. Emit dry-run report

## Output

- **Default:** report to stdout only
- **`--write-test-output`:** writes scrubbed **fixture lines only** (no live tenant data)

## Never

- Include tenant data without consent
- Write production training JSONL unless explicit test flag with fixtures

## Library

`apps/web/lib/platform/ai-flywheel/export-dry-run.ts` — `runDatasetExportDryRun()`

## Tests

`export-dry-run.test.ts`:
- Consent false → zero eligible
- Consent true + PII → scrubbed
- Owner finance leakage → blocked
