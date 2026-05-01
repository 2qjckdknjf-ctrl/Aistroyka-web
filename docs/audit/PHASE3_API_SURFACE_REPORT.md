# Phase 3 — API Surface and Contract Report

Status: **CLOSED**
Date: 2026-05-01

## API Inventory Summary

- Total API route handlers (`route.ts`): **231**
- Canonical `/api/v1/*`: **204**
- Non-v1 (legacy/internal/compat): **27**
- System routes detected in both legacy and v1 namespaces.

## Classification

- Canonical public/protected API surface: `/api/v1/*`
- Legacy compatibility routes remain under `/api/*` and should be kept until explicit migration completion.
- Internal/system endpoints exist under:
  - `/api/system/*`
  - `/api/v1/system/*`
- Worker/sync/media mutating surface is substantial and actively covered by tests.

## Contract and Guard Validation (sampled high-risk routes)

- Worker routes use tenant context + `requireTenant`.
- Mutating worker/media/sync routes enforce body validation (`zod` contract schemas).
- Idempotency protection is present for critical lite/mobile mutating endpoints.
- `ctx.membership` type contract bug fixed in admin operator context route.

## Risks

- Legacy route breadth is still large; deprecation map should remain explicit.
- Full exhaustive static guard-lint across 231 routes is not automated in this pass.

## Closure Decision

- **Closed** for current stabilization: no unresolved P0/P1 API contract/type break found in validated path.
