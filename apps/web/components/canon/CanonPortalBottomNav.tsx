"use client";

import { FileText, Home, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

function parsePortalClientProjectId(pathname: string): string | null {
  const match = pathname.match(/\/dashboard\/projects\/([^/]+)\/client/);
  return match?.[1] ?? null;
}

export function CanonPortalBottomNav() {
  const t = useTranslations("canon");
  const pathname = usePathname();
  const projectId = parsePortalClientProjectId(pathname);
  const clientBase = projectId ? `/dashboard/projects/${projectId}/client` : null;
  const onClient = pathname.includes("/client");

  const items = [
    {
      key: "projects",
      href: "/portal/projects",
      labelKey: "portalNavProjects",
      icon: Home,
      active: pathname.startsWith("/portal"),
    },
    {
      key: "documents",
      href: clientBase ? `${clientBase}#portal-documents` : "/portal/projects",
      labelKey: "portalNavDocuments",
      icon: FileText,
      active: onClient,
    },
    {
      key: "approvals",
      href: clientBase ? `${clientBase}#portal-approvals` : "/portal/projects",
      labelKey: "portalNavApprovals",
      icon: MessageSquare,
      active: onClient,
    },
  ] as const;

  return (
    <nav className="canon-portal-bottom-nav canon-glass md:hidden" aria-label={t("portalMobileNav")}>
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`canon-portal-bottom-nav-item ${item.active ? "canon-portal-bottom-nav-item--active" : ""}`}
        >
          <item.icon size={20} aria-hidden />
          <span>{t(item.labelKey)}</span>
        </Link>
      ))}
    </nav>
  );
}
