# ADR-0004: Foreman Role Mapping

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** ROMA Architecture + Product Engineering

---

## Context

ROMA principles list **foreman** as a persona. AISTROYKA tenant policy (`lib/tenant/tenant.policy.ts`) defines `owner > admin > member > viewer > stakeholder` — no distinct `foreman` DB role.

## Decision

### Canonical mapping

| ROMA persona | Primary DB role | Enterprise authz alias | Notes |
|--------------|-----------------|------------------------|-------|
| `pilot_foreman` | `admin` | MANAGER (when project-scoped) | Foreman = site lead with project management, not billing owner |
| Alternative (small crews) | `member` | MANAGER delegation via `project_members` | Use when foreman lacks tenant `admin` |

### ROMA test policy

1. **Default:** `pilot_foreman` profile uses a user with tenant role `admin` and project-level foreman duties (not `owner`).
2. **Negative tests:** foreman must **not** access owner-only surfaces (billing admin, tenant delete, platform owner).
3. **RBAC matrix (Stage 3):** foreman row = subset of manager row minus billing/platform actions.
4. **Manifest tag:** `persona: foreman` with `db_role: admin` metadata in finding records.

### Surfaces foreman must reach (YES expected)

- Dashboard projects, tasks, daily reports, worker visibility
- Report approval workflows
- Project-scoped documents and defects

### Surfaces foreman must not reach (NO expected)

- `/owner/*`, `/api/v1/owner/*`
- Tenant billing admin (unless also `owner`)
- Stakeholder-internal cost APIs
- Platform break-glass

## Consequences

- Credential profile `pilot_foreman` provisioned separately from `pilot_owner` (ADR-0003).
- Stage 3 RBAC matrix includes `foreman` column mapped per this ADR.

## Rationale

Preserves real-world persona without requiring schema migration. Foreman ≈ admin without company-owner powers.
