/**
 * Stable JSON responses for billing when Stripe or backend is not configured.
 * Use when getAdminClient() is null or Stripe env vars are missing.
 */

export const BILLING_503_BODY = {
  error: "service_unavailable",
  code: "stripe_not_configured",
} as const;
