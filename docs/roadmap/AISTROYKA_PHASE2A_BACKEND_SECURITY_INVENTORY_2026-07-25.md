# AISTROYKA Phase 2A — Backend Security Inventory

Date: 2026-07-25  
Scope: audit-only (no product code, middleware, tests, migrations, or package changes)  
Repo: `/Users/alex/Projects/AISTROYKA`  
Branch at audit: `security/platform-admin-separation`  
Prior closures accepted: Phase 0 baseline freeze, Phase 1 P0 gate  

Artifacts:

- This report
- `docs/roadmap/AISTROYKA_PHASE2A_API_ROUTE_MATRIX.csv` (312 handler rows; **trackable**)
- Local mirror also written to `docs/roadmap/evidence/AISTROYKA_PHASE2A_API_ROUTE_MATRIX.csv` (same bytes). That path matches the Phase 2A prompt, but root `.gitignore` rule `evidence/` (MODE B store artifacts) ignores every `evidence/` directory, so the trackable source of truth is the `docs/roadmap/` copy.

Temporary scanners lived only under `/tmp/aistroyka-phase2a-2026-07-25/` (not in repo).

---

## 1. Route counts (re-verified)

```bash
find apps/web/app/api/v1 -name 'route.ts' | wc -l          # 284
find apps/web/app/api/v1 -name 'route.test.ts' | wc -l     # 70
find apps/web/app/api -path '*/v1/*' -prune -o -name 'route.ts' -print | wc -l  # 28
```

| Metric | Expected | Found | In matrix | Classified (non-UNKNOWN) |
| --- | --- | --- | --- | --- |
| v1 `route.ts` | 284 | 284 | 284 | 284 |
| v1 `route.test.ts` | 70 | 70 | (referenced where present) | — |
| Legacy non-v1 `route.ts` | 28 | 28 | 28 | 28 |
| **Total handlers** | 312 | 312 | 312 | 312 |
| `UNKNOWN` status | 0 required | **0** | — | — |

Matrix status distribution: **PROVEN 236 / GAP 76 / UNKNOWN 0**.

---

## 2. Route family distribution

| Family | Count |
| --- | ---: |
| projects | 85 |
| admin | 38 |
| other | 29 |
| legacy | 28 |
| platform | 25 |
| ai | 17 |
| portal | 11 |
| worker | 11 |
| owner_legacy | 10 |
| billing | 8 |
| tenant | 8 |
| ops_other | 7 |
| media | 6 |
| health | 5 |
| help | 5 |
| auth | 3 |
| activation | 3 |
| devices | 3 |
| integrations | 3 |
| sync | 3 |
| jobs | 2 |
| contact_leads | 1 |
| share | 1 |

---

## 3. Auth and tenant isolation core

### Derivation (server-side only)

Evidence: `apps/web/lib/tenant/tenant.context.ts:41-109`

1. Session user from Supabase `createClientFromRequest` (service-role JWT → `TenantForbiddenError`).
2. Tenant id from owned `tenants.user_id` else first `tenant_members` row — **not** from body/query/header tenant id.
3. Role from owner short-circuit or `tenant_members.role` in `{owner,admin,member,viewer,stakeholder}`.
4. Optional RBAC enrichment via `lib/authz/*`.

Guards: `tenant.guard.ts` (`requireTenant`), `tenant.policy.ts` (`authorize`, stakeholder portal-only semantics).

### Proven pattern (majority of tenant routes)

- Unauthenticated → 401 via `requireTenant` / session check.
- Tenant filter uses `ctx.tenantId`.
- Resource lookups typically also filter by project membership / RLS.
- Cross-tenant negatives exist for some high-risk families (costs, finance share) but are **sparse** overall (~few explicit wrong-tenant route tests).

### Open tenant findings (all batched)

