import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const headersList = await headers();
  const locale = headersList.get("x-next-intl-locale") ?? routing.defaultLocale;
  if (user) redirect(`/${locale}/dashboard`);
  redirect(`/${locale}/login`);
}
