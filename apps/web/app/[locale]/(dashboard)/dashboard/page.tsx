import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { OnboardingGate } from "@/components/onboarding";
import { GetStartedPanel, FirstValueBanner } from "@/components/onboarding";
import { DashboardOpsOverviewClient } from "./DashboardOpsOverviewClient";
import { DashboardRecentProjectsClient } from "./DashboardRecentProjectsClient";
import { DashboardIntelligenceSectionClient } from "./DashboardIntelligenceSectionClient";

const FALLBACK_T: (key: string) => string = (k) => k;

export default async function DashboardPage() {
  let t = FALLBACK_T;
  let tProjects = FALLBACK_T;
  let locale = "en";
  try {
    t = (await getTranslations("dashboard")) as (key: string) => string;
    tProjects = (await getTranslations("projects")) as (key: string) => string;
    locale = await getLocale();
  } catch {
    // i18n can throw in Edge or when messages missing; use fallbacks so page does not crash
  }

  let user: { id: string; email?: string } | null = null;
  try {
    const supabase = await createClient();
    user = await getSessionUser(supabase);
  } catch {
    // Layout already enforced auth; fallback so page does not crash (e.g. cookies unavailable in edge)
  }

  return (
    <OnboardingGate>
      <>
        <header className="mb-aistroyka-6 rounded-[var(--aistroyka-radius-card)] border border-aistroyka-border-subtle bg-[var(--aistroyka-bg-branded)] px-aistroyka-4 py-aistroyka-4 text-aistroyka-text-on-branded">
          <h1 className="text-aistroyka-title font-bold tracking-tight sm:text-[var(--aistroyka-font-large)]">
            AISTROYKA.AI — {t("opsTitle")}
          </h1>
          <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-on-branded/80">
            {t("signedInAs")}{" "}
            <span className="font-medium">{user?.email ?? "—"}</span>
          </p>
        </header>
        <section className="mb-aistroyka-8">
          <FirstValueBanner />
          <GetStartedPanel />
        </section>
        <DashboardOpsOverviewClient />
        <section className="mt-aistroyka-8">
          <div className="mb-aistroyka-4 flex flex-col gap-aistroyka-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
              {t("recentProjects")}
            </h2>
            <Link
              href="/dashboard/projects"
              className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded-aistroyka-md"
            >
              {t("allProjects")} →
            </Link>
          </div>
          <DashboardRecentProjectsClient />
        </section>
        <DashboardIntelligenceSectionClient />
      </>
    </OnboardingGate>
  );
}
