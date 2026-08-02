# Phase 3D — platform_admin_operations_center_flows

**Date:** 2026-07-28  
**Batch:** `Phase 3D — platform_admin_operations_center_flows`  
**Repo:** `/Users/alex/Projects/AISTROYKA`  
**Constraints honored:** no commit, push, deploy, migration apply; no Save Snapshot; no unauthorized business mutations; temporary negative fixture only under owner authorization (created and fully cleaned)

---

## Dual verdict (current)

| Verdict | Result |
| --- | --- |
| **Local platform-admin contract** | **YES** |
| **Real platform-owner E2E** | **YES** |
| **Negative non-grant tenant-admin E2E** | **YES** |
| **Anonymous proof** | **YES** |
| **Overall Phase 3D** | **YES** |
| **Overall Phase 3** | **IN_PROGRESS** |

Safe to proceed to `3E_multi_role_e2e_closure`: **YES**

---

## Historical stage — BLOCKED_EXTERNAL (pre-unlock)

Earlier on 2026-07-28, Phase 3D local contract was already **YES**, but required browser proof was **BLOCKED_EXTERNAL** because only `SMOKE_*` existed and smoke holds both tenant `admin` and `platform_owner_grants.OWNER`. No distinct authenticated non-grant persona was available without creating users (then forbidden). Preflight exited **2**; Playwright did not start (`0` executed). That stage is retained as history only.

---

## Owner-authorized temporary negative fixture

Owner explicitly authorized one temporary AISTROYKA Cloud fixture for this Phase 3D unlock only:

| Step | Result (sanitized) |
| --- | --- |
| Target web | loopback Next.js |
| Target Supabase | AISTROYKA Cloud (`REF_EQUALS_AISTROYKA: YES`, refs match) |
| Service-role JWT | PRESENT (root), not placeholder |
| Smoke login | OK — tenant role `admin`, one active tenant |
| Smoke grant | `OWNER` |
| Temporary auth user | CREATED — confirmed; `app_metadata.aistroyka_fixture=phase3d_non_grant_e2e` + `run_id` |
| Temporary `tenant_members` | CREATED — role `admin` on smoke active tenant only |
| Temporary `platform_owner_grants` | **ABSENT** (proved before E2E) |
| Temporary `/api/v1/me` | role `admin`; active tenant matches smoke |
| Child env | `SMOKE_*` positive; `QA_ADMIN_*` temporary; `OWNER_AUDIT_DENIED=0`; no secrets written to repo `.env*` |
| Preflight | exit **0** — positive OWNER, negative grant ABSENT, distinct users |
| E2E | `bun run --cwd apps/web e2e:phase3d` — **9 passed / 0 failed / 0 skipped** (~6.6m) |
| Cleanup | exact ID membership delete + fixture-marked auth user delete |
| Cleanup proof | temporary membership ABSENT; auth user ABSENT; grant ABSENT; run marker clear; smoke membership + `OWNER` grant unchanged; active tenant unchanged |
| Fixture types created | `auth_user`, `tenant_members(admin)` only — no tenants, projects, grants, invites, leads, billing, tickets, audit snapshots |

Private orchestration lived under `/tmp/aistroyka-phase3d-*` (`umask 077`, mode `0700`); credentials never entered the repository.

---

## 1. Preflight / target resolution (final run)

| Check | Result |
| --- | --- |
| Loopback base URL | YES (`127.0.0.1`) |
| Supabase refs (host/anon/service) | MATCH + AISTROYKA |
| Overview probe (cookie OWNER) | 200 (service-role present in Next runtime) |
| Positive `SMOKE_*` | PRESENT — grant `OWNER` — tenant role `admin` |
| Negative `QA_ADMIN_*` | PRESENT — grant `ABSENT` — tenant role `admin` |
| Preflight | exit **0** |

---

## 2. Security boundaries

1. Access requires `platform_owner_grants` — not `tenant_members` alone.
2. Middleware + layout `assertPlatformOwnerPageAccess` + `requirePlatformOwnerApi`.
3. `experimental.authInterrupts: true` so `forbidden()` is a real Next.js 403 boundary (not a 500).
4. Safe-audit refresh = non-persistent read; Save Snapshot never invoked (mutation network guard).
5. Execution Engine remains recommendation-only (`execution enabled: false` / Design only / No execution).
6. `POST /api/v1/admin/flags` write-gated via `requirePlatformOwnerApi({ mode: "write" })`.

