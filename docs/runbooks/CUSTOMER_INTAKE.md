# Customer portal intake

Customers describe requested work as a draft, edit it, then confirm it. List returns the tenant drafts the caller may read. Create, update, submit, and withdraw change only the caller’s own rows in `customer_intake_drafts`. Submit stores `status = submitted` on that row. Contracts, estimates, and tasks stay unchanged.

Code:

- Routes: `apps/web/app/api/v1/portal/intake/`
- Domain: `apps/web/lib/domain/customer-intake/`
- Base migration: `apps/web/supabase/migrations/20261003170000_customer_intake_drafts.sql`
- Follow-ups: `20261011080113_harden_customer_intake_status_transitions.sql`, `20261011091100_hide_intake_policy_helpers.sql`, `20261011092645_close_post_apply_database_tails.sql` in that migration directory
- Customer iOS: `CustomerAPI` in `ios/AiStroykaCustomer/` and `CustomerIntakeDraft` in `ios/Shared/`

Endpoint index: [API-v1-ENDPOINTS.md](../API-v1-ENDPOINTS.md).

## Live database

After explicit owner authorization on 2026-10-11, live AISTROYKA has `customer_intake_drafts`, four RLS policies, identity/status protection and creator/project indexes. The base migration and lifecycle guard were applied atomically at remote version `20261011090316`; private helper hardening followed at `20261011092544`, timestamp/FK correction at `20261011093430`. The earlier same-day absent-table observation is superseded. Authenticated create/edit/submit/withdraw, retries and terminal-state negatives passed; exact synthetic probe rows were cleaned up.

The helpers now live in `app_private`, with OIDs/policy/trigger bindings preserved; anon/PUBLIC EXECUTE is revoked. Client inserts start `draft`; only `draft -> submitted/withdrawn` is allowed, with same-state retries and service maintenance preserved. Application PATCH remains draft-only; database lifecycle protection independently stops direct terminal status changes.

Do not reapply the original file timestamps: [verified receipts and read-only guard](../ops/VERIFIED_DB_MIGRATION_RECEIPTS.md) map the completed source files to actual remote IDs, including exact SQL copies under new filenames. For a new failure, recheck the actual table/grants/schema before treating it as missing migration. Do not rewrite/repair historical migration records blindly.

The deployed staging and production clients use the same AISTROYKA database project. A staging hostname alone does not isolate writes; pre-apply tests used loopback-only native PostgreSQL/PostgREST with synthetic data. [Operational evidence](../reports/2026-10-11-operational-closure.md) records the actual apply and scope limits.

## Who can call it

Every route requires a signed-in user with a tenant (`401` `Tenant required` when that is missing).

Tenant for the query is chosen in this order (`resolvePortalIntakeTenant`):

1. Header `x-tenant-id`, or, when that header is absent, cookie `aistroyka_active_tenant`.
2. Else `project_id` in a create/PATCH body, or the `project_id` query parameter on list/submit/withdraw, looked up on `projects`.
3. Else the session tenant from `getTenantContextFromRequest`, for roles other than `stakeholder`.
4. Else, for a stakeholder, the single distinct tenant among active `project_stakeholders` grants. Multiple grants in that same tenant are unambiguous; no grant or grants spanning several tenants require an explicit tenant/project selection. A lookup error fails closed.

A stakeholder with no explicit claim, no `project_id`, and no single active portal tenant receives **400** `x-tenant-id or project_id is required for portal intake`. List, submit and withdraw accept a project query hint; the hint selects a tenant and does not bypass row-level authorization.

An empty `x-tenant-id`, or a cookie value that fails to decode, counts as a present claim and returns **400** `x-tenant-id is required`. The project fallback is skipped in that case.

The explicit tenant is allowed for a tenant owner, a `tenant_members` row with role `owner` / `admin` / `member` / `viewer`, or an **active** `project_stakeholders` grant in that tenant. A `tenant_members.role = stakeholder` row alone is **403** `Insufficient rights`.

Session tenant selection prefers a tenant the user owns, then an internal membership over a stakeholder membership. A person who is both a contractor member and a portal stakeholder lists the contractor tenant unless they send an explicit tenant claim or project hint.

