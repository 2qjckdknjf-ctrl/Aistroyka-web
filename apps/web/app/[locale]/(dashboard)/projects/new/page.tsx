import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CreateProjectForm } from "../CreateProjectForm";

export default async function NewProjectPage() {
  const t = await getTranslations("projects");
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/projects"
        className="mb-6 inline-block text-sm font-medium text-aistroyka-text-secondary hover:text-aistroyka-accent"
      >
        {t("backToProjects")}
      </Link>
      <div className="card">
        <h1 className="text-xl font-bold tracking-tight text-aistroyka-text-primary sm:text-2xl">
          {t("newProject")}
        </h1>
        <p className="mt-1 text-sm text-aistroyka-text-tertiary">{t("newProjectHint")}</p>
        <div className="mt-6">
          <CreateProjectForm />
        </div>
      </div>
    </main>
  );
}
