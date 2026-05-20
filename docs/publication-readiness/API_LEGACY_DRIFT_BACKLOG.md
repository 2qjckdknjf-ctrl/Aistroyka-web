# API Legacy Drift Backlog

## Purpose

Capture non-blocking API drift items that should be handled after publication-readiness close, without risky mass migration during final release hardening.

## P2 backlog items

1. Enumerate all legacy `/api/*` handlers and map to canonical `/api/v1/*` equivalents (full matrix).
2. Add automated coverage asserting deprecation headers across all intended legacy bridge endpoints.
3. Standardize error envelope wording for legacy vs v1 paths where still divergent.
4. Produce machine-readable route inventory snapshot (endpoint, auth mode, tenant scope, status).
5. Audit snake_case/camelCase payload parity for all mobile-consumed routes beyond worker/report/cost/doc/review critical paths.
6. Introduce route-level contract lint/check to prevent future accidental legacy-only additions.

## Out of scope for final release sprint

- Bulk route rewrites or wide namespace migrations without dedicated regression campaign.
- Breaking legacy endpoint removals before explicit compatibility sunset communication.

