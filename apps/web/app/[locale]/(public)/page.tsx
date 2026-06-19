import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { PublicHomeContent } from "./PublicHomeContent";
import { PublicJsonLd } from "@/components/public";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.home" });
  return buildPublicPageMetadata(locale, "", {
    titleAbsolute: `Aistroyka — ${t("heroTitle")}`,
    description: t("heroSubtitle"),
  });
}

/**
 * Public home: always shows marketing content.
 * Root domain (/) redirects here via app/page.tsx → /{defaultLocale}.
 * No redirect to dashboard for authenticated users — they can open /dashboard explicitly.
 */
export default async function PublicHomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "",
    tLayout("breadcrumbHome"),
    tLayout("breadcrumbHome"),
  );

  return (
    <>
      <PublicJsonLd data={breadcrumbJsonLd} />
      <PublicHomeContent />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
