import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { PublicGlassContentPage, PublicRevealGlassCard } from "@/components/public";

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
    <PublicGlassContentPage title={t("title")} description={t("metaDescription")} maxWidthClass="max-w-4xl">
      <ul className="space-y-3">
        {DOC_SLUGS.map((slug) => (
          <li key={slug}>
            <Link
              href={`/docs/${slug}`}
              className="block rounded-[var(--aistroyka-radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <PublicRevealGlassCard interactive intensity="subtle">
                <span className="text-[var(--aistroyka-font-headline)] font-semibold text-aistroyka-text-primary">
                  {t(DOC_TITLE_KEYS[slug])}
                </span>
              </PublicRevealGlassCard>
            </Link>
          </li>
        ))}
      </ul>
    </PublicGlassContentPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
