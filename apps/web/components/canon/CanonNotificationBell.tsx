"use client";

import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch("/api/v1/notifications/unread-count", { credentials: "include" });
  if (!res.ok) return 0;
  const json = await res.json();
  return typeof json.count === "number" ? json.count : 0;
}

export function CanonNotificationBell() {
  const t = useTranslations("canon");
  const { data: count = 0 } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: fetchUnreadCount,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return (
    <Link
      href="/dashboard/notifications"
      className="canon-notify-btn"
      aria-label={count > 0 ? t("notificationsUnread", { count }) : t("notifications")}
    >
      <Bell size={20} aria-hidden />
      {count > 0 ? (
        <span className="canon-notify-badge">{count > 99 ? "99+" : count}</span>
      ) : null}
    </Link>
  );
}
