import { setRequestLocale, getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/public";
import { PublicFooter } from "@/components/public";
import { PublicAmbientField } from "@/components/public/PublicAmbientField";
import { PublicLiquidGlassRoot } from "@/components/public/PublicLiquidGlassRoot";
import { getAppUrl } from "@/lib/app-url";
import { routing } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Layout for all public marketing pages: header + footer, no auth required.
 * Does not wrap (dashboard) or (auth) routes.
 */
export default async function PublicLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "public.layout" });
  const baseUrl = getAppUrl();
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Aistroyka",
    url: baseUrl,
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
    url: baseUrl,
    image: `${baseUrl}/brand/aistroyka-logo.png`,
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Aistroyka",
    url: baseUrl,
    inLanguage: routing.locales,
    description: t("schemaOrgDescription"),
  };

  return (
    <div className="public-ambient-shell flex min-h-screen flex-col overflow-x-clip bg-aistroyka-bg-primary">
      <PublicAmbientField />
      <PublicLiquidGlassRoot />
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
      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicHeader />
        <main className="min-w-0 flex-1 overflow-x-clip">{children}</main>
        <PublicFooter />
      </div>
    </div>
  );
}
