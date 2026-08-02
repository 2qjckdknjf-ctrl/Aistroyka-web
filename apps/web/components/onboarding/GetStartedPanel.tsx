"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Card, Skeleton } from "@/components/ui";

type GetStarted = {
  createProject: boolean;
  inviteTeam: boolean;
  addTask: boolean;
  uploadReport: boolean;
  viewAi: boolean;
};

async function fetchStatus(): Promise<{ getStarted: GetStarted; projectCount: number }> {
  const res = await fetch("/api/v1/activation/status", { credentials: "include" });
  if (!res.ok) return { getStarted: { createProject: false, inviteTeam: false, addTask: false, uploadReport: false, viewAi: false }, projectCount: 0 };
  const json = await res.json();
  return { getStarted: json.getStarted ?? {}, projectCount: json.projectCount ?? 0 };
}

const ITEMS: { key: keyof GetStarted; href: string; messageKey: "createProject" | "inviteTeam" | "addFirstTask" | "uploadFirstReport" | "viewAiInsights" }[] = [
  { key: "createProject", href: "/projects/new", messageKey: "createProject" },
  { key: "inviteTeam", href: "/team", messageKey: "inviteTeam" },
  { key: "addTask", href: "/dashboard/tasks", messageKey: "addFirstTask" },
  { key: "uploadReport", href: "/dashboard/reports", messageKey: "uploadFirstReport" },
  { key: "viewAi", href: "/dashboard/projects", messageKey: "viewAiInsights" },
];

export function GetStartedPanel() {
  const t = useTranslations("activation");
  const { data, isPending } = useQuery({
    queryKey: ["activation-status"],
    queryFn: fetchStatus,
    staleTime: 30 * 1000,
  });

  if (isPending) {
    return (
      <Card className="p-4">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full mt-2" />
      </Card>
    );
  }

  const gs = data?.getStarted ?? {} as GetStarted;
  const allDone = ITEMS.every((i) => Boolean(gs[i.key]));
  if (allDone && (data?.projectCount ?? 0) > 0) return null;

  return (
    <Card className="p-4">
      <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary mb-3">
        {t("getStartedTitle")}
      </h2>
      <ul className="space-y-2">
        {ITEMS.map(({ key, href, messageKey }) => (
          <li key={key} className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                gs[key]
                  ? "bg-aistroyka-success/20 text-aistroyka-success"
                  : "bg-aistroyka-surface-muted text-aistroyka-text-tertiary"
              }`}
              aria-hidden
            >
              {gs[key] ? "✓" : "—"}
            </span>
            {gs[key] ? (
              <span className="text-aistroyka-subheadline text-aistroyka-text-secondary">{t(messageKey)}</span>
            ) : (
              <Link href={href} className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
                {t(messageKey)}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
