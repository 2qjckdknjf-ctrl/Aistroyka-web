# AI Security & Governance Audit

**Date:** 2026-06-04

---

## Auth on AI routes

| Route class | Auth pattern | Verdict |
|-------------|--------------|---------|
| Project-scoped (`copilot`, `intelligence`, `projects/:id/ai`) | `getTenantContextFromRequest` + `requireTenant` + `getProject` | **PASS** |
| Tenant AI (`/api/v1/ai/*`) | Tenant context; vision/transcribe also rate-limit/quota | **PASS** |
| Memory / eval / optimization | Tenant + project membership checks on memory routes | **PASS** |
| Admin (`admin/ops/ai-runtime`, `admin/ai/usage`) | `requireAdmin` | **PASS** |
| System health/metrics | `requireSystemRouteAuth` (production `SYSTEM_API_KEY`) | **PASS** |
| Legacy `/api/ai/*` | Same handlers as v1 where shared | **PASS** (duplicate surface) |

**Lite client note:** `ios_lite` / `android_lite` allow-list in middleware applies to `/api/v1/*` — AI paths must remain on allow-list if used from lite profiles (verify `lite-allow-list.ts` when enabling new AI routes).

---

## Tenant boundaries

- Supabase RLS on `ai_chat_threads` / `ai_chat_messages` — member or owner tenant match.
- Domain services pass `tenantId` into ai-brain queries.
- **Tests (2026-06-04):** Route tests assert 403 on `analyze-image` (with `project_id`), intelligence GET, copilot GET, copilot stream POST when `getProject*` returns `Insufficient rights`.

---

## Project access

- `getProject(supabase, ctx, id)` → 403 `Insufficient rights` / 404.
- `POST /api/v1/ai/analyze-image` with `project_id`: `getProjectForInternalWorkspace` before vision call (2026-06-04).
- Stream thread load filters `tenant_id` + `project_id`.

---

## Role requirements

- Intelligence/copilot: tenant member (not customer-portal scoped in this audit).
- Admin AI rollup: owner/admin via `requireAdmin`.
- **Customer/owner finance isolation:** Intelligence route returns operational signals — audit did not find internal cost/margin fields in intelligence JSON types (`intelligence-output.types.ts`). Portfolio control is contractor-facing.

---

## Prompt / context exposure

| Vector | Control |
|--------|---------|
| Logs | Telemetry + audit typed without prompts |
| API errors | Generic messages; gate returns code not stack |
| SSE fallback | Includes truncated user text — tenant-scoped session risk only |
| Admin diagnostics | `intelligence_diagnostics` — metadata only |

---

## Provider key exposure

- Keys read server-side via `getServerConfig()` only.
- `OPENAI_API_KEY` in `NEXT_PUBLIC_*` — **not used** for secrets (verified pattern in server config).
- Wrangler deploy sets `AI_ANALYSIS_URL` — not a secret.

---

## Streaming leakage

- SSE responses do not include system prompt.
- `meta` exposes token estimates — acceptable for same user.

---

## System route protection

- `apps/web/lib/system/system-route-auth.ts` used by `/api/system/health`.
- Production requires `X-System-Key` when `SYSTEM_API_KEY` set.

---

## Cross-tenant test coverage

| Test | Present? |
|------|----------|
| Report task-link cross-tenant | Yes (`report.service.task-link.test.ts`) |
| AI route cross-tenant (403 on wrong project) | **Yes** — analyze-image, intelligence, copilot GET, stream POST |
| Copilot thread cross-tenant | **Partial** — route returns 404 when `thread_id` not visible (tenant/project filter + RLS); vitest covers missing thread |
| Lite client on manager AI paths | **Yes** — `lite-allow-list.test.ts` blocks copilot/intelligence/analyze-image for `ios_lite` |

---

## Governance

- Policy engine records `ai_policy_decisions`.
- PII redaction utility exists (`redaction.service.ts`) — not verified on all AI log paths in this audit.

---

## Security verdict

**Status:** **CONDITIONAL PASS** — Core auth/tenant/project gates implemented; route-level cross-tenant tests added 2026-06-04. Remaining gap: lite-allow-list discipline for new mobile endpoints and dedicated RLS integration tests for chat threads.
