import type { Metadata } from "next";
import { assertPlatformOwnerPageAccess } from "@/lib/platform-owner/require-platform-owner-page";
import { PlatformAdminShell } from "@/components/platform-admin/PlatformAdminShell";

export const metadata: Metadata = {
  title: "Platform admin",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function PlatformAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await assertPlatformOwnerPageAccess({ locale });
  return <PlatformAdminShell>{children}</PlatformAdminShell>;
}
