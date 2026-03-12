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

const DOC_BODY: Record<(typeof DOC_SLUGS)[number], string> = {
  "getting-started": "Create an account, invite your team, and create your first project. Connect mobile apps for field reporting and enable AI analysis in project settings.",
  projects: "Projects hold structure, media, and analyses. Create a project, add phases or lots, upload photos, and run AI analysis. Use the dashboard to see all projects.",
  tasks: "Tasks are assigned to users with due dates. Create tasks from the project or dashboard. Workers see their tasks in the mobile app and can complete them with photo evidence.",
  reports: "Daily reports capture site progress. Field teams submit reports from the mobile app with photos and comments. Reports can trigger AI analysis and appear in the dashboard.",
  "ai-analytics": "AI analyzes uploaded photos for progress, deviations, and risks. Results are suggestions; managers review and act. Enable AI per project in settings.",
  "mobile-apps": "Manager app: full dashboard, reports review, tasks. Worker app: daily reports, task completion, photo evidence. Both support offline-friendly workflows.",
  "users-and-roles": "Roles: Owner, Admin, Member, Viewer. Owners and admins manage team and settings. Members create and edit content. Viewers have read-only access.",
};

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!DOC_SLUGS.includes(slug as (typeof DOC_SLUGS)[number])) return { title: "Docs | Aistroyka" };
  const t = await getTranslations({ locale, namespace: "public.docs" });
  const titleKey = DOC_TITLE_KEYS[slug as (typeof DOC_SLUGS)[number]];
  return {
    title: `${t(titleKey)} | Aistroyka Docs`,
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
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
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
        <p className="text-[var(--aistroyka-text-secondary)]">{DOC_BODY[key]}</p>
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
