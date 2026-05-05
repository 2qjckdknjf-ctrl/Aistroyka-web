export type HelpRole = "manager" | "admin" | "client" | "owner";

export type HelpArticleCatalogItem = {
  id: "gettingStarted" | "projectSetup" | "dailyWork" | "aiIntelligence" | "clientCollaboration" | "mobileApps";
  href: string;
  roles: Array<HelpRole | "all">;
};

export const HELP_ARTICLE_CATALOG: HelpArticleCatalogItem[] = [
  {
    id: "gettingStarted",
    href: "/dashboard",
    roles: ["all"],
  },
  {
    id: "projectSetup",
    href: "/dashboard/projects",
    roles: ["manager", "admin", "owner"],
  },
  {
    id: "dailyWork",
    href: "/dashboard/daily-reports",
    roles: ["manager", "admin"],
  },
  {
    id: "aiIntelligence",
    href: "/dashboard/ai",
    roles: ["all"],
  },
  {
    id: "clientCollaboration",
    href: "/dashboard/notifications",
    roles: ["manager", "admin", "client", "owner"],
  },
  {
    id: "mobileApps",
    href: "/mobile",
    roles: ["all"],
  },
];

