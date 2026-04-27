"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import {
  Card,
  Skeleton,
  EmptyState,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui";

interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  created_at: string;
  read_at?: string;
  target_type?: string;
  target_id?: string;
  project_id?: string;
}

interface ListResponse {
  data: Notification[];
  total: number;
}

function buildNotificationUrl(n: Notification): string {
  if (n.target_type === "project" && n.target_id) return `/dashboard/projects/${n.target_id}`;
  if (n.target_type === "issue" && n.project_id) return `/dashboard/projects/${n.project_id}?tab=issues`;
  if (n.target_type === "document" && n.project_id) return `/dashboard/projects/${n.project_id}?tab=documents`;
  if (n.target_type === "report" && n.target_id) return `/dashboard/daily-reports/${n.target_id}`;
  if (n.target_type === "task" && n.target_id) return `/dashboard/tasks/${n.target_id}`;
  if (n.project_id) return `/dashboard/projects/${n.project_id}`;
  return "/dashboard";
}

async function fetchNotifications(): Promise<ListResponse> {
  const res = await fetch("/api/v1/notifications?limit=50", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load notifications");
  return res.json();
}

async function markRead(id: string): Promise<void> {
  const res = await fetch(`/api/v1/notifications/${id}/read`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to mark as read");
}

async function markAllRead(): Promise<void> {
  const res = await fetch("/api/v1/notifications/read-all", {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to mark all as read");
}

export function NotificationsClient() {
  const t = useTranslations("notificationsPage");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 30 * 1000,
  });
  const markReadMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (isPending) {
    return (
      <Card>
        <Skeleton className="h-48" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">⚠️</span>}
          title={t("loadFailed")}
          subtitle={error instanceof Error ? error.message : t("unknownError")}
          action={
            <Button variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ["notifications"] })}>
              {tCommon("retry")}
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-aistroyka-title font-bold tracking-tight text-aistroyka-text-primary">
            {t("title")}
          </h1>
          <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
            {t("subtitle")}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            {t("markAllRead")}
          </Button>
        )}
      </header>
      {notifications.length === 0 ? (
        <Card>
          <EmptyState
            icon={<span className="text-2xl">📋</span>}
            title={t("emptyTitle")}
            subtitle={t("emptySubtitle")}
          />
        </Card>
      ) : (
        <Card>
          <Table aria-label={t("tableAria")}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("colTitle")}</TableHeaderCell>
                <TableHeaderCell>{t("colDate")}</TableHeaderCell>
                <TableHeaderCell>{t("colStatus")}</TableHeaderCell>
                <TableHeaderCell>{t("colAction")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notifications.map((n) => (
                <TableRow key={n.id} className={!n.read_at ? "bg-aistroyka-surface-muted/50" : ""}>
                  <TableCell>
                    <Link
                      href={buildNotificationUrl(n)}
                      className={`font-medium hover:underline ${!n.read_at ? "text-aistroyka-text-primary" : "text-aistroyka-text-secondary"}`}
                    >
                      {n.title}
                    </Link>
                    {n.body && (
                      <p className="text-xs text-aistroyka-text-tertiary mt-0.5 line-clamp-1">{n.body}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-aistroyka-text-secondary text-sm">
                    {new Date(n.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">{n.read_at ? t("read") : t("unread")}</TableCell>
                  <TableCell>
                    {!n.read_at ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markReadMutation.mutate(n.id)}
                        disabled={markReadMutation.isPending}
                      >
                        {t("markRead")}
                      </Button>
                    ) : (
                      <Link href={buildNotificationUrl(n)} className="text-aistroyka-accent hover:underline text-sm">
                        {t("view")}
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
