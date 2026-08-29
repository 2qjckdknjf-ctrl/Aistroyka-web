import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getAppUrl } from "@/lib/app-url";
import { publicCanonicalUrl } from "@/lib/seo/public-canonical";
import { publicOpenGraph } from "@/lib/seo/public-open-graph";
import { PublicHomeContent } from "./PublicHomeContent";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.v41" });
  const title = `Aistroyka — ${t("heroTitle1")} ${t("heroTitle2")}`;
  const description = t("heroLead");
  const canonical = publicCanonicalUrl({ origin: getAppUrl(), pathname: `/${locale}` });
  return {
    title: { absolute: title },
    description,
    openGraph: publicOpenGraph({ locale, canonical, title, description }),
  };
}

/**
 * Public home: always shows marketing content.
 * Root domain (/) redirects here via app/page.tsx → /{defaultLocale}.
 * No redirect to dashboard for authenticated users — they can open /dashboard explicitly.
 */
export default async function PublicHomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PublicHomeContent />;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
