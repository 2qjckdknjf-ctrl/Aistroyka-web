/** Canonical platform admin UI path (locale-prefixed in App Router). */
export const PLATFORM_ADMIN_BASE_PATH = "/platform-admin";

/** Canonical platform admin API namespace. */
export const PLATFORM_API_PREFIX = "/api/v1/platform";

/** Legacy owner API alias (Phase 1 deprecation). */
export const LEGACY_OWNER_API_PREFIX = "/api/v1/owner";

/** Deprecated tenant-admin alias for platform billing APIs (Phase 2B.3 middleware depth). */
export const LEGACY_ADMIN_BILLING_API_PREFIX = "/api/v1/admin/billing";

/** Deprecated tenant-admin alias for platform leads APIs (Phase 2B.3 middleware depth). */
export const LEGACY_ADMIN_LEADS_API_PREFIX = "/api/v1/admin/leads";

/** Preferred production host (Phase 1: optional; enforced when OWNER_ALLOWED_HOSTS is set). */
export const PLATFORM_ADMIN_PREFERRED_HOST = "admin.aistroyka.ai";
