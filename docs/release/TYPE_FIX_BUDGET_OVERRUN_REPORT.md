# Type fix: budget_overrun risk source — report

**Date:** 2025-03-15  
**Mission:** Fix Cloudflare production build failure caused by type mismatch for risk source `budget_overrun`.

## Root cause

The build error:

```text
./lib/ai-brain/services/cost-signals.service.ts:24:7
Type error: Type '"budget_overrun"' is not assignable to type '"overdue" | "missing_evidence" | "ai_analysis" | "delay" | "manual"'.
```

indicates that somewhere in the type flow, `RiskSignal.source` was being checked against a **narrower** union that did not include `budget_overrun` or `cost_pressure`. The canonical domain type in `apps/web/lib/ai-brain/domain/signals.types.ts` already listed both values in the inline union; the failure can stem from:

- A cached or alternate build path that saw an older type, or
- Type inference/narrowing elsewhere that did not see the full union.

To make the domain model explicit and future-proof, a single **canonical** type for risk source was introduced and all dependent behaviour was aligned with it.

## Canonical type(s) updated

1. **`RiskSignalSource`** (new)  
   - **File:** `apps/web/lib/ai-brain/domain/signals.types.ts`  
   - Explicit union of all allowed risk signal sources, including `budget_overrun` and `cost_pressure`, in alphabetical order for maintainability.

2. **`RiskSignal.source`**  
   - **File:** `apps/web/lib/ai-brain/domain/signals.types.ts`  
   - Now typed as `source: RiskSignalSource` instead of an inline union, so there is a single source of truth.

3. **Domain re-export**  
   - **File:** `apps/web/lib/ai-brain/domain/index.ts`  
   - `RiskSignalSource` is exported for use by services and any future schemas.

## All changed files

| File | Change |
|------|--------|
| `apps/web/lib/ai-brain/domain/signals.types.ts` | Added `RiskSignalSource` type; `RiskSignal.source` now uses it. |
| `apps/web/lib/ai-brain/domain/index.ts` | Exported `RiskSignalSource`. |
| `apps/web/lib/ai-brain/services/top-risks.service.ts` | Added contributing factors and recommended actions for `budget_overrun` and `cost_pressure`. |

No other files required edits: `cost-signals.service.ts` already used `"budget_overrun"` and `"cost_pressure"`; it imports `RiskSignal` from `../domain`, which now backs `source` with `RiskSignalSource`.

## Contracts / schemas

- **packages/contracts:** No risk-signal or risk-source types exist; no contract or zod schema changes were made.
- **apps/web:** No API DTO or zod schema narrows `RiskSignal.source`; the domain type is the only definition.

## Semantic consistency

- **Term:** `budget_overrun` is used for “actual exceeds planned” at project level; `cost_pressure` for near-budget (e.g. ≥90%) or per-item overrun. This matches the product docs (e.g. STEP13_COST_SIGNAL_MODEL.md).
- **Top risks:** `budget_overrun` and `cost_pressure` are now handled in:
  - Contributing factors (explanatory text),
  - Recommended actions (“Review budget and costs…” / “Monitor spend and review cost items…”).
- **Confidence:** Cost signals already set `resourceType` and `resourceId`, so they continue to receive “high” confidence in top-risk insights.
- **Display:** Components use `RiskSignalData` with `source: string`; no UI enum narrowing. No translation key changes were required.

## Validation commands run

```bash
bun run build:contracts
# Exit 0

npx tsc --noEmit   # from apps/web
# Exit 0

npx next build     # from apps/web
# Exit 0 (compiled successfully; lint and type check passed)
```

Full Cloudflare pipeline:

```bash
bun run build:contracts
bun run --cwd apps/web cf:build
```

should be run from repo root to confirm the OpenNext/Cloudflare build end-to-end (as in CI).

## Final result

- **TypeScript:** No error for `"budget_overrun"`; `RiskSignal.source` is consistently typed as `RiskSignalSource`.
- **Safety:** No `as any`, no unsafe casts, no suppression of type errors.
- **Domain:** Single canonical type (`RiskSignalSource`) for risk source; cost signal logic unchanged and fully supported in top-risks (factors + recommended actions).
- **Build:** `bun run build:contracts` and `npx tsc --noEmit` / `npx next build` in `apps/web` pass. Run `bun run --cwd apps/web cf:build` from repo root for full Cloudflare build verification.
