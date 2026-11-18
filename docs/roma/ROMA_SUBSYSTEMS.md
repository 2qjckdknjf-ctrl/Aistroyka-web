# ROMA — Subsystems Specification

**Document ID:** ROMA-SUB-001  
**Version:** 1.0  
**Date:** 2026-07-03  
**Parent:** `ROMA_ARCHITECTURE.md`

---

## 1. Purpose

Defines every ROMA subsystem: boundaries, responsibilities, inputs, outputs, and dependencies. This is the authoritative reference for what each domain owns and what it must never own.

---

## 2. Subsystem Index

| Code | Name | Primary surfaces |
|------|------|------------------|
| CORE | ROMA Core | Orchestration, inventory |
| WEB | ROMA Web | Public site, dashboard, admin, portal, owner |
| IOS | ROMA iOS | AiStroykaManager, AiStroykaWorker |
| AND | ROMA Android | Android Manager, Android Worker |
| BCK | ROMA Backend | `/api/v1/*`, legacy API, middleware behavior |
| DB | ROMA Database | Supabase Postgres, RLS, sync reconciliation |
| AI | ROMA AI | Copilot, vision, transcribe, intelligence, help |
| SEC | ROMA Security | AuthZ, exposure, headers, leakage |
| A11Y | ROMA Accessibility | Web + mobile a11y |
| PERF | ROMA Performance | Web vitals, API latency, mobile launch |
| CHS | ROMA Chaos | Staging resilience |
| OBS | ROMA Observability | Logs, metrics, correlation |
| REL | ROMA Release | Verdict aggregation |
| LRN | ROMA Learning | Trends, debt, recommendations |

---

## 3. ROMA Core

### Responsibilities
- Maintain **system inventory** (routes, APIs, roles, AI entry points, mobile screens).  
- Schedule and coordinate subsystem runs by tier (T0–T3).  
- Manage run lifecycle: plan → execute → collect → verdict.  
- Enforce credential profiles and environment descriptors.  
- Store artifact bundle index per `run_id`.  
- Expose subsystem registry and contract versions.

### Owns
Orchestration DAG, inventory snapshots, run metadata, cross-subsystem correlation IDs.

### Does not own
Domain assertions, release council policy, product fixes.

### Inputs
| Input | Description |
|-------|-------------|
| `environment_descriptor` | URLs, platform targets, tier |
| `trigger_context` | PR, nightly, deploy, manual, council |
| `credential_profile_refs` | Secret store keys only |
| `inventory_snapshot` | Prior or fresh discovery |
| `subsystem_registry` | Enabled modules + versions |

### Outputs
| Output | Description |
|--------|-------------|
| `run_plan` | Ordered subsystem manifest |
| `run_id` | Global correlation |
| `artifact_index` | Paths to all subsystem artifacts |
| `execution_log` | Start/end, skip reasons |

### Dependencies
None (root). All subsystems depend on Core.

---

## 4. ROMA Web

### Responsibilities
Validate browser-based surfaces: public marketing, auth flows, dashboard, admin, portal, owner cabinet. Includes i18n (en/ru/es/it), responsive layout, SEO metadata, console hygiene, and role-appropriate navigation.

### Owns
Web user journeys, locale matrix, design/regression screenshots (web), public CTA and routing integrity.

### Does not own
Native mobile UI, raw API contract depth ( defers to BCK ), DB row-level proofs ( defers to DB ).

### Inputs
| Input | Description |
|-------|-------------|
| `base_url` | staging.aistroyka.ai, etc. |
| `locale_matrix` | Default + council-required locales |
| `viewport_matrix` | Desktop, tablet, mobile web |
| `persona_profiles` | Owner, manager, worker, stakeholder |
| `public_route_manifest` | From inventory |

### Outputs
| Output | Description |
|--------|-------------|
| `web_findings[]` | Normalized records |
| `web_verdict` | YES/NO/UNKNOWN per slice: public, dashboard, admin, portal |
| `screenshots`, `traces` | On failure (tier-dependent) |

### Dependencies
CORE (orchestration), BCK (API error correlation), SEC (auth redirect behavior).

---

## 5. ROMA Android