---

## 3. Browser proof summary

### Negative tenant-admin (temporary)

- UI login OK; `/api/v1/me` → `admin` + active tenant.
- Localized tenant `/admin` shell renders (admin nav); not Operations Center / not platform owner.
- Platform paths fail closed for authenticated non-grant (not mere login redirect).
- APIs: overview `403` `owner_gate`; safe-audit refresh `403`; legacy owner/billing aliases `403`; flags POST `403`.

### Positive platform-owner (`SMOKE_*` OWNER)

- Anonymous → localized login with safe `next` → Operations Center.
- Platform cabinet overview / billing / leads.
- 13 canonical Operations Center routes + legacy ROMA redirects.
- Required read APIs `200` (including `provider-status`; workspace-scoped `pilot-status` not used as required bare GET).
- Safe Audit refresh `200` / non-persistent; Save not called.
- Execution Engine: no Run control; execution disabled copy.
- Responsive desktop / tablet / mobile; representative axe (color-contrast excluded as known token debt).

### Anonymous

- Pages → localized login; APIs deny without data leakage; refresh deny.

**Playwright counts:** 3 projects × (anonymous + negative + positive) = **9 passed**, **0 failed**, **0 skipped**.

---

## 4. Tests and gates (fresh counts)

| Gate | Result |
| --- | --- |
| Focused Phase 3D units (inventory + console-guard + authInterrupts) | **3 files / 11 tests** PASS |
| Full unit suite | **412 files / 2675 tests** PASS |
| Required `e2e:phase3d` | **9 passed / 0 failed / 0 skipped** PASS |
| `check:design` | PASS |
| `i18n:check` | PASS |
| `lint` | PASS |
| `build` | PASS |
| `cf:build` | PASS |
| npm-lock validation | PASS |
| `npm audit --omit=dev` | PASS — **0** vulnerabilities |
| `git diff --check` | PASS |

---

## 5. Defects fixed during unlock E2E

| Defect | Fix |
| --- | --- |
| Required read API `pilot-status` returns 400 without `workspaceId` | Switch required list to `provider-status` |
| Tablet project used WebKit iPad device (browser missing) | Chromium + 768×1024 viewport |
| Console guard treated expected 403/503 resource noise as failure | `isIgnorablePhase3dConsoleError` |
| Ops Center / platform shell page-level horizontal overflow | `min-w-0` / `max-w-full` / overflow-x-auto containment |
| Missing `dashboardDetail.company` (leads table) | Added en/ru/es/it |
| `forbidden()` threw experimental 500 without `authInterrupts` | `experimental.authInterrupts: true` in `next.config.js` |
| Controlled login inputs + disabled submit when React state empty | `pressSequentially` + enabled submit wait |
| Local Next reused without service-role → overview 503 | Orchestrator force-start with root service-role + overview cookie probe |

---

## 6. Files changed (unlock + prior Phase 3D local work in tree)

- `apps/web/next.config.js` — `authInterrupts`
- `apps/web/messages/{en,ru,es,it}.json` — `dashboardDetail.company`
- `apps/web/components/platform-admin/RomaQaCenterShell.tsx`, `PlatformAdminShell.tsx`
- `apps/web/tests/phase3d/**`, `playwright.phase3d.config.ts`, helpers
- `apps/web/lib/platform-admin/phase3d-route-inventory.ts`, `phase3d-console-guard.ts` + tests, `phase3d-auth-interrupts.test.ts`
- Prior in-tree Phase 3D: flags write gate, Safe Audit taxonomy UI, inventory harness
- Docs: this file + matrix CSV

---

## 7. Remaining Phase 3D blockers

**None.** Cleanup proved; smoke unchanged.

Do **not** treat temporary fixture as a standing QA account — it was deleted.

---

## 8. Confirmation

No commit, push, deploy, migration apply, tenant/project/grant creation (beyond the one authorized temporary membership), Save Snapshot, unauthorized mutation, or secret/ID disclosure. Unrelated dirty worktree preserved. Phase 3E not started.
