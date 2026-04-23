# AI Brain Phase E — Experiment Layer Spec

## Overview

Safely compare baseline vs candidate behavior. No live production auto-switching.

## Execution Modes

- sandbox — Isolated sandbox run
- offline — Offline replay
- replay — Replay against fixtures
- canary_simulation — Canary-readiness assessment (no actual canary)

## Flow

1. Create experiment from package
2. Run eval suite for baseline (useFixtures)
3. Run eval suite for candidate (useFixtures)
4. Compare scores, compute delta
5. Flag regressions (pass_rate_degraded, fail_count_increased)
6. Store comparison

## API

- `runOptimizationExperiment(supabase, packageId, executionMode, options)` — Runs comparison
- `createComparison(supabase, input)` — Store comparison result
- `getComparisonsByExperiment(supabase, experimentId)` — Fetch comparisons
