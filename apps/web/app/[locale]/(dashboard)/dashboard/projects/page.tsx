import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeader } from "@/components/ui";
import { DashboardProjectsListClient } from "./DashboardProjectsListClient";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

export default async function DashboardProjectsPage() {
  const t = await getTranslations("nav");
  const tPage = await getTranslations("dashboardPageMeta");
  const tDetail = await getTranslations("dashboardDetail");
  return (
    <>
      <SectionHeader
        title={t("projects")}
        subtitle={tPage("projectsSubtitle")}
      />
      <DashboardGlassCard className="mb-4 border-l-4 border-l-aistroyka-accent">
        <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
          {tDetail("createProjectToStart")}
        </p>
        <div className="mt-3">
          <Link
            href="/projects/new"
            className="inline-flex items-center rounded-[var(--aistroyka-radius-md)] bg-aistroyka-accent px-3 py-2 text-aistroyka-subheadline font-medium text-aistroyka-text-on-branded hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2"
          >
            {tDetail("create")}
          </Link>
        </div>
      </DashboardGlassCard>
      <DashboardProjectsListClient />
    </>
  );
}
