# Field Daily Log (contractor-ops)

Contractor field notes: **photo/note → editable draft → human confirm**.

This is **not** the Phase 7 manager/owner daily digest and **not** `POST /api/v1/ai/analyze-video-daily` (one-shot Gemini video analysis). Confirm is a human gate; AI may seed a draft later but must never call confirm automatically.

**Code:** `apps/web/lib/domain/field-daily-log/` · routes under `apps/web/app/api/v1/projects/[id]/field-daily-logs/`  
**UI:** dashboard project detail → Field daily log (`ProjectFieldDailyLogPanel`)  
**API table:** [API-v1-ENDPOINTS.md](../API-v1-ENDPOINTS.md#field-daily-log-contractor-ops)  
**Task:** TASK-AISTROYKA-003 · table `public.field_daily_logs`

---

## Intent

Keep a per-project site log that a contractor can edit while it is a draft, then lock with attribution (`confirmed_by`, `confirmed_at`). Portal stakeholders are denied on the official API.

## Workflow

1. Open `/[locale]/dashboard/projects/:id` (cookie session).
2. **Create draft** — `POST /api/v1/projects/:id/field-daily-logs` with `work_date` (`YYYY-MM-DD`) plus at least one of: `note`, `summary`, `work_done`, `blockers`, `weather`, or non-empty `media_refs`.
3. **Edit draft** — `PATCH /api/v1/projects/:id/field-daily-logs/:logId`. Confirmed rows return **409** (`Only draft logs can be edited`).
4. **Confirm** — `POST /api/v1/projects/:id/field-daily-logs/:logId/confirm`. Sets `status=confirmed` and records the caller. Already-confirmed → **409**.
5. **List** — `GET .../field-daily-logs?work_date=&status=&limit=` (default 50, max 100). Dashboard uses `limit=20`.

There is **no delete** route. Multiple logs per `work_date` are allowed (no unique constraint).

```http
POST /api/v1/projects/11111111-1111-1111-1111-111111111111/field-daily-logs
Content-Type: application/json

{
  "work_date": "2026-09-16",
  "note": "poured slab",
  "weather": "overcast",
  "media_refs": ["upload-session-or-media-id"]
}
```

```json
{
  "data": {
    "id": "…",
    "project_id": "…",
    "tenant_id": "…",
    "work_date": "2026-09-16",
    "status": "draft",
    "note": "poured slab",
    "summary": null,
    "work_done": null,
    "blockers": null,
    "weather": "overcast",
    "media_refs": ["upload-session-or-media-id"],
    "created_by": "…",
    "confirmed_at": null,
    "confirmed_by": null,
    "created_at": "…",
    "updated_at": "…"
  }
}
```

Empty `PATCH` body is a no-op: the route returns the current row.

## Auth and who can call

| Gate | Behavior on `main` (verified in service + routes) |
|------|---------------------------------------------------|
| Tenant JWT | `getTenantContextFromRequest` + `requireTenant` → **401** if no tenant |
| Portal stakeholder | `isPortalOnlyStakeholderRole` → **403** `Portal access not allowed` |
| Project read | `canReadProjects` (`project:read`, viewer+) required for list **and** writes |
| Project exists | Missing / wrong tenant → **404** `Project not found` or `Not found` |
| Lite / worker clients | **403** `lite_client_path_forbidden` — path is under `/api/v1/projects/:id/…`, which is not on the lite allow-list (`apps/web/lib/api/lite-allow-list.ts`). Only exact `GET /api/v1/projects` is allowed for those clients. |

Official API writes currently use the same reader gate as list (viewer+). That is application policy, not a member-only write role.

## Storage and RLS (current migration)

Migration: `apps/web/supabase/migrations/20260916120000_field_daily_logs.sql`.

- Status check: `draft` \| `confirmed`.
- RLS policy `field_daily_logs_tenant_member` is **`FOR ALL`** for tenant members (or tenant owner). The **draft-only / no-delete / portal-deny** contract is enforced in the Next.js service, not as a status window in that policy.
- Applying the migration on staging/production is **owner/ops** (comment in the SQL). Shipping the app routes does not create the table.

Do not treat PostgREST `/rest/v1/field_daily_logs` as the product API. Use `/api/v1/projects/:id/field-daily-logs`.

## Constraints and pitfalls

- **`work_date`** must match `YYYY-MM-DD` or create/update returns a 400/409 (`work_date required (YYYY-MM-DD)`). Create without a body (no text and no `media_refs`) → **400** `note, structured fields, or media_refs required`.
- **`media_refs`** are opaque strings. The API does not resolve or finalize upload sessions; the dashboard field is a single optional id.
- **Confirm is not idempotent.** Second confirm is 409. There is no unconfirm/reopen path.
- **AI / video daily** lives on a different route and does not write this table. Do not wire auto-confirm from Copilot or `analyze-video-daily`.
- **iOS/Android Worker** cannot call these routes while sending `x-client: ios_lite|android_lite|ios_worker|android_worker`.
- Locale copy: `projectDetail.fieldDaily*` in `en` / `ru` / `es` / `it`.

## Local checks

```bash
# Domain gates (draft-only edit/confirm, portal deny, empty-body reject)
bun run --cwd apps/web test lib/domain/field-daily-log/field-daily-log.service.test.ts
```

If list/create 404s against a live project after deploy, the table is probably missing on that Supabase project — apply the migration, do not invent a client fallback.
