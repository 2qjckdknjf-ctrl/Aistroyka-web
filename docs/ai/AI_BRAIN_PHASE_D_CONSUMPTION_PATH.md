# AI Brain Phase D — Consumption Path

## Overview

Minimal backend consumption paths for the Eval & Learning Layer. All under `/api/v1`.

## Routes

### POST /api/v1/ai/feedback

Submit structured feedback on an AI run.

- **Auth**: Tenant required
- **Body**: `runId`, `sourceKind`, `feedbackCategory`, optional scores (0–5), comments, linkedRefs
- **Response**: `{ data: { feedbackId } }`

### POST /api/v1/ai/evals/run

Run an eval suite.

- **Auth**: Tenant required
- **Body**: optional `mode`, `caseIds`, `useFixtures` (default true)
- **Response**: `{ data: { evalRunId, totalCases, passed, failed, partial, skipped, passRate, durationMs, results } }`

### GET /api/v1/ai/evals/report?evalRunId=...

Get report for an eval run.

- **Auth**: Tenant required
- **Query**: `evalRunId` required
- **Response**: `{ data: { evalRunId, total, passed, failed, partial, passRate, results } }`

### GET /api/v1/ai/improvements

List improvement candidates.

- **Auth**: Tenant required
- **Query**: optional `reviewStatus` (pending, approved, rejected)
- **Response**: `{ data: { candidates } }`

## Validation & Access

- All routes use `getTenantContextFromRequest` + `requireTenant`
- Strict validation on body/query params
- No exposure of unsafe internal internals
