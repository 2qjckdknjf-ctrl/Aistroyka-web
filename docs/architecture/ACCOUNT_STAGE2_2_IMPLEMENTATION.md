# Account Stage 2.2 — Implementation Report

**Date:** 2026-06-20  
**Scope:** P1 fix — contractor workspace creation + invite accept account_members sync.  
**Prerequisite:** Stage 2.1 live closed; Stage 2.1B readiness audit.

---

## Summary

Stage 2.2 wires the live `accounts` foundation into **all contractor workspace creation and internal invite accept paths**. New signups and invites now create/sync `account_members` via service role while preserving stakeholder portal behavior and existing tenant resolution.

---

## Signup flow behavior

**Path:** `createTenantAndOwnerMembershipForCurrentUser` → `createContractorWorkspaceForUser`

1. Check existing tenant (unchanged) — return early if user already has workspace.
2. Service role creates:
   - `accounts` (`account_type=contractor`, `display_name`, `status=active`)
   - `tenants` with `account_id`, `user_id`, `plan=free`
   - `accounts.slug` = `t-{tenant_uuid_no_dashes}`
   - `account_members` (`role=owner`, `status=active`)
   - `tenant_members` (`role=owner`)
3. Rollback on failure (delete tenant/account rows best-effort).
4. Onboarding route returns **503** with message if `AccountWorkspaceError`.

**Unchanged:** `persona=customer` still skips tenant creation; stakeholder portal untouched.

---

## Invite accept behavior

**Paths:**

- `POST /api/v1/tenant/accept-invite`
- `POST /api/v1/onboarding/complete` (invite token branch)

After `tenant_members` upsert:

- `admin|member|viewer` → `syncAccountMemberForInternalTenantRole` upserts matching `account_members`
- `stakeholder` → skipped (not in tenant_invitations today; guard present)
- Missing `tenants.account_id` → **503** loud error

---

## Stakeholder regression behavior

- `syncAccountMemberForInternalTenantRole` returns `{ synced: false, skippedReason: 'stakeholder_excluded' }` for stakeholder role.
- `stakeholders.service.ts` **not modified** — portal accept still tenant_members only.
- No automatic stakeholder → account_member upgrade.

---

## Files changed

| File | Change |
|------|--------|
| `lib/account/account-workspace.service.ts` | **Added** — atomic create + invite sync |
| `lib/account/account-workspace.constants.ts` | **Added** — eligible roles + slug helper |
| `lib/account/account-workspace.service.test.ts` | **Added** |
| `lib/account/account-workspace.constants.test.ts` | **Added** |
| `lib/api/engine.ts` | Uses workspace service for signup |
| `lib/domain/tenants/tenant.service.ts` | Uses workspace service |
| `lib/domain/tenants/tenant.repository.ts` | `createTenant` disabled (throws) |
| `app/api/v1/onboarding/complete/route.ts` | Invite sync + workspace error handling |
| `app/api/v1/tenant/accept-invite/route.ts` | Invite sync + error handling |

**Not modified:** `tenant.context.ts`, middleware, UI, billing, stakeholder service, mobile APIs.

---

## Validation

| Check | Result |
|-------|--------|
| `bun run lint` | PASS |
| `bun run test -- --run` | PASS (full suite) |
| `lib/account` + workspace tests | PASS — 26 account-related tests |
| `bun run build` | See evidence doc (environment) |

---

## Remaining risks

1. **Service role required** — signup/invite sync fails closed without `SUPABASE_SERVICE_ROLE_KEY`.
2. **Not live-deployed yet** — app code must deploy before production signup fixed end-to-end.
3. **Migration timestamps** — Stage 1 / 2.1 repo filenames aligned with remote history (2026-06-20 reconciliation).
4. **Billing still tenant-keyed** — Stage 2.4.
5. **Account switcher** — Stage 2.5.

---

## Strict verdict

| Scope | Verdict | Date |
|-------|---------|------|
| Repo implementation | **STAGE 2.2 CLOSED** | 2026-06-20 |
| Live activation | **STAGE 2.2 LIVE CLOSED** | 2026-06-20 |

**Deploy tip:** `89bfde22` on `main` (staging run [27874374254](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/27874374254), production [27874464939](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/27874464939)). Health `buildStamp.sha7`: `1d6cf82` → `89bfde2`.

Evidence: `docs/architecture/ACCOUNT_STAGE2_2_EVIDENCE.md` § Live activation run — 2026-06-20 (closure).

---

## Files in release (main)

| File | Role |
|------|------|
| `lib/account/account-workspace.service.ts` | Atomic create + invite sync |
| `lib/account/account-workspace.constants.ts` | Eligible roles + slug |
| `lib/account/account.types.ts` | Types import (build fix) |
| `lib/account/account-workspace*.test.ts` | Tests |
| `lib/api/engine.ts` | Signup delegation |
| `lib/domain/tenants/tenant.*` | Guard + delegation |
| `app/api/v1/onboarding/complete/route.ts` | Workspace errors + invite sync |
| `app/api/v1/tenant/accept-invite/route.ts` | Invite sync |
| `scripts/smoke/stage2_2_live_workspace_verify.ts` | Live smoke |

---

## Next step (not Stage 2.3)

Stage 2.2 live is closed. Do **not** proceed to Stage 2.3 (`primary_tenant_id`, account switcher, client onboarding) without explicit product gate.
