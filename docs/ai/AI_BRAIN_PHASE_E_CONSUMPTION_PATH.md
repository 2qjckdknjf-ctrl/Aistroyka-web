# AI Brain Phase E — Consumption Path

## Overview

Minimal backend consumption paths under `/api/v1/ai/optimizations/`. No route activates live optimization automatically.

## Routes

### POST /api/v1/ai/optimizations/proposals

Create optimization proposal from improvement candidate.

- **Body**: `{ candidateId }`
- **Response**: `{ data: { proposalId } }`

### POST /api/v1/ai/optimizations/experiments/run

Run optimization experiment.

- **Body**: `{ packageId, executionMode?, datasetRef? }`
- **Response**: `{ data: { experimentId, comparisonId } }`

### GET /api/v1/ai/optimizations/report

Report on proposals.

- **Query**: optional `reviewStatus`
- **Response**: `{ data: { proposals } }`

### GET /api/v1/ai/optimizations/candidates

List improvement candidates eligible for proposals.

- **Query**: optional `reviewStatus`
- **Response**: `{ data: { candidates } }`

## No Auto-Activation

All routes require explicit tenant auth. No route activates live optimization. Experiments run in sandbox/offline mode only.
