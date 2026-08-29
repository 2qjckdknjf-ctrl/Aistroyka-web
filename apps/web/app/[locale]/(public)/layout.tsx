import { headers } from "next/headers";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Manrope } from "next/font/google";
import { PublicHeader } from "@/components/public";
import { PublicFooter } from "@/components/public";
import { V41PilotProvider } from "@/components/public/v41";
import { getAppUrl } from "@/lib/app-url";
import { routing } from "@/i18n/routing";
import { publicCanonicalUrl, publicLocaleAlternates } from "@/lib/seo/public-canonical";
import { publicOpenGraph } from "@/lib/seo/public-open-graph";
import { PublicFunnelBeacon } from "@/components/public/PublicFunnelBeacon";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-v41",
  display: "swap",
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const headerList = await headers();
  const pathname = headerList.get("x-aistroyka-pathname") ?? `/${locale}`;
  const origin = getAppUrl();
  const canonical = publicCanonicalUrl({ origin, pathname });
  return {
    alternates: {
      canonical,
      languages: publicLocaleAlternates({
        origin,
        pathname,
        locales: routing.locales,
        defaultLocale: routing.defaultLocale,
      }),
    },
    openGraph: publicOpenGraph({ locale, canonical }),
  };
}

/**
 * Layout for all public marketing pages: header + footer, no auth required.
 * Does not wrap (dashboard) or (auth) routes.
 */
export default async function PublicLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "public.layout" });
  const headerList = await headers();
  const pathname = headerList.get("x-aistroyka-pathname") ?? `/${locale}`;
  const baseUrl = getAppUrl();
  const localeHome = publicCanonicalUrl({ origin: baseUrl, pathname: `/${locale}` });
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Aistroyka",
    url: localeHome,
    logo: `${baseUrl}/brand/aistroyka-logo.png`,
    description: t("schemaOrgDescription"),
  };
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Aistroyka",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS",
    description: t("schemaSoftwareDescription"),
    url: localeHome,
    image: `${baseUrl}/brand/aistroyka-logo.png`,
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Aistroyka",
    url: localeHome,
    inLanguage: routing.locales,
    description: t("schemaOrgDescription"),
  };

  return (
    <div className={`v41-site ${manrope.variable} flex min-h-screen flex-col`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <PublicFunnelBeacon locale={locale} pathname={pathname} />
      <V41PilotProvider>
        <div className="relative z-10 flex min-h-screen flex-col">
          <PublicHeader />
          <main className="min-w-0 flex-1 overflow-x-clip">{children}</main>
          <PublicFooter />
        </div>
      </V41PilotProvider>
    </div>
  );
}
