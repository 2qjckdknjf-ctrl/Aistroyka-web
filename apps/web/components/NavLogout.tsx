"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export function NavLogout() {
  const router = useRouter();
  const t = useTranslations("nav");

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="btn-secondary text-sm"
    >
      {t("logout")}
    </button>
  );
}
