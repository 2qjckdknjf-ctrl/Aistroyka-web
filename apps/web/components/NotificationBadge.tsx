"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch("/api/v1/notifications/unread-count", { credentials: "include" });
  if (!res.ok) return 0;
  const json = await res.json();
  return typeof json.count === "number" ? json.count : 0;
}

export function NotificationBadge() {
  const { data: count = 0 } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: fetchUnreadCount,
    staleTime: 30 * 1000,
  });

  return (
    <Link
      href="/dashboard/notifications"
      className="relative flex min-h-aistroyka-touch min-w-aistroyka-touch items-center justify-center rounded-[var(--aistroyka-radius-lg)] text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised hover:text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
      aria-label={count > 0 ? `${count} unread notifications` : "Notifications"}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-aistroyka-error px-1 text-[10px] font-bold text-aistroyka-text-inverse">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
