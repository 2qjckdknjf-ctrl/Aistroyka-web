import { getTranslations } from "next-intl/server";
import { PortalCanonProjectsList } from "@/components/canon/PortalCanonProjectsList";

export default async function PortalProjectsPage() {
  return <PortalCanonProjectsList />;
}
