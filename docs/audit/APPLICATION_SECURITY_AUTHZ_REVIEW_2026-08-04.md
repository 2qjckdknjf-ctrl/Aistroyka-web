# Application security review — authorization / auth (API)

**Date:** 2026-08-04  
**Scope:** `apps/web/app/api/` (priority: IDOR, public routes, webhooks, SCIM/owner/break-glass, lite allow-list, stakeholder portal)  
**Branch / tree:** workspace `cursor/application-security-vulnerabilities-d712` @ current HEAD (based on `main`)  
**Method:** Concrete code-path tracing + live probes of staging/production for reachability/fail-closed behavior. Speculative issues dismissed.

**Live deploy note:** Production/staging `buildStamp.sha7 = 8408ca2` is **not** the same commit line as this workspace `main`. Several authz fixes (unconditional `requireTenant` on vision routes; tenant-scoped `analysis/process`) exist on that deployed SHA but are **absent** from this tree. Findings below are validated against **this workspace**. Live status is noted per finding.

---

## Validated findings (medium+)

### Finding A — HIGH: Cross-tenant analysis job processing via service role

| Field | Value |
|---|---|
| **Severity** | High |
| **Attacker** | Any authenticated Supabase user (tenant membership **not** required) |
| **Controlled input** | `POST` with session cookie / Bearer; no body required |
| **Reachability** | `POST /api/analysis/process` and `POST /api/v1/analysis/process` (re-export) |
| **Live (8408ca2)** | Unauthenticated → `401`. Deployed tree uses tenant-scoped `handleAnalysisProcessPost` / `dequeue_tenant_job` — **fixed on deploy, still open in this workspace** |

**Code path (workspace):**

1. `apps/web/app/api/analysis/process/route.ts` — `getSessionUser` only; no `requireTenant`, no role check.
2. Uses `getAdminClient()` (service role) and `processOneJob(admin, aiUrl, …)`.
3. `apps/web/lib/ai/runOneJob.ts` calls global RPC `dequeue_job` (no tenant filter), then reads `media.file_url` / `project_id` and can `complete_analysis_job` / `markJobFailed` for **any** tenant’s job.
4. `apps/web/app/api/v1/analysis/process/route.ts` re-exports the same handler.

**Impact:** Cross-tenant integrity / DoS against the AI job queue (dequeue + fail/complete foreign jobs); service-role read of other tenants’ media metadata; possible mutation of analysis results. Privilege boundary is only “logged in.”

---

### Finding B — HIGH: Missing auth on vision/video analysis when `project_id` omitted (workspace regression vs live)

| Field | Value |
|---|---|
| **Severity** | High (authz + cost abuse; pairs with prior SSRF review) |
| **Attacker** | Unauthenticated internet client |
| **Controlled input** | JSON `image_url` / `video_url` |
| **Reachability** | `POST /api/v1/ai/analyze-image` (omit `project_id`); `POST /api/v1/ai/analyze-video-daily`; legacy `POST /api/ai/analyze-image` |
| **Live (8408ca2)** | Both vision routes return `401 Authentication required` unauthenticated — **fixed on deploy**. Legacy `/api/ai/analyze-image` → `307` to v1. **This workspace still has the gap.** |

**Code path (workspace):**

1. `apps/web/app/api/v1/ai/analyze-image/route.ts` — `requireTenant` only inside `if (projectId) { … }`. Omitting `project_id` skips auth.
2. `apps/web/app/api/v1/ai/analyze-video-daily/route.ts` — loads `getTenantContextFromRequest` but never calls `requireTenant`.
3. `analyzeImage` / video path skip `runPolicy` when `tenantId` is null (`ai.service.ts`), then invoke providers that server-fetch the URL.
4. Middleware matcher only special-cases `/api/v1/*` for lite allow-list; it does **not** require a session for API routes.

**Impact:** Unauthenticated AI provider spend; unauthenticated SSRF/content-fetch class (see companion SSRF review). Shipping this tree over production would re-open a closed live gate.

---

### Finding C — MEDIUM: Tenant admin reads platform-wide feature-flag allowlists (cross-tenant metadata)

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Attacker** | Authenticated tenant `owner` / `admin` (`admin:read`) |
| **Controlled input** | Authenticated `GET` (no special params) |
| **Reachability** | `GET /api/v1/admin/flags` |
| **Live (8408ca2)** | Same pattern still present on that SHA (`listFlags` via admin client; POST is platform-owner gated, GET is not) |

**Code path:**

1. `apps/web/app/api/v1/admin/flags/route.ts` `GET` — `requireTenant` + `requireAdmin(ctx, "read")` only.
2. Uses `getAdminClient()` + `listFlags(admin)`.
3. `flags.repository.ts` selects `allowlist_tenant_ids` for **all** platform flags.

