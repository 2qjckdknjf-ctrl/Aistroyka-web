# Customer portal intake

Customers describe requested work as a draft, edit it, then confirm it. List returns the tenant drafts the caller may read. Create, update, and submit change only the caller’s own rows in `customer_intake_drafts`. Submit stores `status = submitted` on that row. Contracts, estimates, and tasks stay unchanged.

Code:

- Routes: `apps/web/app/api/v1/portal/intake/`
- Domain: `apps/web/lib/domain/customer-intake/`
- Migration: `apps/web/supabase/migrations/20261003170000_customer_intake_drafts.sql`
- Customer iOS: `CustomerAPI` in `ios/AiStroykaCustomer/` and `CustomerIntakeDraft` in `ios/Shared/`

Endpoint index: [API-v1-ENDPOINTS.md](../API-v1-ENDPOINTS.md).

## Live database

The migration is in the repo. Handoffs on 2026-10-05 recorded `customer_intake_drafts` as **absent** on the database they checked (`OWNER_GATE`, staging-first). Confirm `to_regclass('public.customer_intake_drafts')` before treating list/create failures as an app bug. Applying the migration is an owner step.

## Who can call it

Every route requires a signed-in user with a tenant (`401` `Tenant required` when that is missing).

Tenant for the query is chosen in this order (`resolvePortalIntakeTenant`):

1. Header `x-tenant-id`, or, when that header is absent, cookie `aistroyka_active_tenant`.
2. Else `project_id` on create, or `project_id` in a PATCH body, looked up on `projects`.
3. Else the session tenant from `getTenantContextFromRequest`, for roles other than `stakeholder`.

A stakeholder with no explicit claim and no `project_id` receives **400** `x-tenant-id or project_id is required for portal intake`. List and submit never pass a project hint, so a stakeholder needs the header or the cookie for those two calls.

An empty `x-tenant-id`, or a cookie value that fails to decode, counts as a present claim and returns **400** `x-tenant-id is required`. The project fallback is skipped in that case.

The explicit tenant is allowed for a tenant owner, a `tenant_members` row with role `owner` / `admin` / `member` / `viewer`, or an **active** `project_stakeholders` grant in that tenant. A `tenant_members.role = stakeholder` row alone is **403** `Insufficient rights`.

Session tenant selection prefers a tenant the user owns, then an internal membership over a stakeholder membership. A person who is both a contractor member and a portal stakeholder lists the contractor tenant unless they send `x-tenant-id`.

## Authorization on the row

RLS (`customer_intake_drafts_*`) also requires an **active** account (`accounts.status = active`). A missing, suspended, or closed account fails closed (`Insert denied` / `Update denied` → **403**).

| Action | Internal `owner` / `admin` / `member` | `viewer` | Stakeholder |
|--------|----------------------------------------|----------|-------------|
| List | Tenant drafts they can read | Same | Own rows, and only while the grant still matches the draft (`project_id` null → any active grant in the tenant; set → active grant on that project) |
| Create / update | Own rows (`created_by` = caller) | Denied | Own rows with a current grant |

There is no DELETE route. The RLS delete policy is `using (false)`.

`PATCH` and submit add `.eq("created_by", caller)`. Another creator’s id is **403** `Update denied`, including for tenant admins using this API.

`tenant_id` and `created_by` are immutable. Sending either on `PATCH` is **400**. The database trigger raises the same rule for non-`service_role` updates.

`project_id` must belong to the resolved tenant or be null. When the tenant is inferred from `project_id` and that project row is missing, the response is **404** `Project not found`. When the tenant is already chosen and the project is missing or in another tenant, create/PATCH returns **400** `project_id does not belong to tenant`.

## Status

Stored values: `draft` (create default), `submitted`, `withdrawn`.

- `POST .../submit` updates a `draft` to `submitted` and returns **200** `{ "data": draft }`.
- Submitting a row that is already `submitted` returns that row again and does not write.
- A `withdrawn` row returns **400** `Only draft intake can be submitted`.
- `PATCH` ignores `status`. Nothing in this API sets `withdrawn`.

