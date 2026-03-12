"use client";

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
  const res = await fetch("/api/activation/status", { credentials: "include" });
  if (!res.ok) return { getStarted: { createProject: false, inviteTeam: false, addTask: false, uploadReport: false, viewAi: false }, projectCount: 0 };
  const json = await res.json();
  return { getStarted: json.getStarted ?? {}, projectCount: json.projectCount ?? 0 };
}

const ITEMS: { key: keyof GetStarted; href: string; labelKey: string }[] = [
  { key: "createProject", href: "/projects/new", labelKey: "createProject" },
  { key: "inviteTeam", href: "/team", labelKey: "inviteTeam" },
  { key: "addTask", href: "/dashboard/tasks", labelKey: "addTask" },
  { key: "uploadReport", href: "/dashboard/reports", labelKey: "uploadReport" },
  { key: "viewAi", href: "/dashboard/projects", labelKey: "viewAi" },
];

export function GetStartedPanel() {
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
        Get started with Aistroyka
      </h2>
      <ul className="space-y-2">
        {ITEMS.map(({ key, href, labelKey }) => (
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
              <span className="text-aistroyka-subheadline text-aistroyka-text-secondary">
                {labelKey === "createProject" && "Create project"}
                {labelKey === "inviteTeam" && "Invite team"}
                {labelKey === "addTask" && "Add first task"}
                {labelKey === "uploadReport" && "Upload first report"}
                {labelKey === "viewAi" && "View AI insights"}
              </span>
            ) : (
              <Link href={href} className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
                {labelKey === "createProject" && "Create project"}
                {labelKey === "inviteTeam" && "Invite team"}
                {labelKey === "addTask" && "Add first task"}
                {labelKey === "uploadReport" && "Upload first report"}
                {labelKey === "viewAi" && "View AI insights"}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