| ID | Severity | Finding | Evidence | Fix batch |
| --- | --- | --- | --- | --- |
| T-P0-1 | **P0** | `/api/analysis/process` (+ v1 re-export) any authenticated user dequeues jobs via service role with **no tenant scope** | `app/api/analysis/process/route.ts:22-43`; `lib/ai/runOneJob.ts:139` `dequeue_job(null, …)` | `2B_analysis_process_tenant_scope` |
| T-P2-1 | P2 | Multi-tenant users resolve to **first** membership row | `tenant.context.ts:92-96` | `2C_active_tenant_selection` (document in 2C; not blocking 2A inventory) |
| T-P1-1 | P1 | Legacy `lib/auth/tenant.ts` omits `stakeholder` while still imported | `lib/auth/tenant.ts:13,62`; 9 call sites | `2B_role_model_unify` |

---

## 4. Role model

### Tenant roles (canonical)

`owner | admin | member | viewer | stakeholder` — `tenant.types.ts` / `tenant.context.ts:99-108`.

### Project roles

| Source | Union |
| --- | --- |
| `project-members.types.ts:1` | `worker \| contractor \| manager` (**missing `owner`**) |
| `project-members.repository.ts:3` | `worker \| contractor \| manager \| owner` |
| DB migration | includes `owner` |

### Platform roles

`OWNER | OWNER_OPERATOR | OWNER_READONLY` via `platform_owner_grants` + `requirePlatformOwnerApi` (read / write / critical+step-up).

### Duplicate / conflicting files

| File | Imported? | Diff vs canonical | Lint/test/build | Fix |
| --- | --- | --- | --- | --- |
| `tenant-role (1).server.ts` | **No** | **Identical** to `tenant-role.server.ts` | Included by `**/*.ts` | Delete in `2B_role_model_unify` |
| `stakeholder-dashboard-paths (1).ts` | **No** | **Diverges** — missing `/portal` rules present in canonical | Included | Delete in `2B_role_model_unify` |
| `stakeholder-dashboard-paths (1).test.ts` | N/A | Imports canonical module; duplicate suite (fewer portal cases) | Vitest picks up | Delete in `2B_role_model_unify` |
| Canonical `stakeholder-dashboard-paths.ts` | Tests/docs only | Includes `/portal` allow rules | — | **Not wired in `middleware.ts`** (0 matches) → `2B_stakeholder_middleware_wire` |

Enterprise map `authz.types.ts` maps owner→OWNER, admin→MANAGER, member→WORKER, viewer→CONTRACTOR; **stakeholder unmapped** → empty permissions (route-level portal guards must carry the weight).

---

## 5. Public route inventory

Public / special audiences in matrix: **27** routes.  
Unjustified (`public_reason` empty or `other_needs_review`): **0**.

Allowed `public_reason` values used:

| Reason | Examples |
| --- | --- |
| `health_config` | `/api/v1/health`, `/api/health`, `/api/system/health`, `/api/v1/worker` GET discovery, config |
| `auth_callback_login` | `/api/auth/callback`, login/methods/telegram |
| `signed_webhook` | Stripe / incoming / telegram webhooks |
| `tokenized_share` | `/api/v1/share/proof/:token` |
| `contact` | `/api/v1/contact`, `/api/contact` |
| `debug_host_gated` | `_debug/auth`, `diag/supabase`, `health/auth` |
| `other_proven_static_help_kb` | `/api/v1/help/assistant`, `/api/v1/help/hints` (static KB; still GAP for abuse controls) |

---

## 6. Customer-facing surface and finance guard

### Guard implementation

`apps/web/lib/security/customer-finance-guard.ts:1-52`  
Forbidden keys + any key containing `internal_cost`.  
Tests inject `budget_pressure`, nested `internal_cost_*`, and allow commercial `amount` (`customer-finance-guard.test.ts`).

Customer commercial fields **not** blocked (correct): `total_amount`, `amount`, `customer_amount_delta`, `customer_visible_amount`.

### Customer-facing routes (matrix `customer_facing=yes`): 28

| Class | Count | Verdict |
| --- | ---: | --- |
| Route-level `assertCustomerFinanceSafePayload` | 8 | **PROVEN** (7 portal reads + share proof) |
| Safe DTO / service projection only | 20 | **GAP** (defense-in-depth missing) |

