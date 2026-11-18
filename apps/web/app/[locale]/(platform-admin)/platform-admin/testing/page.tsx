import type { Metadata } from "next";
import { buildRomaQualityDashboard } from "@/lib/platform-admin/roma-quality-dashboard.service";
import { buildRomaEngineeringIntelligence } from "@/lib/platform-admin/roma-engineering-intelligence";
import { PlatformAdminTestingClient } from "@/components/platform-admin/PlatformAdminTestingClient";

export const metadata: Metadata = {
  title: "ROMA Testing",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function PlatformAdminTestingPage() {
  const dashboard = await buildRomaQualityDashboard();
  const intelligence = buildRomaEngineeringIntelligence(dashboard);
  return <PlatformAdminTestingClient dashboard={dashboard} intelligence={intelligence} />;
}
