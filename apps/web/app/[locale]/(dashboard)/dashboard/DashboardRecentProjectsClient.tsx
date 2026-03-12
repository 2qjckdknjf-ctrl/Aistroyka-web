"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useProjects } from "@/lib/projects/useProjects";
import { usePrefetchProject } from "@/lib/projects/prefetchProject";
import { QueryBoundary } from "@/lib/query/render";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui";
import { DemoProjectCard } from "@/components/onboarding";
import type { ProjectRow } from "@/lib/supabase/rpc";

const RECENT_LIMIT = 10;

export function DashboardRecentProjectsClient() {
  const t = useTranslations("dashboard");
  const tProjects = useTranslations("projects");
  const locale = useLocale();
  const query = useProjects();
  const prefetchProject = usePrefetchProject();
  return (
    <QueryBoundary
      query={{
        data: query.data,
        isPending: query.isPending,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
      }}
      emptyCondition={(data) => !data || data.length === 0}
      emptyTitle={t("noProjectsYet")}
      emptySubtitle={t("createOne")}
      emptyAction={
        <Link href="/projects/new">
          <Button variant="primary">{t("createOne")}</Button>
        </Link>
      }
      loadingFallback={
        <Card className="overflow-hidden p-0">
          <div className="h-32 animate-pulse rounded bg-aistroyka-surface-muted" />
        </Card>
      }
    >
      {(allProjects: ProjectRow[]) => {
        const projectList = allProjects.slice(0, RECENT_LIMIT);
        return projectList.length > 0 ? (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[260px] text-left text-aistroyka-subheadline">
                <thead>
                  <tr className="border-b border-aistroyka-border-subtle bg-aistroyka-surface-raised">
                    <th className="table-cell font-semibold text-aistroyka-text-primary">
                      {tProjects("name")}
                    </th>
                    <th className="table-cell font-semibold text-aistroyka-text-primary">
                      {tProjects("created")}
                    </th>
                    <th className="table-cell font-semibold text-aistroyka-text-primary">
                      {tProjects("action")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projectList.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-aistroyka-border-subtle last:border-0 transition-colors hover:bg-aistroyka-surface-raised/50"
                    >
                      <td className="table-cell font-medium text-aistroyka-text-primary">
                        {p.name}
                      </td>
                      <td className="table-cell text-aistroyka-text-secondary tabular-nums">
                        {new Date(p.created_at).toLocaleDateString(locale)}
                      </td>
                      <td className="table-cell">
                        <Link
                          href={`/projects/${p.id}`}
                          onMouseEnter={() => prefetchProject(p.id)}
                          className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded-aistroyka-sm"
                        >
                          {tProjects("open")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <>
            <DemoProjectCard />
            <div className="mt-4 flex justify-center">
              <Link href="/projects/new">
                <Button variant="primary">{t("createOne")}</Button>
              </Link>
            </div>
          </>
        );
      }}
    </QueryBoundary>
  );
}
