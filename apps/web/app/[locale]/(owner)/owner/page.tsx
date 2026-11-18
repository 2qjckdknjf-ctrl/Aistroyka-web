import { redirect } from "next/navigation";
import { PLATFORM_ADMIN_BASE_PATH } from "@/lib/platform-admin/constants";

export default function LegacyOwnerRedirectPage() {
  redirect(PLATFORM_ADMIN_BASE_PATH);
}