**Proven with guard (examples):**

- `portal/projects/:id` (+ progress, documents, decisions, estimates, proof, change-orders list) — guard immediately before JSON response; route tests inject forbidden keys.
- `share/proof/:token` — service-role token lookup + guard (`share/proof/[token]/route.ts:31-50`).

**Highest-priority customer gaps:**

| Route | Issue | Severity | Batch |
| --- | --- | --- | --- |
| `/api/v1/projects/:id/client-view` | Same payload as portal full view; **no** route guard | P1 | `2B_customer_finance_guard_coverage` |
| Portal re-exports of change-order detail / respond / decisions respond | No route guard; manager hitting change-order detail gets full row incl. internal budget fields | P1 | `2B_customer_finance_guard_coverage` |
| Stakeholder `projects/*` estimates/decisions/handover/activity/notifications | Safe projection only; no injection tests at route | P2 | `2B_customer_finance_guard_coverage` |
| Guard blind spot | `budget_delta_amount` / `budget_impact_level` not in `FORBIDDEN_KEYS` | P2 | `2B_customer_finance_guard_coverage` |

Portal list `GET /api/v1/portal/projects` returns `{id,name}` only via `listPortalProjects` — classified PROVEN by safe DTO (minimal).

---

## 7. Service-role inventory

Routes with `getAdminClient` / service-role usage in matrix: **75**.

Grouped purposes:

| Purpose | Tenant scope | Notes |
| --- | --- | --- |
| Platform owner console | Platform grant before admin queries | Intended cross-tenant |
| Tokenized share / contact | Token or public form | Share uses finance guard |
| Webhooks / cron | Signature / cron secret | — |
| Sync / idempotency / rate-limit side channel | After `requireTenant` | Pass `ctx.tenantId` |
| AI job engine | Caller auth required | **`analysis/process` fails tenant scope (P0)** |
| Notifications emit | After tenant ctx | — |

Service-role gaps: **P0 analysis/process**; other admin uses mostly gated. Platform routes lack route-level negative tests (GAP P1 for test coverage, not necessarily auth bypass).

---

## 8. Platform-owner isolation

### Gate stack

1. Middleware: `/api/v1/platform/*` and `/api/v1/owner/*` → `gateOwnerRequest` (`middleware.ts` + `middleware-owner-gate.ts`) — grant, rate limit, readonly mutation block.
2. Handler: `requirePlatformOwnerApi` — host/IP/secret optional gates, session freshness, read/write/critical+step-up, audit log.
3. Owner aliases: `delegateToPlatformApi` → same platform handlers.
4. Admin billing/leads aliases: `delegateLegacyTenantAdminPlatformApi` → platform handlers (**handler gate only**; **not** on middleware owner path) → GAP P2 `2B_platform_gate_depth`.

### Alias map (canonical)

| Alias family | Canonical | Middleware owner path? | Handler gate? |
| --- | --- | --- | --- |
| `/api/v1/owner/*` (10) | `/api/v1/platform/*` | Yes | Yes |
| `/api/v1/admin/billing/*`, `/api/v1/admin/leads/*` (11) | `/api/v1/platform/billing|leads/*` | **No** | Yes (`requirePlatformOwnerApi`) |
| `/api/v1/admin/flags` POST | N/A (global flags) | No | `requirePlatformOwnerLegacyAdminRoute` |
| Cron admin jobs | N/A | No | cron secret + blocks tenant-admin browser callers |

Tenant admin **cannot** pass platform grant checks (proven by design + existing admin leads/cron tests). Gap is **defense depth + missing `/api/v1/platform/**/route.test.ts` (0 files)** → batch `2B_platform_negative_tests`.

Modes: read (all grant roles), write (`OWNER`/`OWNER_OPERATOR`), critical (`OWNER` + `X-Owner-Step-Up`).

---

## 9. Lite allow-list matrix

