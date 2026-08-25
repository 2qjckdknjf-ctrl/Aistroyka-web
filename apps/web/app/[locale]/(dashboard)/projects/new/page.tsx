import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CreateProjectForm } from "../CreateProjectForm";
import { DashboardCanonRouteShell } from "@/components/canon/DashboardCanonRouteShell";

export default async function NewProjectPage() {
  const t = await getTranslations("projects");
  return (
    <DashboardCanonRouteShell title={t("newProject")} subtitle={t("newProjectHint")}>
      <div className="mb-4">
        <Link href="/dashboard/projects" className="text-sm text-[var(--canon-cyan)] hover:underline">
          {t("backToProjects")}
        </Link>
      </div>
      <div className="canon-glass max-w-xl p-4 sm:p-6">
        <CreateProjectForm skin="canon" />
      </div>
    </DashboardCanonRouteShell>
  );
}
