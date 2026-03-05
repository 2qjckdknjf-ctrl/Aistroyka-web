import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/Nav";

/**
 * Tenant-aware layout for all authenticated routes.
 * Tenant = current user (auth.uid()); RLS enforces isolation on all data access.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <Nav userEmail={user.email ?? undefined} />
      <div className="min-h-screen bg-gray-50">{children}</div>
    </>
  );
}