Clients: `ios_lite | android_lite | ios_worker | android_worker` (`lite-allow-list.ts:6-8`).  
Enforced only on `/api/v1/*` (`middleware.ts:73-78`). Legacy `/api/*` **bypasses** lite middleware.

### Prefix safety

`startsWith("/api/v1/worker|sync|devices|auth|media/upload-sessions")` — **no path-segment boundary**. Hypothetical `/api/v1/worker-evil` would pass middleware. Severity P2 → `2C_lite_prefix_boundary`. Regex/exact rules for tasks/reports/help/activation are safe.

### Allowed lite writes (complete)

| Path | Method | `requireLiteIdempotency` | Rate limit | Status |
| --- | --- | --- | --- | --- |
| `/api/v1/worker/day/start` | POST | Yes | No | PROVEN (idem wired) |
| `/api/v1/worker/day/end` | POST | Yes | No | PROVEN |
| `/api/v1/worker/report/create` | POST | Yes | No | PROVEN |
| `/api/v1/worker/report/add-media` | POST | Yes | No | PROVEN |
| `/api/v1/worker/report/submit` | POST | Yes | No | PROVEN |
| `/api/v1/devices/register` | POST | Yes | No | GAP rate-limit (P2/P3 ops) |
| `/api/v1/devices/unregister` | POST | Yes | No | same |
| `/api/v1/sync/ack` | POST | Yes | Yes | PROVEN |
| `/api/v1/media/upload-sessions` | POST | Yes | No | PROVEN idem |
| `/api/v1/media/upload-sessions/:id/finalize` | POST | Yes | Yes | PROVEN |
| `/api/v1/help/hints` | POST | **No** | **No** | **GAP P1** (also unauthenticated) |
| `/api/v1/help/assistant` | POST | **No** | **No** | **GAP P1/P2** |
| `/api/v1/help/assistant/events` | POST | **No** | No | **GAP P1** (auth yes; telemetry dup) |

Idempotency store is success-only on wired routes; failures / 409 conflicts are not cached as success (`lite-idempotency.ts` + sync ack). Scope includes tenant + user + route key when ctx present.

### Lite read gaps

| Path | Issue | Severity | Batch |
| --- | --- | --- | --- |
| `GET /api/v1/devices` | Tenant-wide device list | P1 | `2C_lite_read_scope` |
| `GET /api/v1/media/upload-sessions` | `listForManager` | P1 | `2C_lite_read_scope` |
| `GET /api/v1/reports/:id/analysis-status` | No own-report check (unlike `reports/:id`) | P1 | `2C_lite_read_scope` |

Manager/full clients are not restricted by lite policy (correct).

---

## 10. Legacy alias map (28)

| Legacy | Canonical | Type | Gate note | Severity |
| --- | --- | --- | --- | --- |
| `/api/_debug/auth` | `/api/v1/debug/auth` | independent | debug host gate | — |
| `/api/activation/status` | `/api/v1/activation/status` | redirect | hits v1 | — |
| `/api/ai/analyze-image` | `/api/v1/ai/analyze-image` | **independent duplicate** | **lite bypass** | P1 |
| `/api/ai/analyze-video-daily` | v1 | re-export | lite bypass | P1 |
| `/api/ai/transcribe` | v1 | re-export | lite bypass | P1 |
| `/api/analysis/process` | `/api/v1/analysis/process` | **shared canonical impl** | **P0 tenant-less service-role dequeue** | **P0** |
| `/api/auth/callback` | oauth | independent | auth callback | — |
| `/api/auth/login` | `/api/v1/auth/login` | shared canonical | public auth | — |
| `/api/contact` | `/api/v1/contact` | independent | public contact | — |
| `/api/diag/supabase` | v1 diag | independent | debug gated | — |
| `/api/health/auth` | v1 | independent | debug gated | — |
| `/api/health` | `/api/v1/health` | shared service | public health | — |
| `/api/invite` | tenant invite | re-export/redirect | — | — |
| `/api/projects/.../jobs/.../trigger` | v1 501-style | obsolete | lite bypass | P1 |
| `/api/projects/.../media/.../trigger` | v1 | independent | lite bypass | P1 |
| `/api/projects/.../poll-status` | none exact | independent | lite bypass | P1 |
| `/api/projects/:id` | v1 | independent | lite bypass | P1 |
| `/api/projects/:id/upload` | v1 | independent | lite bypass | P1 |
| `/api/projects` | v1 | independent | **lite POST bypass of v1 block** | P1 |
| `/api/system/health` | system key | independent | system API key | — |
| `/api/system/metrics` | system key | independent | system API key | — |
| `/api/tenant/*` (6) | `/api/v1/tenant/*` | redirect | v1 gated after redirect | P3 cleanup |
| `/api/webhooks/incoming` | v1 | re-export | signature on handler | — |