## Authorization on the row

RLS (`customer_intake_drafts_*`) also requires an **active** account (`accounts.status = active`). A missing, suspended, or closed account fails closed (`Insert denied` / `Update denied` → **403**).

| Action | Internal `owner` / `admin` / `member` | `viewer` | Stakeholder |
|--------|----------------------------------------|----------|-------------|
| List | Tenant drafts they can read | Same | Own rows, and only while the grant still matches the draft (`project_id` null → any active grant in the tenant; set → active grant on that project) |
| Create / update | Own rows (`created_by` = caller) | Denied | Own rows with a current grant |

There is no DELETE route. The RLS delete policy is `using (false)`.

`PATCH`, submit and withdraw add `.eq("created_by", caller)`. Another creator’s id is **403** `Update denied`, including for tenant admins using this API.

`tenant_id` and `created_by` are immutable. Sending either on `PATCH` is **400**. The database trigger raises the same rule for non-`service_role` updates.

`project_id` must belong to the resolved tenant or be null. When the tenant is inferred from `project_id` and that project row is missing, the response is **404** `Project not found`. When the tenant is already chosen and the project is missing or in another tenant, create/PATCH returns **400** `project_id does not belong to tenant`.

## Status

Stored values: `draft` (create default), `submitted`, `withdrawn`.

- `POST .../submit` updates a `draft` to `submitted` and returns **200** `{ "data": draft }`.
- Submitting a row that is already `submitted` returns that row again and does not write.
- A `withdrawn` row returns **400** `Only draft intake can be submitted`.
- `POST .../withdraw` moves `draft` to `withdrawn` and returns **200** `{ "data": draft }`. Repeat withdrawal returns the existing withdrawn row without writing.
- Withdrawal of a submitted row returns **400** `Only draft intake can be withdrawn`.
- `PATCH` ignores `status`; status transitions use submit/withdraw. These calls do not create contracts, estimates or tasks.

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
| `listIntakeDrafts` | `GET portal/intake`, with `?project_id=...` when a portal project is bound |
| `createIntakeDraft` | `POST portal/intake`. Sends `project_id` when the draft is bound to a portal project, which is how a stakeholder resolves tenant without the header. |
| `updateIntakeDraft` | `PATCH portal/intake/:id` |
| `submitIntakeDraft` | `POST portal/intake/:id/submit`, with the same bound-project query hint |
| `withdrawIntakeDraft` | `POST portal/intake/:id/withdraw`, with the same bound-project query hint |

`CustomerIntakeDraftPatch` encodes nil `site_context`, work type, dates, and location label as JSON `null`. A nil location label therefore stores `{ "precision": "city" }` and drops a previous label or coordinates. A nil `projectId` omits `project_id`, so the stored project stays. `budget_range` is not on the iOS create or patch body.

The intake form sends a date only when `CustomerIntakeDraft.isISODate` accepts it.

## Quick failures

| Symptom | Cause |
|---------|--------|
| **400** asking for `x-tenant-id` or `project_id` | Stakeholder call without a tenant/project claim when active grants do not resolve to one tenant. A bound Customer iOS project supplies the hint on list/submit/withdraw. |
| **400** `x-tenant-id is required` | Header or active-tenant cookie is present and blank. |
| **403** `Insert denied` / `Update denied` | Viewer write, revoked grant, suspended or closed account, or a draft whose `created_by` is someone else. |
| **400** with a database error string | Create, list, and update pass through non-RLS Postgres/PostgREST messages. A missing `customer_intake_drafts` table shows up here. Confirm `to_regclass` before changing the client. |
| **403** `lite_client_path_forbidden` | `x-client` is `ios_worker`, `android_worker`, `ios_lite`, or `android_lite`. |
| **400** `Only draft intake can be submitted` | Row is `withdrawn`. |
| **400** `Only draft intake can be withdrawn` | Row is already `submitted`. |
| Second submit/withdraw looks like a no-op | Expected. A row already in the requested terminal state is returned unchanged. |
