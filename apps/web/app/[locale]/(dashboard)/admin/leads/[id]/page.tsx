import { SectionHeader } from "@/components/ui";
import { AdminLeadDetailClient } from "./AdminLeadDetailClient";

export const dynamic = "force-dynamic";

export default function AdminLeadDetailPage() {
  return (
    <>
      <SectionHeader title="Lead detail" subtitle="View and update status and notes." />
      <AdminLeadDetailClient />
    </>
  );
}
