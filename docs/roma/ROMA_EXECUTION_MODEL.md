# ROMA — Execution Model

**Document ID:** ROMA-EXEC-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_ARCHITECTURE.md`

---

## 1. Purpose

Defines how ROMA runs are triggered, ordered, parallelized, and environment-scoped. Implementation-agnostic: describes behavior, not tools.

---

## 2. Execution Concepts

| Concept | Definition |
|---------|------------|
| **Run** | Single orchestrated QA execution with unique `run_id` |
| **Tier** | Depth/cost profile: T0 Smoke → T3 Chaos |
| **Manifest** | Subsystem-ordered work units for a run |
| **Profile** | Credential + fixture bundle for a persona |
| **Slice** | Verdict subdivision (e.g., WEB-public, IOS-LayerB) |
| **Skip** | Subsystem omitted with documented reason → UNKNOWN downstream |

---

## 3. Assurance Tiers

| Tier | Name | Max duration (target) | Subsystems (typical) | Triggers |
|------|------|----------------------|----------------------|----------|
| **T0** | Smoke | 10 min | SEC (partial), BCK health, WEB public, REL | Every staging/prod deploy |
| **T1** | Regression | 45 min | T0 + WEB auth, BCK contracts, A11Y core, PERF smoke | PR, nightly |
| **T2** | Deep audit | 3 hours | T1 + DB, AI, IOS UITest, AND instrumented, role matrix | Pre-release, weekly |
| **T3** | Resilience | 2 hours (staging) | T2 subset + CHS + OBS deep | Manual, major release |

*Rationale:* Tiers prevent every PR from running Layer B iOS + chaos while preserving deep proof before council.

---

## 4. Trigger Matrix

| Trigger | Default tier | Environment | Blocking? |
|---------|--------------|-------------|-----------|
| PR opened/sync | T1 (web-heavy) | CI ephemeral / staging optional | Advisory on PR; blocking only if council promotes |
| Merge to main | T0 | staging post-deploy | Yes (deploy chain) |
| Nightly schedule | T1–T2 | staging | No (alert on regression) |
| Manual council run | T2 | staging | Yes for release decision |
| Pre-prod promotion | T2 | staging + prod read-only probes | Yes |
| Post-incident validation | T2 targeted | staging | Council-defined |
| Mobile store submission | T2 mobile slice | staging + device | Owner-gated |

---

## 5. Environment Model

| Env ID | Description | Mutation allowed | ROMA tiers allowed |
|--------|-------------|------------------|-------------------|
| `local` | Developer workstation | Fixtures only | T0–T1 |
| `staging` | staging.aistroyka.ai | Fixture tenants | T0–T3 |
| `pre-prod` | Council-defined mirror | Read-mostly | T0–T2 |
| `prod` | aistroyka.ai | **Read-only probes only** | T0 subset, SEC headers, finance sanity |

### Environment descriptor (required fields)

```yaml
env_id: staging
base_url: https://staging.aistroyka.ai
build_stamp_sha: abc1234        # from /api/v1/health
supabase_project_ref: vthfrxehrursfloevnlp
credential_profiles: [pilot_owner, stakeholder_smoke]
mutation_policy: fixture_scoped
chaos_allowed: true
```

*Rationale:* Explicit descriptors prevent accidental prod mutation and undocumented UNKNOWN verdicts.

---

## 6. Credential Profiles

| Profile ID | Persona | Required for |
|------------|---------|--------------|
| `guest` | Unauthenticated | SEC, WEB public |
| `pilot_owner` | Contractor owner/admin | WEB dashboard, BCK, DB, AI |
| `pilot_manager` | Manager | Role matrix |
| `pilot_worker` | Worker / lite client | BCK worker routes, mobile |
| `stakeholder_smoke` | Client portal | SEC finance denylist, WEB portal |
| `platform_owner` | Platform grant | WEB owner, BCK owner API |
| `ops_metrics` | Bearer for ops routes | OBS, T0 smoke |

Missing profile → subsystem slices → **UNKNOWN** (not SKIP-as-PASS).

---

## 7. Canonical Execution Order (Full T2 Audit)

```
Phase A — Preparation
  A1. CORE: inventory sync + diff vs last run
  A2. CORE: resolve environment_descriptor + build_stamp proof
  A3. REL:  prereq gate (build integrity metadata if provided)

