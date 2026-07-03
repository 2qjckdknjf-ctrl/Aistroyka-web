# ADR-0003: Credential Profiles

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** ROMA Architecture + Platform Ops

---

## Context

ROMA role-realistic validation requires named credential profiles without secrets in repo.

## Decision

### Required test roles (personas)

| Profile ID | Persona | DB / grant role | Required for stages |
|------------|---------|-----------------|---------------------|
| `guest` | Unauthenticated | — | 0+ (SEC, WEB public) |
| `pilot_owner` | Contractor owner/admin | `owner` or `admin` | 1+ (dashboard, BCK, DB, AI) |
| `pilot_manager` | Manager | `admin` or enterprise MANAGER | 3+ (RBAC matrix) |
| `pilot_worker` | Field worker | `member` + lite headers | 3+ (worker API, mobile) |
| `pilot_foreman` | Foreman (see ADR-0004) | mapped role | 3+ (role matrix) |
| `stakeholder_smoke` | Client / portal | `stakeholder` | 2+ (finance isolation) |
| `platform_owner` | Platform operator | platform grant | 3+ (owner API — optional) |
| `ops_metrics` | Ops bearer | service token | 1+ (T0 smoke, OBS) |

### Environment variable names (references only — values never in repo)

| Profile | Env var names (staging/local) |
|---------|----------------------------|
| `pilot_owner` | `ROMA_OWNER_EMAIL`, `ROMA_OWNER_PASSWORD` (aliases: `E2E_EMAIL`, `E2E_PASSWORD`, `PILOT_E2E_*`) |
| `pilot_manager` | `ROMA_MANAGER_EMAIL`, `ROMA_MANAGER_PASSWORD` |
| `pilot_worker` | `ROMA_WORKER_EMAIL`, `ROMA_WORKER_PASSWORD` |
| `pilot_foreman` | `ROMA_FOREMAN_EMAIL`, `ROMA_FOREMAN_PASSWORD` |
| `stakeholder_smoke` | `STAKEHOLDER_SMOKE_EMAIL`, `STAKEHOLDER_SMOKE_PASSWORD` |
| `platform_owner` | `ROMA_PLATFORM_OWNER_EMAIL`, `ROMA_PLATFORM_OWNER_PASSWORD` |
| `ops_metrics` | `PILOT_SMOKE_BEARER` or `AUTH_HEADER` + `COOKIE` per `pilot_launch.sh` |

Template file (future): `docs/roma/profiles/.env.roma.example` (gitignored when copied).

### Staging vs local

| Environment | Profile source | Mutation |
|-------------|----------------|----------|
| `local` | Developer `.env.local` / `.env.roma` | Fixture tenants only |
| `staging` | GitHub Actions secrets + operator vault | Fixture tenants only |
| `prod` | Council-approved read-only probes only | **No mutation** |

### No-secrets-in-repo rule

- Profiles store **names** of env vars and secret manager keys only.
- `.env*`, `*.credentials`, `.p8`, service account JSON remain gitignored.
- ROMA reports redact email local-parts in public artifacts.

### Owner responsibility

| Asset | Owner |
|-------|-------|
| Profile naming + documentation | ROMA Architecture Owner |
| Staging secret provisioning | Platform Ops |
| `stakeholder_smoke` account | Security Owner (per `STAKEHOLDER_SMOKE_ACCOUNT_SETUP`) |
| `platform_owner` grant | Platform Owner (human) |
| CI secret rotation | Platform Ops + Release Council |

### Skip rules when credentials missing

| Condition | Behavior | Verdict impact |
|-----------|----------|----------------|
| Profile unresolved at run start | Subsystem slice `SKIPPED_WITH_REASON` | Domain → **UNKNOWN** |
| Partial profile set | Execute available slices only | Missing domains → UNKNOWN |
| Never substitute wrong persona | No "owner tests stakeholder" | Fail-closed |

## Consequences

- Stage 1 exit requires profile name table in operator runbook.
- Stage 2+ tests reference profile IDs, not raw emails in manifests.

## Rationale

Centralizes scattered `E2E_*`, `PILOT_E2E_*`, `STAKEHOLDER_SMOKE_*` under ROMA vocabulary.