**Legacy bypass candidates (actionable):** analysis/process (P0); `/api/projects` + AI + project upload/trigger family (P1 lite bypass); remaining redirects are low risk.

---

## 11. RLS coverage (snapshot)

| Concern | State | Evidence |
| --- | --- | --- |
| `tenant_members` | RLS + own/membership select | migrations `20260323110000_*`, `20260526105500_*` |
| `project_members` | Stage-1 scoped helpers | `20260620140442_rbac_stage1_*` |
| `project_stakeholders` | Portal vs internal split | `20260329140000_stakeholder_rls_isolation.sql` |
| `platform_owner_grants` | Select own; no client write | `20260427120000_*` |
| `roma_audit_runs` | RLS on, **zero policies** (service-role only) | `20260704120000_*` |
| `platform_break_glass_grants` | Deny client; service-role | stage-1 hardening |

App-layer stakeholder redirect helper exists but is **not** middleware-wired (see role model).

---

## 12. Negative test coverage

| Family | Coverage | Gap |
| --- | --- | --- |
| Customer-finance guard (unit) | Strong | — |
| Portal guarded GETs | Strong (inject forbidden keys) | Re-exports / client-view lack inject tests |
| Lite allow-list + idempotency (lib) | Strong | help writes lack route idem tests |
| Costs / export finance | Strong | — |
| Platform `/api/v1/platform/*` | **0 route.test.ts** | P1 batch |
| Tasks assign / stakeholders invite | Missing route tests | P2 |
| Wrong-tenant matrix | Rare | P2 |
| Admin cron tenant-admin 403 | Partial | extend in 2B |
| Middleware stakeholder path | None | wire + test in 2B |

Policy/service contracts cover some families without per-role per-route tests; where claimed, matrix `negative_roles_tested` points at existing `route.test.ts` or lib tests. Platform family cannot claim contract coverage — mark GAP.

---

## 13. Findings by severity

### P0 (2 route rows = 1 unique issue)

1. **Unauthenticated-tenant job dequeue via service role** — `/api/analysis/process` and `/api/v1/analysis/process` (re-export). Any logged-in user can call `processOneJob(admin)` which RPCs `dequeue_job` with null tenant.  
   Fix batch: `2B_analysis_process_tenant_scope`.

### P1 (43 matrix rows — grouped)

- Legacy lite bypass: `/api/projects*`, `/api/ai/*` (9).
- Lite read over-scope: devices list, upload-sessions list, analysis-status (3).
- Lite write without idempotency: help assistant/hints/events (3).
- Customer finance defense-in-depth: client-view + portal re-exports (3) + remaining projection-only customer routes (batch).
- Platform routes missing negative HTTP tests (25).

### P2

- Admin→platform aliases without middleware owner path (11).
- Remaining customer projection-only routes.
- Lite prefix `startsWith` boundary (3 classification rows).
- Role-model hygiene / stakeholder middleware unwired (documented; fix in 2B).

### P3

- Legacy tenant redirects cleanup.
- Public contact abuse controls.
- Orphan `(1)` file deletion (hygiene).

---

## 14. Exact fix batches for Phase 2B / 2C / 2D

### Phase 2B — Critical isolation + finance + role hygiene