### Responsibilities
Assure Android Manager and Worker apps: build integrity, instrumented smoke, launch stability, FCM registration path, lite client API chain against live backend, localization resources.

### Owns
Android-specific binaries (AAB/APK metadata), Gradle test tasks, emulator/device matrix (Pixel, Samsung class devices).

### Does not own
iOS XCTest, web Playwright, server-side RLS proofs.

### Inputs
| Input | Description |
|-------|-------------|
| `android_build_ref` | versionCode, SHA, flavor |
| `device_profile` | Emulator / physical |
| `api_base_url` | Staging for Layer B |
| `lite_client_headers` | android_lite, android_worker |
| `signing_gate_status` | OWNER_ACTION vs READY (metadata only) |

### Outputs
| Output | Description |
|--------|-------------|
| `android_findings[]` | |
| `android_verdict` | Manager / Worker slices |
| `instrumented_test_report` | JUnit XML |

### Dependencies
CORE, BCK (mobile API chain), PERF (cold start optional).

*Rationale:* Android is thinner than iOS; ROMA AND emphasizes API-chain parity and instrumented smoke over deep UI coverage initially.

---

## 6. ROMA iOS

### Responsibilities
Assure iOS Manager and Worker: UITest smoke (simulator), Layer B live E2E against staging, pilot ID accessibility (`pilot_*`), archive metadata, ASC upload readiness signals (evidence only, no upload).

### Owns
Xcode test plans, simulator selection, iOS-specific permissions (camera, notifications).

### Does not own
Android tests, web E2E.

### Inputs
| Input | Description |
|-------|-------------|
| `ios_build_ref` | build number, bundle IDs |
| `simulator_udid` | CI or local |
| `e2e_credentials_file_ref` | Layer B gitignored creds |
| `IOS_E2E_BASE_URL` | staging default |

### Outputs
| Output | Description |
|--------|-------------|
| `ios_findings[]` | |
| `ios_verdict` | Manager / Worker / Layer-B slices |
| `xctest_results` | |

### Dependencies
CORE, BCK, scripts inventory (`ios/scripts/*` as future adapter sources).

---

## 7. ROMA Backend

### Responsibilities
Monitor and validate HTTP API behavior: status taxonomy (401/403/404/500), JSON validity, schema shape, deprecation headers, lite-client allow-list, latency, retry/duplicate patterns, contract drift vs inventory.

### Owns
API-level assertions, HAR-level summaries, OpenAPI/route contract registry (future).

### Does not own
UI layout, LLM response quality ( defers to AI ), SQL proofs ( defers to DB ).

### Inputs
| Input | Description |
|-------|-------------|
| `api_inventory` | 287+ routes |
| `auth_tokens` | Per persona |
| `lite_client_variants` | Header profiles |
| `deprecated_route_list` | From contracts package |

### Outputs
| Output | Description |
|--------|-------------|
| `backend_findings[]` | |
| `backend_verdict` | |
| `network_summary` | Error counts, slow endpoints |

### Dependencies
CORE. Feeds DB, SEC, AI, WEB.

---

## 8. ROMA Database

### Responsibilities
Validate data-layer integrity: CRUD round-trips, pagination/sort/filter, optimistic update behavior, sync bootstrap/changes/ack consistency, relationship integrity, deleted-record handling, tenant scoping.

### Owns
RLS assumption probes (via authenticated API + read-only SQL where approved), sync reconciliation scenarios, fixture lifecycle.

### Does not own
API transport errors (BCK), UI display of data (WEB).

### Inputs
| Input | Description |
|-------|-------------|
| `tenant_fixture_refs` | Isolated staging tenants |
| `project_fixture_id` | |
| `service_role_ref` | Staging only, council-gated |
| `sync_cursor_state` | Optional seed |

### Outputs
| Output | Description |
|--------|-------------|
| `database_findings[]` | |
| `database_verdict` | |
| `consistency_report` | CRUD/sync matrices |

### Dependencies
CORE, BCK. Must run after BCK smoke in full audits.

*Rationale:* DB tests mutate staging fixtures; require authenticated API path proven first.

---

## 9. ROMA AI

