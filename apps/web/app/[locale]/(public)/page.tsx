import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { PublicHomeContent } from "./PublicHomeContent";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.home" });
  return {
    title: `Aistroyka — ${t("heroTitle")}`,
    description: t("heroSubtitle"),
    openGraph: {
      title: `Aistroyka — ${t("heroTitle")}`,
      description: t("heroSubtitle"),
    },
  };
}

export default async function PublicHomePage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (user) redirect(`/${locale}/dashboard`);
  setRequestLocale(locale);
  return <PublicHomeContent />;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
