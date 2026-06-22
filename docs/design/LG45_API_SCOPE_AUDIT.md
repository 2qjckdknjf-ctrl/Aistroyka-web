# LG-4.5 API Scope Audit

**Scope:** `apps/web/app/api/v1/**` (259 route handlers), `apps/web/lib/api/*`, mobile clients, integrations routes.

## LIVE inventory

| Area | Evidence | Routes (sample) |
| --- | --- | --- |
| **Project APIs** | `projects/route.ts`, `projects/[id]/route.ts`, `tasks/route.ts` | `GET/POST /api/v1/projects`, `GET /api/v1/projects/{id}`, `GET/POST /api/v1/tasks` |
| **Reporting APIs** | `reports/route.ts`, `worker/report/submit/route.ts` | `GET /api/v1/reports`, `POST /api/v1/worker/report/submit` |
| **Media APIs** | `media/upload-sessions/route.ts` | `POST /api/v1/media/upload-sessions`, finalize, annotations |
| **Mobile sync** | `sync/bootstrap`, `sync/changes`, `sync/ack` | First-party iOS/Android via `lite-allow-list.ts` |
| **Public share** | `share/proof/[token]/route.ts` | `GET /api/v1/share/proof/{token}` — token auth, finance-safe guard |
| **Authentication** | `lib/supabase/server.ts`, `lib/tenant/tenant.context.ts` | Session + Bearer user JWT; tenant + RBAC per route |
| **Billing webhooks** | `billing/webhook/route.ts` | Stripe signature — not integrator self-serve |

## PARTIAL inventory

| Area | Why PARTIAL | Evidence |
| --- | --- | --- |
| **Stakeholder APIs** | Role-scoped product surfaces, not external program | `portal/projects/*`, `stakeholders/route.ts`, `stakeholder-invites/accept` |
| **Integration APIs** | Env-gated, no subscription UI | `integrations/telegram/*`, `webhooks/incoming/route.ts` |
| **Administration APIs** | Tenant admin / platform owner ops | `admin/*` (~36), `tenant/*`, `owner/*` |
| **AI enrichment** | Provider/env dependent | `projects/[id]/ai`, `ai/*`, analysis-status |
| **Users list API** | Scaffold returns empty | `users/route.ts` — envelope only |
| **Inbound webhooks** | Server secret + manual tenant context | `WEBHOOK_INCOMING_SECRET` required |

## PLANNED inventory

| Claim | Code truth |
| --- | --- |
| Public developer portal | Marketing page only — no `/developer` app |
| Customer API key self-service | No create/list/revoke routes |
| API developer sandbox | No DX sandbox env (billing sandbox ≠ API sandbox) |
| Published OpenAPI / Swagger | Not in repo |
| npm SDK (`@aistroyka/sdk`) | Docs mention future; mobile uses inline HTTP |
| GraphQL | Not implemented |
| Integration marketplace | Docs only |
| Self-service outbound webhooks | Not implemented |
| SCIM | `scim/[...path]` returns 501 |

## Cross-cutting authentication

- **Primary:** Supabase session cookies or `Authorization: Bearer` user JWT
- **Rejected:** Service-role JWT on product routes
- **Tenant:** Owned tenant or `tenant_members` row; RBAC via `authorize()`
- **Lite clients:** `x-client` header + path allow-list in middleware
- **Sync:** `x-device-id` required on sync routes
- **Internal only:** `SYSTEM_API_KEY` on `/api/v1/system/*`

## Verdict

Product REST API = **LIVE** for authenticated tenants. Public developer program surfaces = **PLANNED**.
