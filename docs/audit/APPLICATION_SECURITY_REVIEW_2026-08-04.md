# Application security review — validated medium+ findings

**Date:** 2026-08-04  
**Scope:** `apps/web` runtime/API paths and production-facing scripts under `scripts/`  
**Branch:** `cursor/application-security-vulnerabilities-d712`  
**Method:** Pattern grep + code-path validation (SQLi, command injection, path traversal, SSRF, secret leakage, XSS, deserialization/prototype pollution, open redirects). Speculative issues dismissed.

## Verdict

Three validated medium+ issues with real attack paths were found, all in the SSRF / open-redirect classes. No validated medium+ findings for SQLi, command injection, path traversal, XSS, unsafe deserialization/prototype pollution, or committed/runtime secret leakage in the checked surfaces.

---

## Finding 1 — HIGH: Unauthenticated SSRF (+ AI cost abuse) via vision/video URLs

### Attacker
Unauthenticated internet client (no session required when `project_id` is omitted).

### Controlled input
JSON body field `image_url` or `video_url` (arbitrary `http:`/`https:` URL; production requires `https:`).

### Code path
1. `POST /api/v1/ai/analyze-image` — auth/`requireTenant` only when `project_id` is set (documented in route header comments). Omitting `project_id` skips tenant checks. Middleware allows `/api/v1/*` through without session auth.
2. `POST /api/v1/ai/analyze-video-daily` — no `requireTenant` at all.
3. Legacy `POST /api/ai/analyze-image` — same optional-auth pattern.
4. URL “validation” only checks length + `http`/`https` (and https-in-production). No host allowlist, no block of loopback/link-local/metadata/private ranges, no DNS rebinding controls.
5. Server-side sinks:
   - Gemini: `fetch(imageUrl)` then base64 inline (`lib/platform/ai/providers/provider.gemini.ts`)
   - Anthropic: `fetch(imageUrl)` then base64 (`provider.anthropic.ts`)
   - Video: `fetchBinaryWithByteCap(videoUrl)` (`lib/platform/ai/fetch-binary-capped.ts` via `ai.service.ts`)
   - OpenAI: passes attacker URL into the OpenAI API `image_url` field (third-party fetch)

### Impact
- Server-side request forgery: Worker/runtime fetches attacker-chosen HTTPS URLs.
- Content of reachable URLs can be reflected into structured AI analysis returned to the caller.
- Unauthenticated abuse of paid vision/video providers (quota/cost DoS).
- IP-based rate limiting softens volume but does not remove SSRF.

**Note:** Cloudflare Workers typically block RFC1918/link-local fetches; that reduces classic cloud-metadata SSRF but does **not** remove arbitrary public-URL SSRF, content reflection, or cost abuse.

### Key anchors
- `apps/web/app/api/v1/ai/analyze-image/route.ts` (`validateImageUrl`, conditional `requireTenant`)
- `apps/web/app/api/v1/ai/analyze-video-daily/route.ts`
- `apps/web/middleware.ts` (API matcher passes `/api/v1` without auth)
- `apps/web/lib/platform/ai/providers/provider.gemini.ts` / `provider.anthropic.ts`
- `apps/web/lib/platform/ai/fetch-binary-capped.ts`

---

## Finding 2 — MEDIUM: Authenticated SSRF via estimate-from-image (no URL validation)

### Attacker
Authenticated tenant member with project-manage rights (`canManageProjects`).

### Controlled input
JSON `image_url` on `POST /api/v1/projects/:id/estimate/from-image`.

### Code path
Route accepts any non-empty string as `image_url` (no `validateImageUrl`). Calls `analyzeImageForCost` → `invokeVisionWithRouter` → Gemini/Anthropic server-side `fetch(imageUrl)` (or OpenAI URL pass-through). UI (`ProjectEstimatePanel`) exposes a free-text image URL field.

