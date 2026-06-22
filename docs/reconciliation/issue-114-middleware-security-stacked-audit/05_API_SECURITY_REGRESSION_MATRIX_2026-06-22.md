# API Security Regression Matrix

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

|Route / area|Expected behavior|Known coverage|Missing / follow-up checks|Risk|
|---|---|---|---|---|
|`PATCH /api/v1/reports/:id`|Tenant owner/admin or explicit project manager only; lite/worker denied; audit after success.|PR #109 route tests cover member denied, worker denied, spoofed header denied, manager/admin allowed, invariants.|Post-baseline runtime role smoke with mobile/web manager fixture.|High if regressed.|
|`GET /api/v1/reports/export`|Owner/admin only, no lite, safe CSV columns, tenant/project scoped.|PR #109 tests and hosted role-gate evidence.|Recheck after middleware/header changes to ensure CSV headers/security unaffected.|High if exposed.|
|Lite mobile allow-list|`ios_worker/android_worker` limited to worker-safe routes.|`lite-allow-list` logic present; PR #109 security review considered spoofing separately.|Add tests when allow-list changes; verify route handlers still enforce own-report/project isolation.|High.|
|Owner API/page routes|Platform-owner grant, session freshness, optional secret/IP/host/rate gates.|Owner middleware and route helpers exist; owner route tests elsewhere in repo.|Future middleware changes must prove owner gate still runs and rate-limit marker remains correct.|High.|
|System health/metrics|Production requires configured key and `X-System-Key`; no health payload on unauthorized.|`system-route-auth.test.ts` covers core cases.|Cloudflare env smoke after any system route/config change.|Medium/high.|
|API security headers|API hardening headers without CSP.|Unit tests cover required API header key list.|Smoke actual `/api/*` responses on Cloudflare/OpenNext; middleware `NextResponse.next()` may not attach headers.|Medium.|
|Auth callback|No open redirects or broken session exchange.|Auth callback tests exist; auth branch has stale changes.|Do not port stale auth callback changes without test replay.|High.|
|Tenant invite/revoke/member routes|Owner/admin role enforcement, no stakeholder/customer escalation.|Tenant route tests partly exist.|Manual route-by-route inventory if stale auth/system branches are revisited.|High.|
|Portal/customer routes|No internal finance data leakage.|Customer finance guard tests and portal route tests exist for several routes.|Any design/security change touching owner/customer surfaces must rerun finance guards.|P0 if regressed.|
|Sync changes/ack/bootstrap|Tenant/device scoped, 409 contract stable.|Sync tests exist; security infra branch touches sync.|Review sync security branch separately; do not broad merge.|Medium/high.|

## Regression Principles

- Middleware can reduce surface area but route handlers remain authority.
- UI gates are not security boundaries.
- Client profile headers are defense-in-depth only and must not grant privileges.
- Platform owner is not the same as tenant owner.
- Owner/customer routes must never expose internal company financial state.

## Matrix Verdict

Critical API routes have meaningful tests, but middleware/header/security changes still require focused route-level and runtime smoke checks before merge.
