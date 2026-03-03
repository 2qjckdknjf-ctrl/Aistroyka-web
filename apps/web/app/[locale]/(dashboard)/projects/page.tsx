import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTenantForCurrentUser } from "@/lib/api/engine";
import { hasMinRole } from "@/lib/auth/tenant";
import { CreateProjectForm } from "./CreateProjectForm";
import { ProjectsListClient } from "./ProjectsListClient";

export default async function ProjectsPage() {
  const t = await getTranslations("projects");
  const locale = await getLocale();
  const supabase = await createClient();
  const tenantId = await getOrCreateTenantForCurrentUser(supabase);
  const canCreate = tenantId ? await hasMinRole(supabase, tenantId, "member") : false;

  return (
    <>
      <div className="mb-aistroyka-8 flex flex-col gap-aistroyka-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          {t("title")}
        </h1>
        {canCreate && <CreateProjectForm />}
      </div>
      <ProjectsListClient
        t={t}
        locale={locale}
        canCreate={canCreate}
        createForm={
          <div className="mt-aistroyka-2">
            <CreateProjectForm />
          </div>
        }
      />
    </>
  );
}