### Responsibilities
Validate AI runtime: streaming/cancellation, fallback detection, provider failures, context/memory behavior, conversation history, error surfaces, disabled states, eval harness hooks. Enforce **no tenant leakage**, **no prompt/raw exception leakage**.

### Owns
LIVE vs FALLBACK vs DISABLED classification, copilot SSE semantics, vision/transcribe path probes, AI governance policy alignment.

### Does not own
Business workflow UI (WEB), billing quota implementation (observes outcomes only).

### Inputs
| Input | Description |
|-------|-------------|
| `ai_entry_catalog` | 17+ v1 AI routes, project copilot |
| `project_fixture_id` | |
| `live_provider_policy` | require-live flag |
| `manager_persona_token` | |

### Outputs
| Output | Description |
|--------|-------------|
| `ai_findings[]` | |
| `ai_verdict` | LIVE / FALLBACK / UNKNOWN slices |
| `provider_evidence` | Headers, response excerpts (redacted) |

### Dependencies
CORE, BCK, SEC (leakage checks). Integrates existing `ai_live_provider.sh` as adapter.

---

## 10. ROMA Security

### Responsibilities
Adversarial and policy-oriented validation: unauthorized routes, missing auth, permission bypass attempts, sensitive endpoint exposure, client secret leakage, stack traces in responses, XSS indicators, CSRF/open-redirect weaknesses, broken RLS **signals** (via API, not exploitation).

### Owns
R0/R1 security findings, security header validation, stakeholder finance denylist enforcement (with WEB/BCK).

### Does not own
Functional happy-path journeys, performance tuning.

### Inputs
| Input | Description |
|-------|-------------|
| `sensitive_endpoint_list` | owner, admin, ops, debug, diag |
| `security_headers_policy` | CSP, HSTS, etc. |
| `finance_denylist` | Internal cost field names |
| `stakeholder_profile` | Dedicated smoke account |

### Outputs
| Output | Description |
|--------|-------------|
| `security_findings[]` | |
| `security_verdict` | |
| `posture_summary` | |

### Dependencies
CORE, BCK. Runs early in DAG (unauthenticated probes).

---

## 11. ROMA Accessibility

### Responsibilities
WCAG-oriented checks: headings, labels, keyboard navigation, ARIA, focus order, contrast sampling, screen reader compatibility indicators. Covers web and mobile shell screens.

### Owns
A11y rule catalog per surface, violation severity mapping.

### Does not own
Visual design approval, performance.

### Inputs
| Input | Description |
|-------|-------------|
| `page_screen_manifest` | Critical paths only at T1 |
| `wcag_target_level` | Default AA for public/dashboard |

### Outputs
| Output | Description |
|--------|-------------|
| `a11y_findings[]` | |
| `a11y_verdict` | |

### Dependencies
CORE, WEB (web pages), IOS/AND (native screens, future).

---

## 12. ROMA Performance

### Responsibilities
Measure and gate: first load, navigation timing, LCP/CLS (web), interaction delay, API p95, bundle size signals, mobile cold start, memory regression indicators.

### Owns
Budget definitions, trend series, regression detection vs baseline.

### Does not own
Security, functional correctness.

### Inputs
| Input | Description |
|-------|-------------|
| `budget_profile` | Council-approved ms thresholds |
| `baseline_run_id` | Optional comparison |
| `build_stamp` | |

### Outputs
| Output | Description |
|--------|-------------|
| `performance_findings[]` | |
| `performance_verdict` | |
| `metrics_report` | |

### Dependencies
CORE, WEB, BCK, IOS, AND (optional mobile timings).

---

## 13. ROMA Chaos

### Responsibilities
Controlled fault injection in **staging only**: provider timeout, AI circuit breaker, rate limits, partial API degradation, network partition simulation (where feasible). Validates graceful degradation and user-visible error quality.

### Owns
Chaos scenario catalog, blast-radius controls, rollback guarantees.

### Does not own
Production monitoring, functional regression (except degradation paths).

### Inputs
| Input | Description |
|-------|-------------|
| `chaos_scenario_id` | |
| `staging_environment_lock` | |
| `observability_hooks` | From OBS |

### Outputs
| Output | Description |
|--------|-------------|
| `chaos_findings[]` | |
| `chaos_verdict` | |
| `recovery_time_metrics` | |

