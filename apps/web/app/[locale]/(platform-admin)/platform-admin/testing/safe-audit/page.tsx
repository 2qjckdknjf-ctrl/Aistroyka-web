import type { Metadata } from "next";
import { RomaSafeAuditClient } from "@/components/platform-admin/RomaSafeAuditClient";
import { createSafeReadonlyAudit } from "@/lib/platform-admin/roma-safe-readonly-audit";

export const metadata: Metadata = {
  title: "Operations Center · Safe Audit",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function RomaSafeAuditPage() {
  const audit = await createSafeReadonlyAudit();
  return <RomaSafeAuditClient audit={audit} />;
}
