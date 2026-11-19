"use client";

import { useEffect, useState } from "react";
import { FileText, Home, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

function parsePortalClientProjectId(pathname: string): string | null {
  const match = pathname.match(/\/dashboard\/projects\/([^/]+)\/client/);
  return match?.[1] ?? null;
}

function hashFromHref(href: string): string {
  const index = href.indexOf("#");
  return index >= 0 ? href.slice(index) : "";
}

export function CanonPortalBottomNav() {
  const t = useTranslations("canon");
  const pathname = usePathname();
  const projectId = parsePortalClientProjectId(pathname);
  const clientBase = projectId ? `/dashboard/projects/${projectId}/client` : null;
  const [hash, setHash] = useState("");

  useEffect(() => {
    const read = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    read();
    // App Router same-route hash links update the URL with pushState and skip hashchange.
    // popstate still covers back/forward; in-nav clicks set the hash directly.
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
    };
  }, [pathname]);

  const onClientProject = Boolean(clientBase);
  const documentsActive = onClientProject && hash === "#portal-documents";
  const approvalsActive = onClientProject && hash === "#portal-approvals";
  const projectsActive =
    pathname.startsWith("/portal") || (onClientProject && !documentsActive && !approvalsActive);

  const items = [
    {
      key: "projects",
      href: "/portal/projects",
      labelKey: "portalNavProjects" as const,
      icon: Home,
      active: projectsActive,
      enabled: true,
    },
    {
      key: "documents",
      href: clientBase ? `${clientBase}#portal-documents` : "/portal/projects",
      labelKey: "portalNavDocuments" as const,
      icon: FileText,
      active: documentsActive,
      enabled: onClientProject,
    },
    {
      key: "approvals",
      href: clientBase ? `${clientBase}#portal-approvals` : "/portal/projects",
      labelKey: "portalNavApprovals" as const,
      icon: MessageSquare,
      active: approvalsActive,
      enabled: onClientProject,
    },
  ];

  return (
    <nav className="canon-portal-bottom-nav canon-glass md:hidden" aria-label={t("portalMobileNav")}>
      {items.map((item) =>
        item.enabled ? (
          <Link
            key={item.key}
            href={item.href}
            onClick={() => setHash(hashFromHref(item.href))}
            className={`canon-portal-bottom-nav-item ${item.active ? "canon-portal-bottom-nav-item--active" : ""}`}
          >
            <item.icon size={20} aria-hidden />
            <span>{t(item.labelKey)}</span>
          </Link>
        ) : (
          <span
            key={item.key}
            className="canon-portal-bottom-nav-item opacity-40"
            aria-disabled="true"
            title={t("portalPickProjectFirst")}
          >
            <item.icon size={20} aria-hidden />
            <span>{t(item.labelKey)}</span>
          </span>
        )
      )}
    </nav>
  );
}
