import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SimpleMarketingPage } from "@/components/public/v43";

const DOC_SLUGS = [
  "getting-started",
  "projects",
  "tasks",
  "reports",
  "ai-analytics",
  "mobile-apps",
  "users-and-roles",
] as const;

const DOC_TITLE_KEYS: Record<(typeof DOC_SLUGS)[number], "gettingStarted" | "projects" | "tasks" | "reports" | "aiAnalytics" | "mobileApps" | "usersAndRoles"> = {
  "getting-started": "gettingStarted",
  projects: "projects",
  tasks: "tasks",
  reports: "reports",
  "ai-analytics": "aiAnalytics",
  "mobile-apps": "mobileApps",
  "users-and-roles": "usersAndRoles",
};

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.docs" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function DocsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.docs");

  return (
    <SimpleMarketingPage title={t("title")} lead={t("metaDescription")}>
      <section className="v41-page v41-section">
        <ul className="v43-module-grid">
          {DOC_SLUGS.map((slug) => (
            <li key={slug}>
              <Link href={`/docs/${slug}`} className="v43-plan-card v41-glass">
                {t(DOC_TITLE_KEYS[slug])}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </SimpleMarketingPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
