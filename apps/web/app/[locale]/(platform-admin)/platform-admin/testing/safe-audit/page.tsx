import type { Metadata } from "next";
import { RomaSafeAuditClient } from "@/components/platform-admin/RomaSafeAuditClient";
import { createSafeReadonlyAudit } from "@/lib/platform-admin/roma-safe-readonly-audit";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getPlatformOwnerGrant } from "@/lib/platform-owner/platform-owner-grant";
import { ownerRoleCanWrite } from "@/lib/platform-owner/owner-capabilities";

export const metadata: Metadata = {
  title: "Operations Center · Safe Audit",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function RomaSafeAuditPage() {
  const audit = await createSafeReadonlyAudit();
  let canPersistAuditSnapshot = false;
  try {
    const supabase = await createClient();
    const user = await getSessionUser(supabase);
    if (user?.id) {
      const grant = await getPlatformOwnerGrant(supabase, user.id);
      if (grant.ok) {
        canPersistAuditSnapshot = ownerRoleCanWrite(grant.role);
      }
    }
  } catch {
    canPersistAuditSnapshot = false;
  }
  return (
    <RomaSafeAuditClient audit={audit} canPersistAuditSnapshot={canPersistAuditSnapshot} />
  );
}
