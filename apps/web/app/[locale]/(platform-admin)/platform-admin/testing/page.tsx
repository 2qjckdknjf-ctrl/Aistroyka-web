import type { Metadata } from "next";
import { buildRomaQualityDashboard } from "@/lib/platform-admin/roma-quality-dashboard.service";
import { buildRomaEngineeringIntelligence } from "@/lib/platform-admin/roma-engineering-intelligence";
import { listAuditRunSummaries } from "@/lib/platform-admin/roma-run-history.service";
import { PlatformAdminTestingClient } from "@/components/platform-admin/PlatformAdminTestingClient";
import { getAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Operations Center",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function PlatformAdminTestingPage() {
  const dashboard = await buildRomaQualityDashboard();
  const intelligence = buildRomaEngineeringIntelligence(dashboard);

  let recentAudits: Awaited<ReturnType<typeof listAuditRunSummaries>> = [];
  const admin = getAdminClient();
  if (admin) {
    try {
      recentAudits = await listAuditRunSummaries(admin, 5);
    } catch {
      recentAudits = [];
    }
  }

  return (
    <PlatformAdminTestingClient
      dashboard={dashboard}
      intelligence={intelligence}
      recentAudits={recentAudits}
    />
  );
}
