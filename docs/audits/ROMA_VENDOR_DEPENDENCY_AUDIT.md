# ROMA Vendor Dependency Audit

**Generated:** 2026-07-07T07:07:59.515Z
**Scope:** `platform-admin`, `roma-live-probes`, `kernel`
**Mode:** Audit-only (no refactor)

## Summary

- **platform-admin:** 36 file(s), 20 finding(s)
- **roma-live-probes:** 1 file(s), 18 finding(s)
- **kernel:** 37 file(s), 0 finding(s)

| Category | Count |
|----------|-------|
| Direct vendor SDK imports | 3 |
| Indirect vendor coupling | 15 |
| Adapter violation candidates | 20 |

## Kernel boundary

`packages/roma-kernel` contains **zero** third-party vendor SDK imports — types and pure domain logic only.

## Findings by target

### platform-admin

| Severity | Kind | Import | File |
|----------|------|--------|------|
| medium | indirect_vendor_coupling | `@/lib/controllers/health` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/controllers/health` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/config` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/config/release-env` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | indirect_vendor_coupling | `@/lib/config/server` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/config/server` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | indirect_vendor_coupling | `@/lib/system/health.service` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/system/health.service` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | indirect_vendor_coupling | `@/lib/platform/billing-readiness/billing-adapter-registry` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/platform/billing-readiness/billing-adapter-registry` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | indirect_vendor_coupling | `@/lib/platform/billing-readiness/billing-provider-config` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/platform/billing-readiness/billing-provider-config` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| high | direct_vendor_sdk | `@/lib/platform/billing-readiness/stripe-price-mapping` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | indirect_vendor_coupling | `@/lib/platform/billing-readiness/stripe-price-mapping` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/platform/billing-readiness/stripe-price-mapping` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/platform/flags/flags.repository` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | indirect_vendor_coupling | `@/lib/supabase/admin` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/supabase/admin` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | indirect_vendor_coupling | `@/lib/platform/billing-readiness/billing-provider-config` | `apps/web/lib/platform-admin/roma-quality-dashboard.service.ts` |
| high | direct_vendor_sdk | `@supabase/supabase-js` | `apps/web/lib/platform-admin/roma-run-history.service.ts` |

### roma-live-probes

| Severity | Kind | Import | File |
|----------|------|--------|------|
| medium | indirect_vendor_coupling | `@/lib/controllers/health` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/controllers/health` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/config` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/config/release-env` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | indirect_vendor_coupling | `@/lib/config/server` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/config/server` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | indirect_vendor_coupling | `@/lib/system/health.service` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/system/health.service` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | indirect_vendor_coupling | `@/lib/platform/billing-readiness/billing-adapter-registry` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/platform/billing-readiness/billing-adapter-registry` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | indirect_vendor_coupling | `@/lib/platform/billing-readiness/billing-provider-config` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/platform/billing-readiness/billing-provider-config` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| high | direct_vendor_sdk | `@/lib/platform/billing-readiness/stripe-price-mapping` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | indirect_vendor_coupling | `@/lib/platform/billing-readiness/stripe-price-mapping` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/platform/billing-readiness/stripe-price-mapping` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/platform/flags/flags.repository` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | indirect_vendor_coupling | `@/lib/supabase/admin` | `apps/web/lib/platform-admin/roma-live-probes.ts` |
| medium | adapter_violation_candidate | `@/lib/supabase/admin` | `apps/web/lib/platform-admin/roma-live-probes.ts` |

### kernel

_No vendor couplings detected._

## Recommendations (documentation only)

1. Keep `roma-kernel` vendor-neutral — current state satisfies this invariant.
2. `roma-live-probes.ts` is the primary adapter-violation hotspot; future adapter extraction is architecture work, not required for this audit closure.
3. `roma-run-history.service.ts` couples to Supabase client types — acceptable at persistence boundary until a storage port is introduced.
