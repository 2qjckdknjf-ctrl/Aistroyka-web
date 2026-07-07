# ROMA Platform Integration — Phase 2

**Date:** 2026-07-07  
**Branch:** `security/platform-admin-separation`  
**Program:** ROMA Operations Center  
**Foundation:** ROMA Foundation v1.0.0 **FROZEN** — no Foundation/Kernel changes in this sprint

---

## Objective

Connect Operations Center to **real platform services** that already exist in AISTROYKA. No mock data. `UNKNOWN` / `Not configured` / `No evidence` when data is absent.

---

## Connected Services

| Priority | Service | Source reused | ROMA surface |
|----------|---------|---------------|--------------|
| 1 | Platform overview (tenants, users, projects, support) | `lib/platform/platform-overview.service.ts` ← `GET /api/v1/platform/overview` queries | Executive dashboard **Platform overview** section |
| 2 | System health (Supabase DB, storage, auth, migrations) | Existing `roma-live-probes.ts` + `getSystemHealth()` | Platform health cards + domain sections |
| 3 | Cloudflare deploy probe | Existing `probeCloudflare()` | Deployments domain + Cloudflare component |
| 4 | GitHub / build metadata | Existing `probeGitMetadata()` + health build stamp | Technical diagnostics + timeline |
| 5 | AI configuration | Existing `probeAi()` + `getSystemHealth().services.ai_brain` | AI domain + component |
| 6 | Notifications (push outbox, FCM, Telegram) | `getPushOutboxHealthSnapshot()` + `isFcmConfigured()` + release env | Notifications component |
| 7 | Billing (adapter diagnostics + entitlements inventory) | Existing `probeBilling()` + `getBillingPlatformSnapshot()` | Release domain + platform overview |
| 8 | Mobile metadata | Existing `probeMobile()` — **unknown** unless live health exists | iOS/Android components show metadata-only |

---

## New Evidence Sources (catalog)

Added to `LIVE_SOURCE_CATALOG` (15 → **18**):

| ID | Label |
|----|-------|
| `platform_overview` | Platform overview metrics |
| `push_outbox_health` | Push outbox delivery health |
| `billing_platform_inventory` | Billing entitlements inventory |

---

## Files Changed (integration layer only)

| File | Change |
|------|--------|
| `lib/platform/platform-overview.service.ts` | **New** — shared overview/push/billing queries |
| `lib/platform-admin/roma-platform-integration.ts` | **New** — Phase 2 probe wiring |
| `lib/platform-admin/roma-live-probes.ts` | Calls `runPlatformIntegrationProbes()` |
| `lib/platform-admin/roma-quality-dashboard.service.ts` | `platformOverview` metrics; honest mobile/notification status |
| `lib/platform-admin/roma-quality-dashboard.types.ts` | `PlatformOverviewMetrics` type |
| `components/platform-admin/PlatformAdminTestingClient.tsx` | Platform overview section (no redesign) |
| `app/api/v1/platform/overview/route.ts` | Refactored to shared service (same JSON contract) |

**New APIs created:** **0** (route behavior unchanged; internal refactor only)

---

## Removed Duplication

- Platform overview SQL/count logic consolidated from inline route handler into `platform-overview.service.ts`
- ROMA integration calls the same service — not a second query implementation

---

## UNKNOWN Areas (by design)

| Area | Status | Reason |
|------|--------|--------|
| iOS / Android live health | **Unknown** | Only env metadata (build numbers, store URLs) — no device/store probe |
| Cloudflare Access policy | **Unknown** | No Access API wired; edge health only via `/api/v1/health` |
| Performance telemetry | **Unknown** | No SLO/perf source in platform services |
| ROMA learning loop | **Unknown** | Not implemented |
| Email outbox global health | **Unknown** | No platform-wide email delivery table exposed |
| Account-layer entitlements (`account_entitlements`) | **Unknown** | Inventory uses legacy `entitlements` + `billing_customers` only |
| GitHub release state beyond env metadata | **Partial** | `GITHUB_*` env when present in CI runtime only |

---

## Platform Coverage

| Metric | Value |
|--------|-------|
| Live source catalog | **18** sources |
| Phase 2 additions | **+3** sources |
| Executive dashboard sections with live DB evidence | Platform overview + existing probes |
| Estimated coverage with service role configured | **~70–85%** of catalog (environment-dependent) |
| Estimated coverage without service role | **~40–55%** (integration probes skip) |

Coverage percent is computed at runtime from connected catalog entries — never fabricated.

---

## Foundation / Kernel / Security

| Check | Result |
|-------|--------|
| Foundation modified | **NO** |
| Kernel modified | **NO** |
| ROMA OS architecture docs modified | **NO** |
| New HTTP APIs | **NO** |
| RBAC / owner gates changed | **NO** |
| Cloudflare config changed | **NO** |

---

## Verification

```bash
bun run --cwd apps/web vitest run lib/platform-admin lib/platform/platform-overview.service.test.ts
bun run test
```

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-07 | Phase 2 platform integration |
