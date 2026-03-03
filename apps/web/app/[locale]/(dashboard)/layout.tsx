import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/AppLayout";
import { routing } from "@/i18n/routing";

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
  if (!user) {
    const headersList = await headers();
    const locale = headersList.get("x-next-intl-locale") ?? routing.defaultLocale;
    redirect(`/${locale}/login`);
  }

  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    "local";
  const shaShort = sha === "local" ? "local" : sha.slice(0, 7);
  const date = process.env.NEXT_PUBLIC_BUILD_TIME ?? "—";

  return (
    <>
      <AppLayout userEmail={user.email ?? undefined}>
        {children}
      </AppLayout>
      <footer
        className="mt-auto border-t border-aistroyka-border-subtle py-aistroyka-2 text-center text-aistroyka-caption text-aistroyka-text-tertiary"
        aria-hidden="true"
      >
        Build: {shaShort} / {date}
      </footer>
    </>
  );
}