### Impact
Same SSRF/content-reflection class as Finding 1, gated by auth + project rights. Still medium because any project manager can force the server to fetch arbitrary URLs and burn vision quota. Unlike analyze-image, there is **no** protocol/length check at the route boundary.

### Key anchors
- `apps/web/app/api/v1/projects/[id]/estimate/from-image/route.ts`
- `apps/web/lib/domain/estimate/estimate-cost.service.ts`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectEstimatePanel.tsx`

---

## Finding 3 — MEDIUM: Open redirect via Stripe billing return URLs

### Attacker
Authenticated user with `billing:admin` (or XSS/session theft of such a user).

### Controlled input
- `success_url` / `cancel_url` on `POST /api/v1/billing/checkout-session`
- `return_url` on `GET /api/v1/billing/portal`

### Code path
Route handlers pass client-supplied URLs straight into Stripe session creation with **no** same-origin / allowlist check (`billing.service.ts` → `success_url` / `cancel_url` / `return_url`). After checkout or portal exit, Stripe redirects the browser to the attacker URL.

### Impact
Phishing / credential harvesting after a trusted payment or billing-portal flow (user leaves `aistroyka.ai` / Stripe and lands on attacker domain). Requires billing-admin capability; still medium because the app never constrains destinations.

### Key anchors
- `apps/web/app/api/v1/billing/checkout-session/route.ts`
- `apps/web/app/api/v1/billing/portal/route.ts`
- `apps/web/lib/platform/billing/billing.service.ts`

---

## Categories checked — no validated medium+ finding

| Category | What was checked | Result |
|---|---|---|
| SQL injection | `.rpc(`, `client.query`, string-built SQL in `apps/web` runtime; migration scripts only read local `.sql` files | No user-controlled raw SQL in request paths; RPC args are objects |
| Command injection | `child_process` / `exec` / `spawn` / `eval` / `Function(` in `apps/web` and `scripts/` | Only build/dev/audit tooling with fixed argv; not request-driven |
| Path traversal | Upload routes, `readFile`/`writeFile`, document path builder | Document uploads sanitize extension; media object keys are UUID-prefixed; no FS read of user paths in APIs |
| Secret leakage | Debug/diag routes, API responses logging env/keys, committed secret patterns | Debug gated by `isDebugAuthAllowed` / host allowlist; responses avoid tokens; no committed live secrets found in sweep |
| XSS | `dangerouslySetInnerHTML`, `innerHTML`, markdown/HTML sinks | Only static JSON-LD via `JSON.stringify`; no stored HTML sinks found |
| Deserialization / prototype pollution | `vm`, `yaml.load`, `unserialize`, unsafe `merge` of request bodies | Not applicable / none found |
| Auth `next=` open redirects | `sanitizeNextRoute`, middleware post-auth, OAuth callback `toSafeRelativePath`, Telegram `toSafeNext`, login `window.location`, register `router.push` | Middleware/OAuth/Telegram block `//`; login prefixes locale so `//evil` stays same-origin; register uses next-intl with `localePrefix: "always"` which also prefixes (`//evil` → `/en//evil`) — **not** validated as external open redirect under current config |

---

## Recommended remediations (not implemented in this audit PR)

1. **Require auth** on all AI media-analysis routes (`analyze-image`, `analyze-video-daily`, legacy `/api/ai/*`) regardless of `project_id`.
2. Centralize URL policy: HTTPS only, allowlist trusted media hosts (e.g. Supabase storage / `AI_TRUSTED_IMAGE_HOSTS`), block localhost/metadata/private/link-local, reject credentials in URLs; apply before any provider fetch.
3. Prefer server-resolved signed storage URLs over client-supplied remote URLs for vision/video.
4. Allowlist billing `success_url` / `cancel_url` / `return_url` to `NEXT_PUBLIC_APP_URL` origin (path-only or same-origin absolute).
5. Reuse `sanitizeNextRoute` for all client post-auth navigations (login/register) for defense in depth.
