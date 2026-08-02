# AISTROYKA Phase 2C — Lite Read Scope Closure

Date: 2026-07-26  
Batch: `2C_lite_read_scope`  
Repo: `/Users/alex/Projects/AISTROYKA`  
Branch: `security/platform-admin-separation`

No migration is required for this batch.

Previously created migrations remain **NOT APPLIED**:

- `20260725143000_dequeue_tenant_job.sql`
- `20260725190000_rate_limit_try_increment.sql`

Phase 2A / 2B historical artifacts were **not edited**.  
`2C_lite_prefix_boundary` and Phase 2D were **not started**.  
No commit, push, deploy, or migration apply was performed.

---

## Verdict

**YES** — local code and route/allow-list contract complete.

`Safe to proceed to next Phase 2C lite batch: YES`

Production rollout: **NOT PERFORMED**. The new behavior is local until the normal
commit/review/deploy path is explicitly requested.

Overall Phase 2: **IN PROGRESS**  
Overall release: **NO-GO**

Locally controllable tails in this batch: **none remaining**.

---

## Closed findings

| # | Finding | Closure |
| --- | --- | --- |
| 1 | Lite clients could open tenant-wide `GET /api/v1/devices` | Middleware allow-list returns 403 for the root manager inventory, including trailing slash and `HEAD`. The route also fails closed with 403 before opening the admin client. Register/unregister writes remain available. |
| 2 | Lite clients could call manager `listForManager` through `GET /api/v1/media/upload-sessions` | Middleware allow-list returns 403 for manager reads, including trailing slash and `HEAD`. The route independently returns 403 before the repository call. Create/finalize writes remain available. |
| 3 | Lite `analysis-status` could disclose a peer report's job state | The route loads the tenant-scoped report, requires `report.user_id === ctx.userId` for lite/worker profiles, and returns indistinguishable 404 before any job lookup for a peer report. |
| 4 | `analysis-status` allow-list entry was method-agnostic | Only `GET` is allowed for lite clients. |
| 5 | Manager/cockpit compatibility | Non-lite web/manager behavior stays tenant-wide; existing device token stripping and upload filters are preserved. |

---

## Security boundary

Field-worker profiles covered by the shared `isLiteWorkerClient` contract:

- `ios_lite`
- `android_lite`
- `ios_worker`
- `android_worker`

The allow-list check and route handlers provide two local enforcement layers for
the manager-only list routes. `analysis-status` uses 404 rather than 403 for a
foreign report so the report ID and job existence are not disclosed.

This batch does **not** claim to close the separate segment-prefix issue. Prefixes
such as `/api/v1/worker` and `/api/v1/sync` remain assigned to
`2C_lite_prefix_boundary`.

---

## Key files

- `apps/web/lib/api/lite-allow-list.ts`
- `apps/web/lib/api/lite-allow-list.test.ts`
- `apps/web/app/api/v1/devices/route.ts`
- `apps/web/app/api/v1/devices/route.test.ts`
- `apps/web/app/api/v1/media/upload-sessions/route.ts`
- `apps/web/app/api/v1/media/upload-sessions/route.test.ts`
- `apps/web/app/api/v1/reports/[id]/analysis-status/route.ts`
- `apps/web/app/api/v1/reports/[id]/analysis-status/route.test.ts`

---

## Validation

| Gate | Result |
| --- | --- |
| Focused read-scope contract | PASS — 4 files / 32 tests |
| Expanded lite/report regression | PASS — 6 files / 45 tests |
| `bun run lint` | PASS |
| `bun run test` | PASS — 393 files / 2547 tests |
| `bun run build` | PASS |
| `bun run cf:build` | PASS |
| `bun run --cwd apps/web check:design` | PASS |
| `node scripts/ci/validate-npm-lock.cjs` | PASS |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `git diff --check` | PASS |

Existing Next.js hook/image warnings were non-blocking and are unrelated to this
batch.

---

## Remaining out of batch

- `2C_lite_prefix_boundary`
- Operator: apply the previously pending migrations through the normal Supabase
  operations path
- Phase 2D legacy lite bypass and cleanup
