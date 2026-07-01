import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
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

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.docs" });
  return {
    title: `${t("title")} | Aistroyka`,
    description: t("metaDescription"),
  };
}

export default async function DocsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.docs");

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-4 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
        {t("metaDescription")}
      </p>
      <ul className="mt-12 space-y-3">
        {DOC_SLUGS.map((slug) => (
          <li key={slug}>
            <Link
              href={`/docs/${slug}`}
              className="block rounded-[var(--aistroyka-radius-lg)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-4 transition-colors hover:bg-[var(--aistroyka-surface-raised)]"
            >
              {t(DOC_TITLE_KEYS[slug])}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
