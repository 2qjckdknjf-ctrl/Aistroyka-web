# Phase 1 — Runtime Matrix (Staging)

**Date:** 2026-04-18  
**Environment:** `https://staging.aistroyka.ai`  
**Actor context:** authenticated tenant user with role `admin` (from `/api/v1/me`).

## Scope

Validate live approvals loop transitions for reports:

1. `draft -> submitted -> changes_requested -> submitted -> approved`
2. `draft -> submitted -> rejected`

## Evidence Summary

- Flow A report id: `9d339325-c123-45a8-b347-10d205014dc1`
- Flow B report id: `6512c5fd-e03e-4eb1-b4be-6ef29433657b`
- Full raw evidence snapshot: `/tmp/phase1_runtime_matrix_staging.json`

## Flow A — Changes Requested -> Resubmit -> Approved

| Step | Endpoint | Result |
|---|---|---|
| Create draft report | `POST /api/v1/worker/report/create` | PASS |
| Create upload session | `POST /api/v1/media/upload-sessions` | PASS |
| Attach proof | `POST /api/v1/worker/report/add-media` | PASS (`ok:true`) |
| Submit | `POST /api/v1/worker/report/submit` | PASS (`status: queued`) |
| Request changes | `PATCH /api/v1/reports/{id}` with `changes_requested` | PASS |
| Resubmit | `POST /api/v1/worker/report/submit` | PASS (`status: queued`) |
| Approve | `PATCH /api/v1/reports/{id}` with `approved` | PASS |
| History check | `GET /api/v1/reports/{id}/approval-history` | PASS (`submit`, `review(changes_requested)`, `submit`, `review(approved)`) |

## Flow B — Rejected

| Step | Endpoint | Result |
|---|---|---|
| Create draft report | `POST /api/v1/worker/report/create` | PASS |
| Create upload session | `POST /api/v1/media/upload-sessions` | PASS |
| Attach proof | `POST /api/v1/worker/report/add-media` | PASS (`ok:true`) |
| Submit | `POST /api/v1/worker/report/submit` | PASS (`status: queued`) |
| Reject | `PATCH /api/v1/reports/{id}` with `rejected` | PASS |
| History check | `GET /api/v1/reports/{id}/approval-history` | PASS (`submit`, `review(rejected)`) |

## Verdict

- Runtime decision-loop matrix for Phase 1 report approvals: **PASS**.
