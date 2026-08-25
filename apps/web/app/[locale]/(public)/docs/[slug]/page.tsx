import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

const DOC_BODY_KEYS: Record<(typeof DOC_SLUGS)[number], string> = {
  "getting-started": "gettingStartedBody",
  projects: "projectsBody",
  tasks: "tasksBody",
  reports: "reportsBody",
  "ai-analytics": "aiAnalyticsBody",
  "mobile-apps": "mobileAppsBody",
  "users-and-roles": "usersAndRolesBody",
};

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "public.docs" });
  if (!DOC_SLUGS.includes(slug as (typeof DOC_SLUGS)[number])) {
    return { title: t("title") };
  }
  const titleKey = DOC_TITLE_KEYS[slug as (typeof DOC_SLUGS)[number]];
  return {
    title: { absolute: t("articleMetaTitle", { article: t(titleKey) }) },
    description: t("metaDescription"),
  };
}

export default async function DocSlugPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (!DOC_SLUGS.includes(slug as (typeof DOC_SLUGS)[number])) notFound();
  const t = await getTranslations("public.docs");
  const key = slug as (typeof DOC_SLUGS)[number];
  const titleKey = DOC_TITLE_KEYS[key];

  return (
    <SimpleMarketingPage title={t(titleKey)} lead={t("metaDescription")}>
      <section className="v41-page v41-section">
        <p>
          <Link href="/docs">{t("title")}</Link>
        </p>
        <article className="v43-plan-card v41-glass">
          <p>{t(DOC_BODY_KEYS[key])}</p>
        </article>
      </section>
    </SimpleMarketingPage>
  );
}

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of DOC_SLUGS) {
      params.push({ locale, slug });
    }
  }
  return params;
}
