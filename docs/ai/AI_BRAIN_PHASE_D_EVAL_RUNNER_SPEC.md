# AI Brain Phase D — Eval Runner Spec

## Overview

The eval runner executes eval suites against AI Brain behavior in a controlled way. It supports targeted execution, structured results, version references, and degrades safely when live dependencies are unavailable.

## Design

- **Targeted execution** — Filter by mode, case IDs
- **Fixture fallback** — Use fixture outputs when live routes unavailable
- **Offline grading** — Pass pre-captured outputs for grading
- **Structured results** — pass/fail/partial, scores, warnings
- **Version capture** — Version refs stored with each result

## API

- `runEvalSuite(supabase, config)` — Runs eval suite, grades, records, returns summary

### Config

- `mode` — Filter cases by mode
- `caseIds` — Specific case IDs
- `useFixtures` — Use fixture outputs when no outputs provided
- `outputs` — Pre-captured outputs keyed by case id

## Grader

The minimal grader evaluates output against expected assertions:

- `schema` — Path exists and is object
- `contains` — Path exists
- `score` — Numeric score >= minScore
- `refusal` — withheld flag matches expected
- `degradation` — degradationFlags presence matches expected

Grading strategy: `strict` (any fail = fail), `lenient` (partial allowed).

## Result flow

1. Load cases from registry
2. For each case, get output (config.outputs, fixture, or skip)
3. Grade output via `gradeOutput(case, output)`
4. Record to ai_eval_results (when case has UUID from DB)
5. Return summary with pass/fail/partial/skipped counts

## Degradation

When no output available and useFixtures false: case marked partial/skipped with warning. No crash. When supabase null: results computed in-memory, no DB write.
