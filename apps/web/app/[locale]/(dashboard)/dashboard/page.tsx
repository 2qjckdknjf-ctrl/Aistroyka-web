import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { DashboardAIInsightsClient } from "./DashboardAIInsightsClient";
import { DashboardRecentProjectsClient } from "./DashboardRecentProjectsClient";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const tProjects = await getTranslations("projects");
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <header className="mb-aistroyka-6 rounded-[var(--aistroyka-radius-card)] border border-aistroyka-border-subtle bg-[var(--aistroyka-bg-branded)] px-aistroyka-4 py-aistroyka-4 text-aistroyka-text-on-branded">
        <h1 className="text-aistroyka-title font-bold tracking-tight sm:text-[var(--aistroyka-font-large)]">
          AISTROYKA.AI — AI Command Center
        </h1>
        <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-on-branded/80">
          {t("signedInAs")}{" "}
          <span className="font-medium">{user?.email ?? "—"}</span>
        </p>
      </header>
      <section className="mb-aistroyka-6 grid gap-aistroyka-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="KPI overview">
        <Card className="border-l-4 border-l-aistroyka-accent">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Projects</p>
          <p className="mt-aistroyka-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">—</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-info">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Analyses</p>
          <p className="mt-aistroyka-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">—</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-success">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Health</p>
          <p className="mt-aistroyka-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">—</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-warning">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Risks</p>
          <p className="mt-aistroyka-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">—</p>
        </Card>
      </section>
      <Card className="mb-aistroyka-8 border-l-4 border-l-aistroyka-accent">
        <h2 className="text-aistroyka-title3 font-bold tracking-tight text-aistroyka-text-primary">
          {t("title")}
        </h2>
        <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          {t("signedInAs")}{" "}
          <span className="font-medium text-aistroyka-text-primary">
            {user?.email ?? "—"}
          </span>
        </p>
      </Card>
      <section className="mb-aistroyka-8">
        <DashboardAIInsightsClient />
      </section>
      <section>
        <div className="mb-aistroyka-4 flex flex-col gap-aistroyka-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
            {t("recentProjects")}
          </h2>
          <Link
            href="/projects"
            className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded-aistroyka-md"
          >
            {t("allProjects")} →
          </Link>
        </div>
        <DashboardRecentProjectsClient t={t} tProjects={tProjects} locale={locale} />
      </section>
    </>
  );
}
