"use client";

import { useEffect, useState } from "react";
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
  const [hash, setHash] = useState("");

  useEffect(() => {
    const read = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [pathname]);

  function scrollToHash(targetHash: string) {
    const id = targetHash.replace(/^#/, "");
    if (!id) return;
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const items = [
    {
      key: "projects",
      href: "/portal/projects",
      labelKey: "portalNavProjects" as const,
      icon: Home,
      active: pathname.startsWith("/portal"),
      enabled: true,
      hash: null as string | null,
    },
    {
      key: "documents",
      href: clientBase ? `${clientBase}#portal-documents` : "/portal/projects",
      labelKey: "portalNavDocuments" as const,
      icon: FileText,
      active: Boolean(clientBase) && hash === "#portal-documents",
      enabled: Boolean(clientBase),
      hash: "#portal-documents" as string | null,
    },
    {
      key: "approvals",
      href: clientBase ? `${clientBase}#portal-approvals` : "/portal/projects",
      labelKey: "portalNavApprovals" as const,
      icon: MessageSquare,
      active: Boolean(clientBase) && hash === "#portal-approvals",
      enabled: Boolean(clientBase),
      hash: "#portal-approvals" as string | null,
    },
  ];

  return (
    <nav className="canon-portal-bottom-nav canon-glass md:hidden" aria-label={t("portalMobileNav")}>
      {items.map((item) =>
        item.enabled ? (
          <Link
            key={item.key}
            href={item.href}
            className={`canon-portal-bottom-nav-item ${item.active ? "canon-portal-bottom-nav-item--active" : ""}`}
            onClick={(event) => {
              if (!item.hash || !clientBase) return;
              if (pathname !== clientBase) return;
              event.preventDefault();
              if (window.location.hash !== item.hash) {
                window.history.pushState(null, "", item.hash);
                setHash(item.hash);
                window.dispatchEvent(new HashChangeEvent("hashchange"));
              }
              scrollToHash(item.hash);
            }}
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
