# ROMA Platform Gap Analysis

**Program:** ROMA Platform Integration  
**Phase:** 5 — gap analysis (analysis only)  
**Date:** 2026-07-07

Related: [ROMA_PLATFORM_INVENTORY.md](./ROMA_PLATFORM_INVENTORY.md) · [ROMA_PLATFORM_MODEL.md](./ROMA_PLATFORM_MODEL.md)

---

## Executive Summary

ROMA already observes **14 of 22** subsystems partially via live probes. **6 subsystems** report **UNKNOWN** in operations view. **5 platform API groups** exist but are **not wired** into ROMA. Primary integration gap: **fragmented owner navigation** and **missing business/ops signals** — not missing probe infrastructure.

---

## Phase 2 — Data Source Audit

### Per-Subsystem Source Matrix

| Subsystem | Current source | Duplicate source? | Unavailable | Missing | Unknown |
|-----------|---------------|-------------------|-------------|---------|---------|
| web-public | `core_health` probe | No | CWV, locale matrix | Route smoke | — |
| web-dashboard | Derived component | Overlaps DB probe | E2E status | Role-flow health | — |
| web-platform-admin | None in ROMA | — | Shell health | Session/grant probe | Partial |
| backend-api | `core_health` | Overlaps system health DB | Latency/errors | Contract audit | — |
| backend-system-health | `system_health` | DB checked twice (health + system) | **Yes** — duplicate DB touch | Job queue depth | workflows/events stubbed OK |
| supabase-database | health + migrations | health.db + migration both hit DB | Pool metrics | RLS drift | — |
| supabase-auth | Derived from health | — | Provider matrix | Auth flow smoke | — |
| supabase-storage | `probeStorage` | No | Upload metrics | Policy audit | — |
| cloudflare-edge | external health fetch | buildStamp in health + CF probe | Workers API | DNS inventory | local dev skips external |
| cloudflare-access | Manual doc only | — | **Entirely unavailable** to ROMA | Read-only CF Access audit | **YES** |
| ai-runtime | config + system health | ai in probe + systemHealth.ai_brain | Live LLM proof | Fallback telemetry | — |
| notifications | release-env flags | No | Delivery metrics | outbox depth | push send untested |
| billing | billing diagnostics | No | Webhook live test | Entitlement drift in ROMA | — |
| ios-manager | env metadata only | — | TestFlight/UITest | Store gate | **YES** |
| ios-worker | env metadata only | — | Device smoke | Sync health | **YES** |
| android-manager | env metadata only | — | Play status | Build smoke | **YES** |
| android-worker | env metadata only | — | FCM smoke | Play upload | **YES** |
| release-pipeline | git + release env | buildStamp triple (health/git/CF) | GHA API | Promotion gate | — |
| security-platform | release + audit | No | RBAC automation | Header smoke | — |
| security-tenant-isolation | None | — | **Entirely unavailable** | Isolation audit | **YES** |
| integrations-external | billing partial | — | Telegram reachability | Webhook backlog | — |
| platform-operations | None in ROMA | — | overview API unwired | support KPIs | **YES** |

### Duplicate Probes (Consolidate in integration — not yet done)

| Duplication | Locations | Recommendation |
|-------------|-----------|----------------|
| Database reachability | `probeHealth`, `probeSystemHealth`, `buildSystemComponents` | Single probe field referenced by all consumers |
| Build stamp / SHA | health, gitMetadata, cloudflare external | One canonical `deployIdentity` derived object |
| AI configured | probeAi, systemHealth.ai_brain/copilot | Reference probeAi only in registry |
| Notification config | releaseEnv.push + notifications component | Keep releaseEnv as source |

### Stale Probe Risks

| Probe | Stale when | Mitigation |
|-------|-----------|------------|
| `mobile_metadata` | Env vars set but store lagging | Wire CI artifact timestamps |
| `github_actions_env` | Absent outside GHA runtime | Mark UNKNOWN locally (already implicit) |
| `cloudflare_deploy` | External health cached at edge | Compare SHA drift rule (already in recommendations) |

### Manual-Only Areas

| Area | Manual source |
|------|---------------|
| Cloudflare Access policy | Security audit scripts + docs |
| Mobile store readiness | Owner checklists, TestFlight/Play consoles |
| Owner golden path E2E | Playwright with owner creds |
| Live AI provider | `scripts/smoke/ai_live_provider.sh` |

---

## Missing Integrations (ROMA ← Platform)

| Integration | API / Service | Priority | Effort |
|-------------|---------------|----------|--------|
| Tenant/support overview KPIs | `GET /api/v1/platform/overview` | **Critical** | Small |
| Platform shell nav unification | `shell-nav.ts` + ROMA nav | **High** | Medium |
| Billing pilot surface in EOC | `/platform/billing/*` + existing probe | **High** | Small |
| Leads queue signal | `/platform/leads` | Medium | Small |
| Support ticket backlog | `/platform/support/tickets` | Medium | Small |
| Mobile CI smoke ingestion | GitHub Actions artifacts | **High** | Medium |
| CF Access read-only snapshot | External audit script output | Medium | Small |
| Live AI gate status | Existing smoke script result file | Medium | Small |

---

## Existing Integrations (Keep)

| Integration | Status |
|-------------|--------|
| 15 live probes | **Production** |
| Engineering intelligence | **Production** |
| Safe audit + history | **Production** |
| Quality graph / catalog / change intel | **Production** (analysis-only) |
| Executive dashboard V3 | **Production** |
| Platform testing APIs | **Production** |

---

## Gap Prioritization

### Critical

| ID | Gap | Risk |
|----|-----|------|
| G-C1 | Platform operations APIs not in ROMA executive view | Owner lacks single-pane tenant/support posture |
| G-C2 | Navigation split (shell vs ROMA) | Discoverability / dual truth UX |
| G-C3 | Tenant isolation UNKNOWN in ROMA | Security blind spot for platform owner |
| G-C4 | Mobile apps UNKNOWN without CI/store signals | False confidence from env-only metadata |

### High

| ID | Gap | Risk |
|----|-----|------|
| G-H1 | Duplicate DB/build probes | Cost + inconsistent status |
| G-H2 | No canonical platform registry file | Integration drift as subsystems added |
| G-H3 | Cloudflare Access not observable in ROMA | Perimeter blind spot |
| G-H4 | Live AI not in ROMA (config-only) | Release decisions without inference proof |
| G-H5 | Golden path E2E not in CI | Regression on owner flows |

### Medium

| ID | Gap |
|----|-----|
| G-M1 | Billing webhook not live-tested in ROMA |
| G-M2 | Notification delivery metrics absent |
| G-M3 | Integrations (Telegram) reachability absent |
| G-M4 | Performance/CWV entirely absent |
| G-M5 | `GET /testing/quality` API unused — consolidate or document |

### Low

| ID | Gap |
|----|-----|
| G-L1 | Badge helper duplication across ROMA clients |
| G-L2 | Platform section static pages vs live dashboard |
| G-L3 | docs/roma spec layer confusion for operators |

---

## Future Integrations (Out of Current Program Scope)

- Predictive operations / anomaly detection
- Automated execution from ROMA
- Customer-facing operational dashboards
- Tenant admin merge into ROMA
- New subsystem provisioning automation

---

## Verdict

| Metric | Value |
|--------|-------|
| Critical gaps | **4** |
| High gaps | **5** |
| Evidence gaps marked UNKNOWN | **6 subsystems** |
| Fabricated health | **0** (by policy) |
