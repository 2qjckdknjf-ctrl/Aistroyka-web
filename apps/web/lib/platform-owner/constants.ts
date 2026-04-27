/** Platform cabinet roles — not tenant_members.owner. */
export const PLATFORM_OWNER_ROLES = ["OWNER", "OWNER_READONLY", "OWNER_OPERATOR"] as const;

export type PlatformOwnerRole = (typeof PLATFORM_OWNER_ROLES)[number];

export const OWNER_SECRET_HEADER = "x-owner-key";

/** HMAC step-up for critical owner mutations (see owner-step-up.ts). */
export const OWNER_STEP_UP_HEADER = "x-owner-step-up";

/** Optional TOTP for owner UI/API when OWNER_TOTP_SECRET is set (RFC 6238, base32). */
export const OWNER_TOTP_HEADER = "x-owner-totp";
