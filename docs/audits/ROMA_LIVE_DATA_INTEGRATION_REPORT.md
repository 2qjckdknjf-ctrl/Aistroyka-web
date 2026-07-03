# ROMA Live Data Integration Report

**Date:** 2026-07-03  
**Branch:** `security/platform-admin-separation`  
**Scope:** Expand ROMA Live Operations Center with modular live probes and data coverage metrics

---

## Summary

Upgraded `/[locale]/platform-admin/testing` from a basic live dashboard into a **Live Operations Center** with modular read-only probes, calculated **data coverage %**, evidence-based **recommendations**, **platform timeline**, and domain-level observability sections. No test execution, no mutations, no production changes.

---

## New live sources integrated

| Source | Probe | Data |
|--------|-------|------|
| Core health API | `getHealthResponse()` | ok, db, AI, build stamp |
| System health service | `getSystemHealth()` | ai_brain, copilot, alerts, workflows |
| Release env validation | `validateReleaseEnv()` | security verdict, cron, push |
| Git / build metadata | `getBuildStamp()` + CI env | SHA, build time, branch |
| GitHub Actions metadata | `GITHUB_RUN_ID`, `GITHUB_WORKFLOW`, etc. | workflow context when present |
| Supabase DB | health + migrations | tenants probe + `schema_migrations` |
| Supabase storage | `admin.storage.listBuckets()` | media bucket presence |
| Global feature flags | `listFlags(admin)` | DB flag inventory |
| Platform audit log | `platform_owner_audit_log` | latest audit timestamp |
| Billing diagnostics | adapter registry + provider config | flags, Stripe mapping |
| AI configuration | server config helpers | OpenAI, vision providers, Gemini |
| Cloudflare deployment | external `GET /api/v1/health` | edge reachability + build stamp |
| Mobile metadata | store URL + build env vars | iOS/Android distribution hints |
| Notification config | release env push/telegram checks | FCM/APNS/Telegram presence |

**Catalog size:** 15 sources — coverage % = connected / 15.

---

## Still unavailable (shown explicitly)

- Cloudflare Workers Management API (no token probe — secrets not read)
- GitHub Actions API / workflow run history (env-only metadata)
- TestFlight / Play live build status APIs
- Performance telemetry (Lighthouse / RUM)
- Process restart / runtime uptime telemetry
- ROMA learning loop telemetry
- Runtime filesystem doc index

---

## Architecture

| File | Role |
|------|------|
| `roma-live-probes.ts` | Safe probe runner + coverage catalog |
| `roma-quality-dashboard.service.ts` | Dashboard assembly, recommendations, timeline |
| `roma-quality-dashboard.types.ts` | Extended model (coverage, timeline, domains) |
| `PlatformAdminTestingClient.tsx` | Live Operations Center UI |
| `GET /api/v1/platform/testing/quality` | Read-only JSON API (unchanged route) |

---

## New dashboard sections

- **Domain overview** — Platform Health, Infrastructure, Security, AI, Mobile, Deployments, Release
- **Data coverage** — connected/unavailable sources, last refresh, coverage %
- **Platform timeline** — last deploy, migration, build, audit, restart
- **Known risks** — degraded/warning evidence from probes
- **Recommendations** — evidence-only (no recommendations when probes clean)
- **Known blockers** — critical operational blockers

---

## Security

- Platform owner only (existing guards)
- Read-only probes — no writes, no mutations, no run buttons
- External health fetch is GET-only with timeout
- No secrets exposed in dashboard payload

---

## Validation

```bash
cd apps/web && bun run test -- \
  lib/platform-admin/roma-live-probes.test.ts \
  lib/platform-admin/roma-quality-dashboard.service.test.ts \
  lib/platform-admin/roma-quality-dashboard.page.test.ts
```

**12 passed** — coverage math, evidence recommendations, fallback on probe catastrophe, no execution buttons.

---

## Verdicts

| Verdict | Value |
|---------|-------|
| `ROMA_LIVE_DATA_INTEGRATION` | **YES** |
| `TEST_EXECUTION_ENABLED` | **NO** |
| `READY_FOR_SAFE_AUDIT` | **YES** |

---

## Next phase

- Optional polling refresh via quality API
- GitHub Actions read-only API (PAT-gated, platform-owner only) for workflow history
- Performance/RUM source when available