### Dependencies
CORE, OBS, staging infra. **Never** depends on production.

*T3 tier only by default.*

---

## 14. ROMA Observability

### Responsibilities
Correlate QA run windows with runtime signals: Worker logs, Supabase slow queries (read-only), AI usage metrics, error rates, `buildStamp` alignment. Answers: "Did QA run against the intended deployment?"

### Owns
Correlation reports, deployment proof, signal gap detection.

### Does not own
Authoring tests, chaos injection.

### Inputs
| Input | Description |
|-------|-------------|
| `run_id`, `time_window` | |
| `health_endpoint` | `/api/v1/health` |
| `ops_metrics_auth_ref` | Optional |

### Outputs
| Output | Description |
|--------|-------------|
| `observability_findings[]` | |
| `deployment_proof` | SHA match YES/NO |
| `signal_correlation_report` | |

### Dependencies
CORE. Consumes artifacts from all subsystems. Runs late in DAG.

---

## 15. ROMA Release

### Responsibilities
Aggregate subsystem verdicts into **Release Readiness Verdict**, apply council thresholds, produce council brief, integrate existing gates (pilot-smoke, stakeholder finance, security headers, AI live).

### Owns
GO / CONDITIONAL GO / NO-GO / UNKNOWN states, PQS aggregation, blocking rule engine (configurable).

### Does not own
Individual test logic, product deployment.

### Inputs
| Input | Description |
|-------|-------------|
| `subsystem_verdicts{}` | All domains |
| `pqs_config` | Weights, UNKNOWN penalty |
| `council_threshold_profile` | |
| `legacy_gate_results` | pilot-smoke, ci-check, etc. |

### Outputs
| Output | Description |
|--------|-------------|
| `release_verdict` | |
| `council_brief_md` | |
| `release_verdict_json` | Machine consumption |

### Dependencies
All subsystems (verdicts), LRN (advisory trends).

---

## 16. ROMA Learning

### Responsibilities
Ingest all runs: flake detection, coverage debt tracking, untested inventory diff, recommendation generation, ADR suggestions, quarterly quality trends. Closes loop from failure → systemic improvement.

### Owns
Debt register, flake quarantine list, coverage trend DB (future), recommendation queue.

### Does not own
Blocking release (unless council promotes a learning item to gate).

### Inputs
| Input | Description |
|-------|-------------|
| `all_run_artifacts` | |
| `inventory_history` | |
| `verdict_history` | |

### Outputs
| Output | Description |
|--------|-------------|
| `learning_report` | |
| `debt_register_delta` | |
| `recommendations[]` | Prioritized |

### Dependencies
CORE (artifact index). Runs post-Release ingestion.

---

## 17. Cross-Subsystem Interaction Matrix

|  | CORE | WEB | IOS | AND | BCK | DB | AI | SEC | A11Y | PERF | CHS | OBS | REL | LRN |
|--|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **CORE** | — | drives | drives | drives | drives | drives | drives | drives | drives | drives | drives | drives | drives | feeds |
| **WEB** | reports | — | — | — | consumes | — | — | consumes | overlap | overlap | — | — | reports | feeds |
| **IOS** | reports | — | — | parallel | consumes | — | — | — | overlap | overlap | — | — | reports | feeds |
| **AND** | reports | — | parallel | — | consumes | — | — | — | overlap | overlap | — | — | reports | feeds |
| **BCK** | reports | feeds | feeds | feeds | — | feeds | feeds | feeds | — | feeds | target | feeds | reports | feeds |
| **DB** | reports | — | — | — | requires | — | — | feeds | — | — | — | — | reports | feeds |
| **AI** | reports | — | — | — | requires | — | — | feeds | — | — | target | feeds | reports | feeds |
| **SEC** | reports | feeds | — | — | requires | — | — | — | — | — | — | — | reports | feeds |
| **REL** | consumes | consumes | consumes | consumes | consumes | consumes | consumes | consumes | consumes | consumes | consumes | consumes | — | advisory |
| **LRN** | consumes | consumes | consumes | consumes | consumes | consumes | consumes | consumes | consumes | consumes | consumes | consumes | advisory | — |

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial subsystem specification |