## Body

Create requires non-empty `title` and `description` (trimmed). Other fields are optional.

```json
{
  "title": "Facade inspection",
  "description": "Site visit before the scaffold comes down.",
  "project_id": null,
  "site_context": "North elevation, level 4",
  "location": { "precision": "city", "label": "Kazan" },
  "requested_work_type": "inspection",
  "budget_range": "mid",
  "desired_start": "2026-10-12",
  "desired_end": "2026-10-20",
  "questions": ["Can the visit start before 10:00?"],
  "media_refs": [{ "kind": "image", "url": "https://cdn.example/facade.jpg" }]
}
```

Create responds **201** `{ "data": draft }` with `status: "draft"`. `PATCH` responds **200** with the updated draft. Omitted `PATCH` keys stay as stored. JSON `null` clears `site_context`, `requested_work_type`, `budget_range`, `desired_start`, `desired_end`, and `project_id`.

Constraints enforced in the service (and again in the migration checks):

| Field | Rule |
|-------|------|
| `location.precision` | `address`, `city`, `region`, or `coordinates`. Omitted or `null` becomes `{ "precision": "city" }`. |
| `location.lat` / `lng` | Finite numbers when present. |
| `desired_start` / `desired_end` | `YYYY-MM-DD` calendar dates, or `null`. Datetimes are rejected. |
| `questions` | At most 20 strings. Each trimmed value is 1–500 characters. |
| `media_refs` | At most 20 objects. Keys are only `kind`, `url`, `media_id`. `kind` is `image`, `video`, or `document`. Each entry needs a `media_id` (1–128) and/or an `https` URL (1–2048, host is localhost, IPv4, or a DNS name). |

Invalid JSON is **400** `Invalid JSON body`. Other validation failures are **400** with the service `error` string.

## Customer iOS

`AppRuntime.configureSharedNetworkingForCustomer` sets `x-client: ios_customer`. `APIClient` sends `Authorization` and `x-device-id`. It does not send `x-tenant-id` or `aistroyka_active_tenant`.

| Client method | Call |
|---------------|------|
| `listIntakeDrafts` | `GET portal/intake` |
| `createIntakeDraft` | `POST portal/intake`. Sends `project_id` when the draft is bound to a portal project, which is how a stakeholder resolves tenant without the header. |
| `updateIntakeDraft` | `PATCH portal/intake/:id` |
| `submitIntakeDraft` | `POST portal/intake/:id/submit` with an empty body |

`CustomerIntakeDraftPatch` encodes nil `site_context`, work type, dates, and location label as JSON `null`. A nil location label therefore stores `{ "precision": "city" }` and drops a previous label or coordinates. A nil `projectId` omits `project_id`, so the stored project stays. `budget_range` is not on the iOS create or patch body.

The intake form sends a date only when `CustomerIntakeDraft.isISODate` accepts it.

## Quick failures

| Symptom | Cause |
|---------|--------|
| **400** asking for `x-tenant-id` or `project_id` | Stakeholder list/submit (or projectless create) without a tenant claim. Customer iOS list/submit hit this when the session role is `stakeholder`. |
| **400** `x-tenant-id is required` | Header or active-tenant cookie is present and blank. |
| **403** `Insert denied` / `Update denied` | Viewer write, revoked grant, suspended or closed account, or a draft whose `created_by` is someone else. |
| **400** with a database error string | Create, list, and update pass through non-RLS Postgres/PostgREST messages. A missing `customer_intake_drafts` table shows up here. Confirm `to_regclass` before changing the client. |
| **403** `lite_client_path_forbidden` | `x-client` is `ios_worker`, `android_worker`, `ios_lite`, or `android_lite`. |
| **400** `Only draft intake can be submitted` | Row is `withdrawn`. |
| Second submit looks like a no-op | Expected. Already-`submitted` returns the current row. |
