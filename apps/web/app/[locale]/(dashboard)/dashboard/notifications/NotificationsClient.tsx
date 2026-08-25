"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
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
import { CanonSurface } from "@/components/canon/CanonSurface";
import {
  buildNotificationHref,
  countNotificationsByReadState,
  filterNotificationsByReadState,
  parseNotificationReadFilter,
  sortNotificationsByAttention,
  type NotificationReadFilter,
} from "./notifications-workspace.utils";

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

export function NotificationsClient({ skin = "default" }: { skin?: "default" | "canon" }) {
  const t = useTranslations("notificationsPage");
  const tCommon = useTranslations("common");
  const isCanon = skin === "canon";
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const readFilter = parseNotificationReadFilter(searchParams?.get("read"));

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

  const setReadFilter = useCallback(
    (value: NotificationReadFilter) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      if (value === "all") next.delete("read");
      else next.set("read", value);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const sorted = useMemo(
    () => sortNotificationsByAttention(data?.data ?? []),
    [data?.data],
  );
  const counts = useMemo(() => countNotificationsByReadState(sorted), [sorted]);
  const notifications = useMemo(
    () => filterNotificationsByReadState(sorted, readFilter),
    [sorted, readFilter],
  );
  const unreadCount = counts.unread;

  const filterChips: Array<{ id: NotificationReadFilter; label: string }> = [
    { id: "all", label: t("filterAll") },
    { id: "unread", label: t("unread") },
    { id: "read", label: t("read") },
  ];

  if (isPending) {
    return (
      <CanonSurface isCanon={isCanon}>
        <Skeleton className="h-48" />
      </CanonSurface>
    );
  }

  if (isError) {
    return (
      <CanonSurface isCanon={isCanon}>
        <EmptyState
          icon={<span className="text-2xl">⚠️</span>}
          title={t("loadFailed")}
          subtitle={error instanceof Error ? error.message : t("unknownError")}
          action={
            <Button
              variant="secondary"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["notifications"] })}
            >
              {tCommon("retry")}
            </Button>
          }
        />
      </CanonSurface>
    );
  }

  return (
    <>
      {!isCanon ? (
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-aistroyka-title font-bold tracking-tight text-aistroyka-text-primary">
            {t("title")}
          </h1>
          <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
            {t("subtitle")}
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            {t("markAllRead")}
          </Button>
        ) : null}
      </header>
      ) : null}

      <CanonSurface isCanon={isCanon} contentClassName="mb-4 p-4">
        <div
          role="group"
          aria-label={t("readFilter")}
          className="flex flex-wrap gap-1"
        >
          {filterChips.map((chip) => {
            const pressed = readFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={pressed}
                onClick={() => setReadFilter(chip.id)}
                className={`min-h-aistroyka-touch rounded-[var(--aistroyka-radius-lg)] border px-3 text-aistroyka-caption font-medium ${
                  pressed
                    ? "border-aistroyka-accent bg-aistroyka-accent-light text-aistroyka-accent"
                    : "border-aistroyka-border-subtle text-aistroyka-text-secondary hover:text-aistroyka-text-primary"
                }`}
              >
                {chip.label}
                <span className="ml-1 tabular-nums text-aistroyka-text-tertiary">
                  ({counts[chip.id]})
                </span>
              </button>
            );
          })}
        </div>
      </CanonSurface>

      {notifications.length === 0 ? (
        <CanonSurface isCanon={isCanon}>
          <EmptyState
            icon={<span className="text-2xl">📋</span>}
            title={t("emptyTitle")}
            subtitle={readFilter === "all" ? t("emptySubtitle") : t("emptyForFilter")}
          />
        </CanonSurface>
      ) : (
        <>
          <ul className="space-y-2 sm:hidden">
            {notifications.map((n) => (
              <li key={n.id}>
                <CanonSurface
                  isCanon={isCanon}
                  contentClassName={`space-y-2 p-3 ${!n.read_at ? "border-l-4 border-l-aistroyka-accent" : ""}`}
                >
                  <Link
                    href={buildNotificationHref(n)}
                    className={`font-medium hover:underline ${
                      !n.read_at ? "text-aistroyka-text-primary" : "text-aistroyka-text-secondary"
                    }`}
                  >
                    {n.title}
                  </Link>
                  {n.body ? (
                    <p className="line-clamp-2 text-xs text-aistroyka-text-tertiary">{n.body}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-aistroyka-text-tertiary">
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                    <span>{n.read_at ? t("read") : t("unread")}</span>
                  </div>
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
                    <Link
                      href={buildNotificationHref(n)}
                      className="text-sm text-aistroyka-accent hover:underline"
                    >
                      {t("view")}
                    </Link>
                  )}
                </CanonSurface>
              </li>
            ))}
          </ul>

          <CanonSurface isCanon={isCanon} className="hidden sm:block" contentClassName="overflow-hidden p-0">
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
                  <TableRow
                    key={n.id}
                    className={!n.read_at ? "bg-aistroyka-surface-muted/50" : ""}
                  >
                    <TableCell>
                      <Link
                        href={buildNotificationHref(n)}
                        className={`font-medium hover:underline ${
                          !n.read_at
                            ? "text-aistroyka-text-primary"
                            : "text-aistroyka-text-secondary"
                        }`}
                      >
                        {n.title}
                      </Link>
                      {n.body ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-aistroyka-text-tertiary">
                          {n.body}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm text-aistroyka-text-secondary">
                      {new Date(n.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {n.read_at ? t("read") : t("unread")}
                    </TableCell>
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
                        <Link
                          href={buildNotificationHref(n)}
                          className="text-sm text-aistroyka-accent hover:underline"
                        >
                          {t("view")}
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CanonSurface>
        </>
      )}
    </>
  );
}
