import { PLATFORM_ADMIN_BASE_PATH } from "./constants";

export type PlatformAdminNavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

/** Shared platform admin shell navigation (server + client safe). */
export const PLATFORM_ADMIN_SHELL_NAV_ITEMS: readonly PlatformAdminNavItem[] = [
  { href: PLATFORM_ADMIN_BASE_PATH, label: "Overview", exact: true },
  { href: `${PLATFORM_ADMIN_BASE_PATH}/billing`, label: "Billing pilot" },
  { href: `${PLATFORM_ADMIN_BASE_PATH}/leads`, label: "Contact leads" },
  { href: `${PLATFORM_ADMIN_BASE_PATH}/testing`, label: "ROMA QA Center" },
] as const;
