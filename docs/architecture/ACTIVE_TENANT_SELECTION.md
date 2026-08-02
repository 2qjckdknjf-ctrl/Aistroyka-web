# Active Tenant Selection

Date: 2026-07-25 (corrective pass — fail-closed propagation, cookie write-path, duplicate cookies, callsite gate)  
Batch: `2C_active_tenant_selection` (inventory **T-P2-1**)  
Code: `apps/web/lib/tenant/active-tenant.ts`, `lib/api/engine.ts`, `app/api/v1/tenant/active`, onboarding/activation routes

## Problem

Multi-tenant users previously resolved to an arbitrary first `tenant_members` row. First 2C closes still had tails: engine paths collapsed fail-closed flags to `null` (onboarding could auto-create under a bad claim), cookie was read-only, duplicate cookies used last-wins, and the callsite gate was arity-only.

## Contract

### Explicit selection (preferred)

| Source | Name | Precedence |
| --- | --- | --- |
| HTTP header | `x-tenant-id` | Highest — if the header **key is present**, cookie is never consulted |
| Cookie | `aistroyka_active_tenant` | After header; **exactly one** name occurrence required |

Rules:

1. Value must be a UUID (RFC variant/version regex).
2. Caller must **own** the tenant (`tenants.user_id`) **or** have a `tenant_members` row.
3. Unauthorized, malformed, empty, **duplicate same-name cookies**, or DB-error explicit claims **fail closed** — `tenantId: null` with `explicitRejected` / `queryError`.
4. There is **no** silent fallback to cookie / owned / membership when an explicit claim was present.
5. Query errors during owned/membership fallback also fail closed.
6. **Blocked resolution must never auto-create a workspace or invent onboarding state.** Use `resolveTenantForCurrentUser` / `isActiveTenantResolutionBlocked` / `ActiveTenantBlockedError` — do not treat `getTenantForCurrentUser() === null` as “safe to create”.

### Implicit fallback (no header key / no cookie)

1. Owned tenant: `order(id).limit(1)` (deterministic multi-owned).
2. Else membership: `order(tenant_id).limit(1)`.

### Cookie write path (browser selection)

`POST /api/v1/tenant/active` body `{ "tenantId": "<uuid>" | null }`  
`DELETE /api/v1/tenant/active` clears.

- Auth required (session cookie via `createClient` — browser path only).
- CSRF / same-origin proof required (fail closed if missing):
  - matching `Origin` host equals `Host`, **or**
  - `Sec-Fetch-Site: same-origin` when Origin is absent
- Rejects: missing both, `cross-site`, `same-site` with foreign Origin, mismatched Host/Origin, invalid Origin.
- Server validates UUID + ownership/membership (never trusts client role).
- Sets/clears HttpOnly cookie: `Path=/`, `SameSite=Lax`, `Secure` in production, `Max-Age=180d` (or `0` to clear).
- API/mobile clients should send `x-tenant-id` per request; this route does **not** offer a Bearer cookie-write bypass.

### Surfaces

| API | Notes |
| --- | --- |
| `resolveActiveTenantId` / `resolveTenantForCurrentUser` | Full flags preserved |
| `getTenantContextFromRequest(request)` | API canonical |
| `getActiveTenantRoleForUser(..., requestLike?)` | Middleware + RSC pass `request` / `headers()` |
| `getTenantForCurrentUser` | Id-only helper; **not** sufficient for create decisions |
| `createTenantAndOwnerMembershipForCurrentUser` | Throws `ActiveTenantBlockedError` when blocked |
| `POST /api/v1/onboarding/complete` | Refuses auto-create when blocked (unless invite token path) |

Callsite gate: `lib/tenant/active-tenant-callsite.contract.test.ts` requires `request` or `await headers()` expressions (rejects `null`/`undefined`).

## Client guidance

Browser multi-tenant users set workspace via `POST /api/v1/tenant/active`. API/mobile clients may send `x-tenant-id` per request. Omitting both keeps owned/membership fallback.
