"use client";

import type { MouseEvent } from "react";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { applyPortalHash } from "./portal-hash-nav";

async function fetchContractorUnreadCount(): Promise<number> {
  const res = await fetch("/api/v1/notifications/unread-count", { credentials: "include" });
  if (!res.ok) return 0;
  const json = await res.json();
  return typeof json.count === "number" ? json.count : 0;
}

async function fetchPortalUnreadCount(projectId: string): Promise<number> {
  const res = await fetch(`/api/v1/projects/${projectId}/stakeholder-notifications?limit=1`, {
    credentials: "include",
  });
  if (!res.ok) return 0;
  const json = await res.json();
  return typeof json.unread === "number" ? json.unread : 0;
}

export function CanonNotificationBell({
  href = "/dashboard/notifications",
  mode = "contractor",
  projectId = null,
  disabled = false,
  disabledTitle,
}: {
  href?: string;
  mode?: "contractor" | "portal";
  projectId?: string | null;
  disabled?: boolean;
  disabledTitle?: string;
}) {
  const t = useTranslations("canon");
  const pathname = usePathname();
  const portalProjectReady = mode === "portal" && Boolean(projectId);
  const { data: count = 0 } = useQuery({
    queryKey:
      mode === "portal"
        ? ["portal-notifications-unread-count", projectId]
        : ["notifications-unread-count"],
    queryFn: () =>
      portalProjectReady && projectId
        ? fetchPortalUnreadCount(projectId)
        : fetchContractorUnreadCount(),
    enabled: !disabled && (mode !== "portal" || portalProjectReady),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const label = count > 0 ? t("notificationsUnread", { count }) : t("notifications");
  const badge =
    count > 0 ? <span className="canon-notify-badge">{count > 99 ? "99+" : count}</span> : null;

  if (disabled) {
    return (
      <span
        className="canon-notify-btn opacity-40"
        aria-disabled="true"
        title={disabledTitle ?? t("portalPickProjectFirst")}
        aria-label={disabledTitle ?? t("portalPickProjectFirst")}
      >
        <Bell size={20} aria-hidden />
      </span>
    );
  }

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    const hashIndex = href.indexOf("#");
    if (hashIndex < 0 || !projectId) return;
    const hash = href.slice(hashIndex);
    const onClientPage = pathname.includes(`/dashboard/projects/${projectId}/client`);
    if (!onClientPage) return;
    event.preventDefault();
    applyPortalHash(hash);
  }

  return (
    <Link href={href} className="canon-notify-btn" aria-label={label} onClick={onClick}>
      <Bell size={20} aria-hidden />
      {badge}
    </Link>
  );
}
