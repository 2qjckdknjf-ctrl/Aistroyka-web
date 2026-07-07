import type { Metadata } from "next";
import { RomaAuditRunsClient } from "@/components/platform-admin/RomaAuditRunsClient";
import { listAuditRunSummaries } from "@/lib/platform-admin/roma-run-history.service";
import { getAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Operations Center · Audit History",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function RomaAuditRunsPage() {
  const admin = getAdminClient();
  if (!admin) {
    return (
      <RomaAuditRunsClient
        runs={[]}
        loadError="Service role unavailable — audit run history cannot be loaded in this environment."
      />
    );
  }

  try {
    const runs = await listAuditRunSummaries(admin);
    return <RomaAuditRunsClient runs={runs} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load audit runs";
    return <RomaAuditRunsClient runs={[]} loadError={message} />;
  }
}
