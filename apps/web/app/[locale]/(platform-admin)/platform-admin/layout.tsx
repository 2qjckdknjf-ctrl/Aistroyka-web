import type { Metadata } from "next";
import { assertPlatformOwnerPageAccess } from "@/lib/platform-owner/require-platform-owner-page";
import { PlatformAdminShell } from "@/components/platform-admin/PlatformAdminShell";

export const metadata: Metadata = {
  title: "Platform admin",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  await assertPlatformOwnerPageAccess();
  return <PlatformAdminShell>{children}</PlatformAdminShell>;
}