| Batch ID | Goal | Files (initial list) | Checks |
| --- | --- | --- | --- |
| `2B_analysis_process_tenant_scope` | Require tenant + role; scope dequeue to tenant or cron-only | `app/api/analysis/process/route.ts`, `app/api/v1/analysis/process/route.ts`, `lib/ai/runOneJob.ts`, new `route.test.ts` | `bun run --cwd apps/web test -- app/api/analysis/process` + lint |
| `2B_customer_finance_guard_coverage` | Call `assertCustomerFinanceSafePayload` on all customer-facing responses; extend forbidden keys if needed; portal re-exports | All portal re-exports; `projects/[id]/client-view/route.ts`; stakeholder project handlers listed in matrix GAP; `customer-finance-guard.ts` + tests | finance guard + portal + client-view tests |
| `2B_platform_gate_depth` | Put admin billing/leads aliases on middleware owner paths **or** deprecate aliases | `middleware-paths.ts`, `middleware.ts`, `legacy-tenant-admin-api.ts`, admin billing/leads routes | owner gate tests + lint |
| `2B_platform_negative_tests` | Add HTTP negatives: tenant admin/member/stakeholder vs platform APIs | new `platform/**/route.test.ts` | vitest platform suite |
| `2B_role_model_unify` | Delete `(1)` dups; unify `ProjectMemberRole`; migrate off `lib/auth/tenant.ts` | `(1)` files; `project-members.types.ts`; 9 `lib/auth/tenant` call sites | lint, test, i18n untouched |
| `2B_stakeholder_middleware_wire` | Wire `redirectIfStakeholderBlockedPath` | `middleware.ts`, stakeholder path helper + tests | middleware + path tests |

### Phase 2C — Lite hardening

| Batch ID | Goal | Files | Checks |
| --- | --- | --- | --- |
| `2C_lite_idempotency_rate_limits` | Idempotency + rate limits for help writes; auth decision for static help | `help/assistant/route.ts`, `help/hints/route.ts`, `help/assistant/events/route.ts`, `lite-idempotency.ts` | lite-idempotency + help tests |
| `2C_lite_read_scope` | Restrict devices/upload-sessions/analysis-status for lite | `devices/route.ts`, `media/upload-sessions/route.ts`, `reports/.../analysis-status/route.ts`, allow-list | lite-allow-list tests |
| `2C_lite_prefix_boundary` | Segment-safe prefixes (`/worker/` not `/worker`) | `lite-allow-list.ts` + tests | allow-list unit tests |
| `2C_active_tenant_selection` | Explicit active tenant (header/cookie) | `tenant.context.ts` + docs | tenant.context tests |

### Phase 2D — Legacy cleanup

| Batch ID | Goal | Files | Checks |
| --- | --- | --- | --- |
| `2D_legacy_lite_bypass` | Redirect or delete independent `/api/projects` and `/api/ai/*` duplicates; ensure lite cannot POST create via legacy | `app/api/projects/**`, `app/api/ai/**` | lite tests hitting legacy paths; lint |
| `2D_legacy_cleanup` | Keep redirects; document deprecation headers | tenant legacy redirects | smoke |
| `2D_public_abuse_controls` | Rate-limit contact / help public POSTs | contact + help routes | unit |

**Phase 2B must not start until this Phase 2A inventory is accepted.** This report does not implement any of the batches.

---

## 15. Required checks (executed; audit-only — no fixes)

| Check | Result |
| --- | --- |
| `git status --short --branch` | Dirty worktree preserved (Phase 1 + untracked QA/launch docs); Phase 2A added only docs artifacts |
| `bun run lint` | **PASS** (exit 0) |
| `bun run test` | **PASS** — 327 files, **1772** tests |
| `bun run build` | **PASS** (exit 0, Next.js 15.5.21) |
| Targeted vitest | **PASS** — 6 files, **44** tests: `customer-finance-guard`, `tenant.context`, `tenant.guard`, `tenant.policy`, `lite-allow-list`, `lite-idempotency` |

Command used for targeted:

```bash
bun run --cwd apps/web test -- \
  lib/security/customer-finance-guard.test.ts \
  lib/tenant/tenant.context.test.ts \
  lib/tenant/tenant.guard.test.ts \
  lib/tenant/tenant.policy.test.ts \
  lib/api/lite-allow-list.test.ts \
  lib/api/lite-idempotency.test.ts
```

---

## 16. Confirmation of non-changes

| Item | Value |
| --- | --- |
| Product / backend / middleware / tests / migrations / packages changed by Phase 2A | **NO** |
| Phase 1 files modified by Phase 2A | **NO** |
| Customer-finance isolation logic changed | **NO** |
| Commit / push / merge / deploy / migrations | **NO** |
| Secrets / `.env` contents printed | **NO** |
| Users / tenants / real data created | **NO** |
| Artifacts created | Inventory MD + CSV matrix only |
| Phase 2B started | **NO** |

Pre-existing dirty files (e.g. Phase 1 `middleware.ts`, `package.json`, security-headers) were left untouched by this phase.

---

## PHASE 2A CLOSURE

```text
PHASE 2A CLOSURE

Verdict: YES
Overall Phase 2 verdict: IN PROGRESS
Overall release verdict: NO-GO

V1 routes expected/found/classified:
- 284 / 284 / 284 (UNKNOWN: 0)

Legacy routes expected/found/classified:
- 28 / 28 / 28 (UNKNOWN: 0)

Routes with UNKNOWN status:
- (none)

Public routes:
- total: 27
- unjustified: 0

Customer-facing routes:
- total: 28
- finance guard proven: 8
- safe DTO proven: 20 (classified; 20 marked GAP for missing route-level guard)
- gaps: 20 route-level defense-in-depth (incl. client-view + portal re-exports)

Service-role routes:
- total: 75
- tenant scope proven: majority gated; exception analysis/process
- gaps: P0 analysis/process (+ v1 alias)

Platform-owner routes/aliases:
- total: ~48 (platform 25 + owner 10 + admin platform aliases 11 + related)
- proven: owner/platform middleware+handler stack; tenant admin blocked by grant
- gaps: admin aliases missing middleware owner path (P2); zero platform route.test.ts (P1)

Lite allowed writes:
- total: 13 distinct write paths (10 with idempotency; 3 without)
- idempotency gaps: help/assistant, help/hints, help/assistant/events
- rate-limit gaps: help writes; most worker/device writes lack dedicated rate limit

Legacy bypass candidates:
- P0: /api/analysis/process (canonical impl for v1)
- P1: /api/projects (+ upload/trigger/poll) and /api/ai/* lite middleware bypass

Role model conflicts:
- project-members.types omits owner vs repository/DB
- orphan identical tenant-role (1).server.ts
- orphan divergent stakeholder-dashboard-paths (1).ts
- lib/auth/tenant.ts omits stakeholder
- stakeholder-dashboard-paths not wired in middleware

Findings:
- P0: 1 unique (2 route rows) — analysis/process tenant-less service-role dequeue
- P1: 43 matrix rows (legacy lite bypass, lite read/write gaps, finance guard depth, platform negative tests)
- P2: 31 matrix rows (admin alias gate depth, projection-only customer routes, prefix boundary)
- P3: 11 (legacy redirects cleanup / public abuse)

Required checks:
- lint PASS
- test PASS (1772)
- build PASS
- targeted security/tenant/lite tests PASS (44)

Artifacts created:
- docs/roadmap/AISTROYKA_PHASE2A_BACKEND_SECURITY_INVENTORY_2026-07-25.md
- docs/roadmap/AISTROYKA_PHASE2A_API_ROUTE_MATRIX.csv (trackable; evidence/ path gitignored by MODE B rule)
- docs/roadmap/evidence/AISTROYKA_PHASE2A_API_ROUTE_MATRIX.csv (local mirror only)

Product code changed: NO
User changes preserved: YES
Customer-finance isolation changed: NO
Allowed to proceed to Phase 2B: YES
```

Phase 2A stops here. Do not implement findings until Phase 2B is explicitly requested.
