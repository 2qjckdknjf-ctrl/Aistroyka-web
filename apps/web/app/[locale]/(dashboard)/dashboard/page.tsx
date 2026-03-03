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
      <Card className="mb-aistroyka-8 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          {t("title")}
        </h1>
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
