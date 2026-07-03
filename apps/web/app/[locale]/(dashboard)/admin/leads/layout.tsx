import { assertPlatformOwnerLegacyAdminPageAccess } from "@/lib/platform-owner/require-platform-owner-legacy-admin-page";

export default async function PlatformLeadsLayout({ children }: { children: React.ReactNode }) {
  await assertPlatformOwnerLegacyAdminPageAccess();
  return <>{children}</>;
}
