import type { Metadata } from "next";
import { buildRomaQualityDashboard } from "@/lib/platform-admin/roma-quality-dashboard.service";
import { PlatformAdminTestingClient } from "@/components/platform-admin/PlatformAdminTestingClient";

export const metadata: Metadata = {
  title: "ROMA Testing",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function PlatformAdminTestingPage() {
  const dashboard = await buildRomaQualityDashboard();
  return <PlatformAdminTestingClient dashboard={dashboard} />;
}
