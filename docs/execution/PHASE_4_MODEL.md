# Phase 4 — Semantic Model (Truth Hardening)

**Date:** 2026-04-18  
**Stage:** B — Semantic Model

## Goal

Keep release truth binary and trustworthy:

- `green` means deployed artifact and post-deploy runtime contract are both valid,
- `red` means at least one contract is broken with explicit, actionable reason.

## Hardening model

1. **Primary auth path**  
   Use configured pilot bearer secret for `ops/metrics` smoke request.

2. **Fallback auth path**  
   On `401` from primary auth, mint fresh user JWT using smoke credentials + Supabase URL/anon key (if provided), then retry once.

3. **Deterministic outcome**
   - PASS only when smoke endpoints pass under primary or fallback path.
   - FAIL with explicit hints when both paths fail or required inputs are absent.

## Invariants

1. Tenant-scoped endpoints remain tenant-authenticated only.
2. No broadening of API auth policy to accommodate CI.
3. Recovery happens in smoke orchestration layer, not in domain endpoint authorization.

## Phase 4 slice closure criteria

1. `pilot_launch.sh` supports one-shot fallback retry after bearer `401`.
2. Reusable smoke workflow accepts optional fallback secrets.
3. Staging/production deploy workflows forward optional fallback secrets.
4. Syntax and local script validation pass.
