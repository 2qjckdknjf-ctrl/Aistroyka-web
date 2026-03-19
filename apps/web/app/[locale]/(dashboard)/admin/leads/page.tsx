import { Link } from "@/i18n/navigation";
import { SectionHeader } from "@/components/ui";
import { AdminLeadsClient } from "./AdminLeadsClient";

export const dynamic = "force-dynamic";

export default function AdminLeadsPage() {
  return (
    <>
      <Link
        href="/admin"
        className="mb-aistroyka-6 inline-block text-aistroyka-subheadline font-medium text-aistroyka-text-secondary hover:text-aistroyka-accent"
      >
        ← Admin
      </Link>
      <SectionHeader
        title="Contact leads"
        subtitle="Incoming requests from the public contact form. View and update status."
      />
      <AdminLeadsClient />
    </>
  );
}
