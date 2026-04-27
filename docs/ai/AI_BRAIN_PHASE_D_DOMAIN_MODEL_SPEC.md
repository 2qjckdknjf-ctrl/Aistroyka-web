# AI Brain Phase D — Domain Model Spec

**Status:** Phase D  
**Date:** 2026-03-23

## A. AiRunRecord

- runId, tenantId, projectId, userId
- route, mode
- truthSnapshotRef, actionPlanRefs, memoryRefs
- outputContractType, degradedFlags
- executionTiming, validationResult
- createdAt

## B. AiFeedbackRecord

- feedbackId, runId
- sourceKind: human | system | test
- reviewerRole (optional)
- feedbackCategory
- factualityScore, usefulnessScore, safetyScore, roleFitScore, completenessScore
- comments, linkedRefs
- createdAt

## C. AiEvalCase

- caseId, title, scenarioType, mode
- requiredInputs, expectedAssertions
- gradingStrategy, tags
- active/inactive

## D. AiEvalResult

- evalRunId, caseId
- pass/fail/partial
- scores, graderOutput, warnings
- comparedVersionRefs
- createdAt

## E. AiImprovementCandidate

- candidateId
- source: feedback | eval | manual
- targetLayer: prompt | policy | planner | tooling | output | memory_retrieval
- rationale, expectedGain, risk, readiness
- reviewStatus
- linkedEvidenceRefs

## Rules

- Strong typing only
- Separate outcomes from interpretations
- Separate feedback from eval
- Candidates ≠ production changes
