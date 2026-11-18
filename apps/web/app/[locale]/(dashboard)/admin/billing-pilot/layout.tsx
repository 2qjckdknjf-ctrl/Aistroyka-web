import { assertPlatformOwnerLegacyAdminPageAccess } from "@/lib/platform-owner/require-platform-owner-legacy-admin-page";

export default async function PlatformBillingPilotLayout({ children }: { children: React.ReactNode }) {
  await assertPlatformOwnerLegacyAdminPageAccess();
  return <>{children}</>;
}
