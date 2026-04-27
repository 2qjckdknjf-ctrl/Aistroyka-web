# AI Brain Phase D — Eval & Learning Layer Summary

## Overview

Phase D adds an Eval & Learning Layer on top of Phases A, B, and C. It enables structured recording of AI runs, feedback, eval cases, eval execution, version references, and improvement candidates—all non-autonomous and review-gated.

## Implemented

### Run Recording
- `AiRunRecord` type, `run.repository`, `run-recorder.service`
- Wired to `GET /api/v1/ai/project-brief` and `POST /api/v1/ai/action-plan`
- Fire-and-forget; does not block responses

### Feedback Layer
- `AiFeedbackRecord`, `CreateFeedbackInput`
- `feedback.repository`, `feedback.service`
- Validation for sourceKind, feedbackCategory, scores 0–5, linkedRefs
- `POST /api/v1/ai/feedback`

### Eval Case Registry
- `ai_eval_cases` table
- 8 seed cases (executive summary, project intelligence, manager/worker action drafts, client safety, memory, degradation, refusal)
- `listEvalCases()` with DB + in-memory fallback

### Eval Runner
- `runEvalSuite()`, `gradeOutput()`, fixture fallback
- `ai_eval_results` table
- `POST /api/v1/ai/evals/run`, `GET /api/v1/ai/evals/report`

### Version Refs
- `captureVersionRefs()` — prompt, policy, planner, tool_registry, output_contract, memory_retrieval, orchestrator
- Stored in run_records and eval_results

### Improvement Candidates
- `ai_improvement_candidates` table
- `createCandidate()`, `getCandidates()`, `candidateFromEvalFailure()`
- Review status: pending, approved, rejected
- `GET /api/v1/ai/improvements`

### Consumption Paths
- POST /api/v1/ai/feedback
- POST /api/v1/ai/evals/run
- GET /api/v1/ai/evals/report
- GET /api/v1/ai/improvements

### Telemetry
- phase_d_run_recorded, phase_d_feedback_recorded, phase_d_eval_run_complete, phase_d_eval_case_skipped, phase_d_candidate_created

## Non-Goals Preserved

- No autonomous production self-modification
- No auto-merge of prompt/policy changes
- No turning raw feedback into trusted truth automatically
- Improvement candidates are suggestions only

## Tests

- 28 Phase D tests (grader, feedback, version-refs, improvement, eval-runner)
- 82 total AI Brain tests passing

## Migrations

- `20260323130000_ai_eval_learning.sql` — tables
- `20260323130100_ai_eval_seed_cases.sql` — seed cases

## Docs Created

- AI_BRAIN_PHASE_D_DOMAIN_MODEL_SPEC.md
- AI_BRAIN_PHASE_D_RECONCILIATION_AUDIT.md
- AI_BRAIN_PHASE_D_RUN_RECORDING_SPEC.md
- AI_BRAIN_PHASE_D_FEEDBACK_SPEC.md
- AI_BRAIN_PHASE_D_EVAL_CASE_REGISTRY.md
- AI_BRAIN_PHASE_D_EVAL_RUNNER_SPEC.md
- AI_BRAIN_PHASE_D_VERSIONING_SPEC.md
- AI_BRAIN_PHASE_D_IMPROVEMENT_CANDIDATES.md
- AI_BRAIN_PHASE_D_CONSUMPTION_PATH.md
- AI_BRAIN_PHASE_D_TELEMETRY.md
- AI_BRAIN_PHASE_D_VALIDATION_REPORT.md
- AI_BRAIN_PHASE_D_POST_AUDIT.md
- AI_BRAIN_PHASE_D_SUMMARY.md
