import { redirect } from "next/navigation";

/**
 * /dashboard (no locale) → /en/dashboard so bookmarks and links without locale still work.
 */
export default function DashboardRedirect() {
  redirect("/en/dashboard");
}