**Impact:** Cross-tenant information disclosure (which tenant UUIDs are on beta/allowlists, rollout config). Write path is correctly locked to platform owner; read path is not.

---

## Priority surfaces — checked and dismissed (with rationale)

| Surface | Result | Why dismissed / notes |
|---|---|---|
| **Share/proof** `GET /api/v1/share/proof/:token` | Dismissed | Capability URL by design; token = UUID hex (~122 bits); service role only after token lookup; revoked/expired checked; public audience + finance guard. Live unknown token → `404`. |
| **Invite-preview** `GET /api/v1/tenant/invite-preview` | Dismissed | Uses user/anon client; RLS on `tenant_invitations` grants only authenticated members/invitee email — no `anon` select grant. Unauth → empty/`404`. Valid token disclosure of email/role/tenantName is intentional for invite UX. |
| **Accept invite / stakeholder accept** | Dismissed | Auth required; email match enforced; stakeholder role insert gated; no cross-email accept. |
| **Incoming webhooks** `/api/v1/webhooks/incoming` (+ legacy alias) | Dismissed (live fail-closed) | Prod enforces signature unless `WEBHOOK_INCOMING_ALLOW_UNSIGNED=true`; missing secret → `503`. Live both envs returned `503` (secret unset + enforcement on). Handler only publishes in-memory domain events (no privileged DB writes). HMAC compare not constant-time → low only. |
| **Stripe webhooks** `/api/v1/billing/webhook`, `/api/v1/billing/webhooks/stripe` | Dismissed | `constructEvent` / ingress verify required; missing/invalid sig → `400`/`503`. Live production → `Invalid signature`; staging → not configured. |
| **Telegram webhook** | Dismissed for medium+ | Prod requires secret when `NODE_ENV=production`; binds chat only via one-time link token. Non-prod unsigned is env-scoped. |
| **SCIM** `/api/v1/scim/*` | Dismissed | Always `501`; does not check bearer token but has no mutating implementation. Live → `SCIM not available`. |
| **Platform owner / break-glass** | Dismissed | Owner APIs use `requirePlatformOwnerApi` (grant, host, optional secret, step-up for critical). No API route creates `platform_break_glass_grants` (RLS table only). Live `/api/v1/owner/overview` → `403 owner_gate`. |
| **ops/metrics / system metrics / health** | Dismissed | `ops/metrics` requires tenant context. `/api/v1/system/*` + `/api/system/*` use `requireSystemRouteAuth` (prod requires `SYSTEM_API_KEY`). Public `/api/v1/health` returns build/config booleans only (no tenant data). |
| **Lite allow-list bypass** | Dismissed | Omitting `x-client` skips the restriction by design; privileged routes enforce their own auth/RBAC. Path allow-list is a mobile surface shrink, not the sole authz boundary. Lite cannot hit admin/AI manager paths when header present. |
| **Stakeholder portal / sync** | Dismissed | Portal services check stakeholder/project access. `change_log` / sync cursors RLS uses `is_internal_tenant_reader_for_tenant` (excludes `stakeholder`). Worker summary counts are RLS-filtered. |
| **Classic IDOR on reports/tasks/projects** | Dismissed (sampled) | Reports/tasks scope by `tenantId` + role/assignment; report review checks project membership; export requires admin/owner + reviewer; SLO tenant path compares `tenantId === ctx.tenantId`. |
| **Cron tick / schedule-reconcile** | Dismissed under intended config | Secret required when `NODE_ENV=production` or `REQUIRE_CRON_SECRET=true`; unauthenticated cron-secret callers allowed by design; authenticated non-owners blocked. |

---

## Recommended remediations (authz)

1. Port production’s tenant-scoped analysis process handler (`dequeue_tenant_job` + `requireTenant` + deny lite) into this tree; delete global `dequeue_job` from user-facing HTTP paths.
2. Unconditionally `requireTenant` on `analyze-image`, `analyze-video-daily`, and ensure legacy `/api/ai/*` only redirect to gated v1 (match live `8408ca2`).
3. Lock `GET /api/v1/admin/flags` to platform owner (same as POST), or strip `allowlist_tenant_ids` from tenant-admin responses.
4. Keep webhook/Stripe fail-closed; never set `WEBHOOK_INCOMING_ALLOW_UNSIGNED=true` in production.

---

## Related prior findings on this branch

See `docs/audit/APPLICATION_SECURITY_REVIEW_2026-08-04.md` for SSRF / billing open-redirect findings from the companion pass.
