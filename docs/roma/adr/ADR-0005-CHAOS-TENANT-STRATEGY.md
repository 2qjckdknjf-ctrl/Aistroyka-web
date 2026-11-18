# ADR-0005: Chaos Tenant Strategy

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** ROMA Architecture + Security Owner

---

## Context

ROMA Chaos (T3) injects faults in staging. Production and pilot tenants must never be chaos targets.

## Decision

### Environment rules

| Environment | Chaos allowed? | Target tenants |
|-------------|----------------|----------------|
| `local` | NO (default) | — |
| `staging` | YES (T3 only) | `roma-chaos-*` fixtures only |
| `pre-prod` | Council approval | Dedicated chaos fixtures |
| `prod` | **NEVER** | — |

### Test tenant requirements

Chaos fixtures MUST:

- Be tagged `roma-fixture-chaos-{id}` in tenant metadata or naming convention
- Contain **synthetic** projects only — no real pilot/customer data
- Be isolated from `pilot_owner` and `stakeholder_smoke` fixture tenants
- Be resettable via idempotent seed script before each T3 run
- Have separate Supabase RLS boundary (distinct `tenant_id`)

### Destructive vs non-destructive chaos

| Class | Examples | Data impact | Approval |
|-------|----------|-------------|----------|
| **Non-destructive** | AI provider timeout, 429 simulation, read-path latency | None persistent | T3 auto |
| **Destructive** | Partial write failure, sync cursor corruption simulation | Fixture tenant only | T3 + Security Owner sign-off |
| **Forbidden** | Cross-tenant probes, prod URL, service-role bulk delete | — | Blocked |

### Safe failure simulation

1. Acquire `staging_environment_lock` on chaos tenant before run.
2. ROMA DB and CHS never parallelize on same tenant (PAR-02).
3. Post-chaos: run fixture reset + DB consistency smoke.
4. All chaos findings tagged `environment: staging`, `tenant: roma-fixture-chaos-*`.
5. OBS correlates chaos window; alerts suppressed for known scenario IDs.

### Production tenant prohibition

- Chaos manifests reject `env_id: prod` at plan time (Core hard fail).
- No chaos scenario may reference production `tenant_id` or `aistroyka.ai` mutation paths.

## Consequences

- Stage 6 provisions dedicated chaos fixture tenant on staging.
- Chaos catalog entries reference tenant profile `chaos_fixture` only.

## Rationale

Prevents accidental pilot/customer data corruption while enabling resilience learning.
