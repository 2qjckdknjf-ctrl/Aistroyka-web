import type { Metadata } from "next";
import { PlatformAdminTestingClient } from "@/components/platform-admin/PlatformAdminTestingClient";

export const metadata: Metadata = {
  title: "ROMA Testing",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function PlatformAdminTestingPage() {
  return <PlatformAdminTestingClient />;
}