Phase B — Fast fail (parallel where noted)
  B1. SEC:  unauthenticated probes
  B2. BCK:  health + public API smoke     } parallel
  B3. WEB:  public routes (all locales T2)} parallel

Phase C — Authenticated core
  C1. CORE: load credential profiles (or mark UNKNOWN slices)
  C2. BCK:  authenticated contract sweep (tier-limited route sample)
  C3. DB:   CRUD + sync consistency
  C4. WEB:  dashboard + admin + portal (per profile)

Phase D — Mobile + AI (parallel)
  D1. IOS:  UITest smoke + Layer B if creds
  D2. AND:  instrumented + API chain      } parallel
  D3. AI:   provider probes + copilot SSE

Phase E — Quality attributes (parallel)
  E1. A11Y: critical path scan
  E2. PERF: budget comparison vs baseline  } parallel

Phase F — Advanced (optional T3)
  F1. CHS:  chaos scenarios (staging lock)
  F2. OBS:  correlate run window signals

Phase G — Closure
  G1. REL:  aggregate verdicts + PQS
  G2. LRN:  ingest run + update debt register
```

---

## 8. Parallelization Rules

| Rule ID | Rule |
|---------|------|
| PAR-01 | WEB, IOS, AND may parallelize after Phase C if fixtures use distinct tenants |
| PAR-02 | DB never parallelizes with CHS on same fixture tenant |
| PAR-03 | SEC unauthenticated probes parallel with WEB public |
| PAR-04 | AI provider probes serialize per project_fixture to avoid quota collision |
| PAR-05 | REL and LRN always sequential at end |

---

## 9. Skip and Degrade Semantics

| Condition | Subsystem behavior | Release impact |
|-----------|-------------------|----------------|
| Missing `pilot_owner` | WEB dashboard → UNKNOWN | DASHBOARD_READY = UNKNOWN |
| Missing `PILOT_E2E_*` in CI | WEB auth slices skipped | Council must accept or block |
| No physical iOS device | IOS Layer B → UNKNOWN | MOBILE_IOS deep = UNKNOWN |
| Android emulator unavailable | AND → UNKNOWN | MOBILE_AND = UNKNOWN |
| `live_provider_policy=require-live` fails | AI → NO | AI_READY = NO |
| Staging down | Run abort; REL = UNKNOWN | Deploy chain already failed |

---

## 10. Legacy Adapter Integration (Transitional)

Until ROMA implementation, existing assets map as **adapters**:

| Legacy asset | ROMA subsystem | Tier |
|--------------|------------------|------|
| `ci-check.yml` | REL prereq | T0 |
| `pilot-smoke.yml` | BCK + REL | T0 |
| `pilot-e2e-audit.yml` | WEB | T1 |
| `ios-ui-smoke.yml` | IOS | T1 |
| `ios-e2e-integration.yml` | IOS Layer B | T2 |
| `android-instrumented-smoke.yml` | AND | T2 |
| `ai_live_provider.sh` | AI | T0/T2 |
| `stakeholder_finance_sanity.sh` | SEC | T0 prod |
| `security_headers.sh` | SEC | T0 prod |
| Vitest `*.test.ts` | BCK + DB (unit) | T1 |
| `docs/qa/` pilot platform | WEB/BCK/SEC (partial) | T1 |

*Rationale:* Stage 1 ROMA wraps rather than replaces — reduces migration risk.

---

## 11. Failure Handling

| Failure type | Action |
|--------------|--------|
| Subsystem crash | CORE marks subsystem UNKNOWN; REL continues with gap |
| Flaky test (Learning known) | Quarantine per LRN register; does not block until TTL expires |
| Infra timeout | Retry once at CORE level; then UNKNOWN |
| R0 finding | Short-circuit REL → NO-GO; remaining subsystems may complete for evidence |

---

## 12. Run Identity and Reproducibility

Every run records:

- `run_id`, `tier`, `trigger`, `env_id`, `git_sha`, `build_stamp`, `inventory_hash`, `subsystem_versions{}`, `credential_profiles_requested[]`, `credential_profiles_resolved[]`, `started_at`, `completed_at`.

Reproducibility target: same SHA + env + tier + profiles → ≥95% manifest parity (flakes excluded via LRN).

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial execution model |
