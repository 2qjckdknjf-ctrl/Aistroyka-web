# Release Audit — Phase 6: Auth / Security / Compliance Audit

**Generated:** Release Readiness Audit

---

## 1. Attack Surface Overview

- **Web app:** Next.js app with locale routes; middleware runs updateSession (Supabase), intl, protected-path redirect, lite allow-list for /api/v1.
- **API:** 90+ route handlers; mix of public (health, config, login, webhook), tenant-authenticated (v1, tenant/*), admin (requireAdmin), and system (cron-tick with CRON_SECRET).
- **Debug/diag:** /api/_debug/auth, /api/diag/supabase gated by isDebugAuthAllowed / isDebugDiagAllowed. In production (NODE_ENV=production), default is false unless DEBUG_AUTH/DEBUG_DIAG/ENABLE_DIAG_ROUTES set; ALLOW_DEBUG_HOSTS restricts by host when set.
- **Mobile:** iOS manager and lite; x-client header; lite restricted to worker/sync/media/devices/config.

---

## 2. Critical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Debug/diag in production | High if enabled | Ensure ENABLE_DIAG_ROUTES and DEBUG_* not set in prod; or set ALLOW_DEBUG_HOSTS to empty or non-public host |
| Cron-tick unprotected | High if no secret | Set REQUIRE_CRON_SECRET=true and CRON_SECRET in prod |
| Webhook forgery | Medium | Stripe signature verified in webhook handler |
| Tenant leakage | Low | RLS + requireTenant; no evidence of cross-tenant data in responses |
| Admin bypass | Low | requireAdmin after tenant; admin flag checked |

---

## 3. Likely Exploit Vectors

- **Cron:** If CRON_SECRET is weak or missing when REQUIRE_CRON_SECRET=true, cron-tick could be called by anyone. **Fix:** Strong secret; use Cloudflare cron or scheduler with header.
- **Debug:** If ENABLE_DIAG_ROUTES=true in prod and ALLOW_DEBUG_HOSTS is broad, _debug and diag could leak session/cookie presence and Supabase connectivity. **Fix:** Do not enable in prod; or restrict ALLOW_DEBUG_HOSTS to internal only.
- **File upload:** Upload flow uses signed URLs / upload_sessions; validation of MIME and size in finalize. Path traversal: object_path stored; ensure storage bucket policies and path validation prevent escape. **Recommendation:** Audit storage paths and bucket policies.
- **SSRF:** Image analysis accepts URL; code validates non-http in production (route test). Ensure all call paths enforce URL allow-list.
- **Verbose errors:** Some routes return generic "Processing failed" or error codes; avoid leaking stack or internal details in prod.

---

## 4. Mitigation Recommendations

- Confirm production env: no DEBUG_AUTH, no ENABLE_DIAG_ROUTES (or ALLOW_DEBUG_HOSTS strictly internal).
- Require CRON_SECRET for cron-tick in production; use scheduler with header.
- Rotate SUPABASE_SERVICE_ROLE_KEY and Stripe webhook secret on schedule; document rotation.
- Keep security headers (middleware): X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP, HSTS in production.
- Add rate-limiting on login and sensitive public endpoints if not already (rate_limit_slots used for jobs/process).

---

## 5. Release Status from Security Perspective

- **Status:** Acceptable for pilot/beta with conditions.
- **Blockers:** Ensure cron secret and debug/diag configuration in production as above.
- **No critical auth bypass or tenant leak identified in code.**
