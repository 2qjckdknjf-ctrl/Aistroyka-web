/**
 * ROMA Phase 2 — wires existing platform services into Operations Center probes.
 * Does not duplicate probe logic from roma-live-probes; calls shared platform services.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import { isFcmConfigured } from "@/lib/platform/push/fcm.provider";
import {
  getBillingPlatformSnapshot,
  getPlatformOverviewSnapshot,
  getPushOutboxHealthSnapshot,
  type BillingPlatformSnapshot,
  type PlatformOverviewSnapshot,
  type PushOutboxHealthSnapshot,
} from "@/lib/platform/platform-overview.service";
import type { ProbeOutcome } from "./roma-live-probes";

export type PlatformOverviewProbeData = PlatformOverviewSnapshot;
export type PushOutboxProbeData = PushOutboxHealthSnapshot & {
  fcmConfigured: boolean;
  telegramConfigured: boolean;
};
export type BillingPlatformProbeData = BillingPlatformSnapshot;

export type PlatformIntegrationProbeBundle = {
  platformOverview: ProbeOutcome<PlatformOverviewProbeData>;
  pushOutbox: ProbeOutcome<PushOutboxProbeData>;
  billingPlatform: ProbeOutcome<BillingPlatformProbeData>;
};

function telegramConfigured(): boolean {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN?.trim() &&
      (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() || process.env.TELEGRAM_BOT_USERNAME?.trim())
  );
}

export async function runPlatformIntegrationProbes(): Promise<PlatformIntegrationProbeBundle> {
  const admin = getAdminClient();
  if (!admin) {
    const missing: ProbeOutcome<null> = {
      connected: false,
      summary: "Service role not configured — platform integration skipped.",
      data: null,
      error: "service_role_missing",
    };
    return {
      platformOverview: missing,
      pushOutbox: missing,
      billingPlatform: missing,
    };
  }

  const [overview, pushOutbox, billingPlatform] = await Promise.all([
    getPlatformOverviewSnapshot(admin),
    getPushOutboxHealthSnapshot(admin),
    getBillingPlatformSnapshot(admin),
  ]);

  return {
    platformOverview: {
      connected: overview.connected,
      summary: overview.connected
        ? `Tenants=${overview.totalTenants}; users=${overview.activeUsers}; projects=${overview.totalProjects}; open support=${overview.openSupportEvents}.`
        : "Platform overview unavailable.",
      data: overview.connected ? overview : null,
      error: overview.error,
    },
    pushOutbox: {
      connected: pushOutbox.connected,
      summary: pushOutbox.connected
        ? `Push outbox pending=${pushOutbox.pendingCount}; failed=${pushOutbox.failedCount}; sent(24h)=${pushOutbox.sentCount24h}.`
        : "Push outbox health unavailable.",
      data: pushOutbox.connected
        ? {
            ...pushOutbox,
            fcmConfigured: isFcmConfigured(),
            telegramConfigured: telegramConfigured(),
          }
        : null,
      error: pushOutbox.error,
    },
    billingPlatform: {
      connected: billingPlatform.connected,
      summary: billingPlatform.connected
        ? `Entitlements=${billingPlatform.entitlementsRowCount}; billing_customers=${billingPlatform.billingCustomersCount}.`
        : "Billing platform inventory unavailable.",
      data: billingPlatform.connected ? billingPlatform : null,
      error: billingPlatform.error,
    },
  };
}
