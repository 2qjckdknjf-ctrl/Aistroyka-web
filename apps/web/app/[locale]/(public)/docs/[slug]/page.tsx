import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

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
  if (!DOC_SLUGS.includes(slug as (typeof DOC_SLUGS)[number])) {
    const t0 = await getTranslations({ locale, namespace: "public.docs" });
    return { title: t0("title") };
  }
  const t = await getTranslations({ locale, namespace: "public.docs" });
  const titleKey = DOC_TITLE_KEYS[slug as (typeof DOC_SLUGS)[number]];
  return {
    title: { absolute: `${t(titleKey)} | Aistroyka Docs` },
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
    <div className="mx-auto min-w-0 max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <Link
        href="/docs"
        className="text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-accent)] hover:underline"
      >
        ← {t("title")}
      </Link>
      <h1 className="mt-4 text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
        {t(titleKey)}
      </h1>
      <div className="prose prose-neutral mt-6 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)]">
        <p className="text-[var(--aistroyka-text-secondary)]">{t(DOC_BODY_KEYS[key])}</p>
      </div>
    </div>
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
