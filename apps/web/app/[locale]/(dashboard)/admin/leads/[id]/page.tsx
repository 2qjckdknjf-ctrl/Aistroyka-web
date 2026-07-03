import { redirect } from "next/navigation";
import { PLATFORM_ADMIN_BASE_PATH } from "@/lib/platform-admin/constants";

type Props = { params: Promise<{ id: string }> };

export default async function LegacyAdminLeadDetailRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`${PLATFORM_ADMIN_BASE_PATH}/leads/${id}`);
}
