"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { HelpCircle, Menu, MessageCircle, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { LocaleSwitcher } from "./CanonLocaleSwitcher";
import { CanonNotificationBell } from "./CanonNotificationBell";

type CanonTopBarProps = {
  userEmail?: string;
  userRoleLabel?: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
};

function initialsFromEmail(email?: string): string {
  if (!email) return "A";
  const part = email.split("@")[0] ?? "";
  if (part.length >= 2) return part.slice(0, 2).toUpperCase();
  return part.slice(0, 1).toUpperCase() || "A";
}

function displayNameFromEmail(email?: string): string {
  if (!email) return "User";
  const part = email.split("@")[0] ?? email;
  return part.replace(/[._-]/g, " ");
}

export function CanonTopBar({
  userEmail,
  userRoleLabel,
  onMenuClick,
  showMenuButton = false,
}: CanonTopBarProps) {
  const t = useTranslations("canon");
  const router = useRouter();
  const [query, setQuery] = useState("");

  function runSearch(e?: FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) {
      router.push("/dashboard/tasks");
      return;
    }
    router.push(`/dashboard/tasks?q=${encodeURIComponent(q)}`);
  }

  function onSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") runSearch();
  }

  return (
    <header className="canon-topbar sticky top-0 z-20">
      <div className="canon-topbar-inner flex items-center gap-3 px-3 md:px-6 md:py-0 md:h-[var(--canon-topbar-h)]">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {showMenuButton ? (
            <button
              type="button"
              onClick={onMenuClick}
              className="canon-notify-btn shrink-0 md:hidden"
              aria-label={t("openMenu")}
            >
              <Menu size={22} aria-hidden />
            </button>
          ) : null}

          <form className="canon-search-field mx-auto w-full md:max-w-xl" onSubmit={runSearch}>
            <Search size={18} className="shrink-0 text-[var(--canon-text-muted)]" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder={t("globalSearchPlaceholder")}
              aria-label={t("globalSearch")}
            />
            <span className="canon-kbd canon-hide-mobile">⌘K</span>
          </form>
        </div>

        <div className="canon-topbar-actions flex shrink-0 items-center gap-0.5 sm:gap-2">
          <CanonNotificationBell />
          <Link href="/dashboard/support" className="canon-notify-btn" aria-label={t("messages")}>
            <MessageCircle size={20} aria-hidden />
          </Link>
          <Link href="/dashboard/help" className="canon-notify-btn canon-hide-mobile" aria-label={t("help")}>
            <HelpCircle size={20} aria-hidden />
          </Link>
          <LocaleSwitcher />
          <div className="canon-user-chip">
            <span className="canon-user-avatar" aria-hidden>
              {initialsFromEmail(userEmail)}
            </span>
            <span className="hidden min-w-0 lg:block">
              <span className="block truncate text-sm font-semibold text-[var(--canon-text-primary)]">
                {displayNameFromEmail(userEmail)}
              </span>
              <span className="block truncate text-xs text-[var(--canon-text-muted)]">
                {userRoleLabel ?? t("defaultRole")}
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
