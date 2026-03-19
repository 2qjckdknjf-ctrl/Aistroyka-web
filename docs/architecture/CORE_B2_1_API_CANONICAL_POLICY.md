# B2.1 — API canonical ownership policy — AISTROYKA

**Date:** 2026-03-18  
**Scope:** Web/API surface in `apps/web/app/api/*`. No mobile changes in this step.

---

## A. Canonical decision

- **Canonical surface:** `https://…/api/v1/*`  
  - Versioned, documented in `docs/SYSTEM_REPOSITORY_MAP.md`, `docs/pilot/*`, and used by web dashboard and mobile clients (see `REPORT-PHASE4-MOBILE-RELIABILITY.md`).  
  - Lite allow-list (`lib/api/lite-allow-list.ts`) is explicitly defined in terms of **`/api/v1/...`** paths.
- **Legacy / compatibility surface:** `/api/*` (non-versioned)  
  - Examples: `/api/health`, `/api/activation/status`, `/api/ai/analyze-image`, `/api/projects`, `/api/projects/[id]`, `/api/system/metrics`.  
  - Some have v1 wrappers (e.g. `/api/v1/ai/analyze-image` re-exports from `/api/ai/analyze-image`), some do not.
- **Why:**  
  - `/api/v1` already underpins Lite allow-list, mobile reliability docs, and most new dashboard code.  
  - Keeping `/api/*` purely as a thin compatibility layer (with explicit deprecation headers and `Link: </api/v1/...>` where applicable) lets us migrate safely without breaking existing clients.

---

## B. Current usage map

### 1. Routes and re-exports

- **Projects collection:**  
  - `app/api/projects/route.ts` → implements `/api/projects` (legacy) and sets `Link: </api/v1/projects>; rel="successor"`.  
  - `app/api/v1/projects/route.ts` → `export { GET, POST } from "@/app/api/projects/route";` ⇒ v1 route is an alias to legacy implementation.
- **Project detail:**  
  - `app/api/projects/[id]/route.ts` → `/api/projects/[id]`, comment: “Prefer GET /api/v1/projects/[id]”.  
  - `app/api/v1/projects/[id]/route.ts` → independent v1 handler using `getProject` service.
- **AI analyze-image:**  
  - `app/api/ai/analyze-image/route.ts` → `/api/ai/analyze-image` (heavy route, already marked legacy via `setLegacyApiHeaders`).  
  - `app/api/v1/ai/analyze-image/route.ts` → re-exports `POST` from `/api/ai/analyze-image`.
- **Other v1-only routes:**  
  - Most worker/sync/media/billing/admin/org routes exist **only** under `/api/v1/...` (see `docs/SYSTEM_REPOSITORY_MAP.md` and the `app/api/v1/*` tree).
- **Legacy-only routes (no v1 alias yet):**  
  - `/api/health`, `/api/health/auth`, `/api/system/metrics`, `/api/activation/status`, some internal/debug paths. These are not versioned.

### 2. Client usage (web)

- **Uses `/api/v1/...`:**  
  - Dashboard workers, reports, documents, costs, intelligence, devices, etc. — multiple dashboard components fetch `/api/v1/*` directly (e.g. `DashboardWorkersClient`, `ProjectDocumentsPanel`, `DashboardReports` page).  
  - AI/chat: `lib/features/ai/api/chatApi.ts` → `/api/v1/projects/:id/copilot/chat/stream`.  
  - Worker and sync flows: see `REPORT-PHASE4-MOBILE-RELIABILITY.md` and Lite allow-list tests.
- **Uses `/api/projects*` (legacy) from web:**  
  - `lib/projects/useProjects.ts` → `/api/projects` (was legacy; now updated to `/api/v1/projects`).  
  - `lib/projects/useProject.ts` → `/api/projects/:id` (was legacy; now `/api/v1/projects/:id`).  
  - UI components still referencing `/api/projects/...` for non-v1-specific operations (upload, triggers, poll-status):  
    - `app/[locale]/(dashboard)/projects/UploadMediaForm.tsx` → `/api/projects/:id/upload`  
    - `app/[locale]/(dashboard)/projects/TriggerAnalysisButton.tsx` → `/api/projects/:id/media/:mediaId/trigger`  
    - `app/[locale]/(dashboard)/projects/JobListPolling.tsx` → `/api/projects/:id/poll-status`
- **Docs:**  
  - `docs/SYSTEM_REPOSITORY_MAP.md` already distinguishes legacy `/api/*` vs versioned `/api/v1/*`.  
  - Mobile/docs use `/api/v1/...` consistently for worker/sync/media/device endpoints.

---

## C. Migration policy (B2.1 scope)

### What can be changed now (B2.1)

- **Web-only client alignment where v1 is guaranteed present and equivalent:**  
  - Hooks `lib/projects/useProjects.ts` and `lib/projects/useProject.ts` now call `/api/v1/projects` and `/api/v1/projects/:id` respectively. This is safe because:  
    - `/api/v1/projects/route.ts` maps to the same handlers as `/api/projects`.  
    - `/api/v1/projects/[id]` already exists and is the documented successor for detail.
- **Policy docs:**  
  - This file (`CORE_B2_1_API_CANONICAL_POLICY.md`) codifies that **new consumers** must use `/api/v1/*`.  
  - Legacy `/api/*` routes are explicitly described as compatibility or internal-only.
- **Deprecation headers (already present):**  
  - Continue to use `setLegacyApiHeaders` + `Link: </api/v1/...>; rel="successor"` on legacy routes we keep.

### What must remain as compatibility (for now)

- All existing `/api/*` handlers, especially those potentially used by **mobile** or external clients:
  - `/api/projects*` routes (list, detail, upload, poll-status, triggers).  
  - `/api/ai/analyze-image` (even though `/api/v1/ai/analyze-image` exists).  
  - `/api/health`, `/api/activation/status`, `/api/system/metrics`, and other non-versioned ops.
- Re-export patterns (`/api/v1/ai/analyze-image`, `/api/v1/projects`) stay in place; they are the canonical entry points but rely on legacy implementation details internally.

### What must wait (post-B2.1)

- Removing or hard-deprecating `/api/projects` and `/api/projects/[id]` routes. Requires:
  - Inventory of **all** consumers (including mobile).  
  - A deprecation window and possibly API gateway mapping.
- Introducing v1 aliases for legacy-only endpoints (`/api/system/metrics`, `/api/health`, etc.), if desired.
- Reworking the heavy `/api/ai/analyze-image` route to sit behind an AI service + provider router (already captured in `ARCHITECTURE_STATE_ANALYSIS`).

---

## D. Summary of B2.1 code alignment

- **Changed web hooks:**  
  - `lib/projects/useProjects.ts`: `fetch("/api/projects")` → `fetch("/api/v1/projects")`.  
  - `lib/projects/useProject.ts`: `fetch(\`/api/projects/${projectId}\`)` → `fetch(\`/api/v1/projects/${projectId}\`)`.
- **Compatibility kept:**  
  - `/api/projects` and `/api/projects/[id]` routes remain; no handlers removed or renamed.  
  - `/api/v1/projects` still re-exports from `/api/projects`, so behavior is consistent across both surfaces.

These are intentionally **small, non-breaking** changes that move primary web consumers toward the canonical `/api/v1` surface while leaving all legacy routes intact for now.\n"}*** End Patch" }```} -->
