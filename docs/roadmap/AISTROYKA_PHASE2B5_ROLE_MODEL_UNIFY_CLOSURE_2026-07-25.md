# AISTROYKA Phase 2B.5 — Role Model Unify Closure

Date: 2026-07-25  
Batch: `2B_role_model_unify` only  
Repo: `/Users/alex/Projects/AISTROYKA`  
Branch: `security/platform-admin-separation`  
Prior: Phase 2B.4 accepted YES; migration `20260725143000_dequeue_tenant_job.sql` still **NOT APPLIED**

Phase 2A / 2B.1–2B.4 artifacts are historical baseline — **not edited**.

Do **not** start Phase 2B.6 (`2B_stakeholder_middleware_wire`) unless explicitly requested.  
Do **not** apply migrations. Do **not** commit/push/deploy.

---

## Verdict

**YES**

`Allowed to proceed to Phase 2B.6: YES`

Overall Phase 2: **IN PROGRESS**  
Overall release: **NO-GO**

---

## 1. Audit (pre-fix)

| Item | Pre-change |
| --- | --- |
| `tenant-role (1).server.ts` | Identical unused dup of `tenant-role.server.ts` |
| `stakeholder-dashboard-paths (1).ts` | Divergent dup missing `/portal` rules |
| `stakeholder-dashboard-paths (1).test.ts` | Duplicate thinner suite |
| `ProjectMemberRole` in types | Missing `owner` vs repository/DB |
| `lib/auth/tenant.ts` | Legacy helpers omitting `stakeholder`; **9** import sites |
| Stakeholder middleware wire | Out of scope → `2B_stakeholder_middleware_wire` |

---

## 2. Fixes applied

### Deleted

- `apps/web/lib/tenant/tenant-role (1).server.ts`
- `apps/web/lib/tenant/stakeholder-dashboard-paths (1).ts`
- `apps/web/lib/tenant/stakeholder-dashboard-paths (1).test.ts`
- `apps/web/lib/auth/tenant.ts`

### Added / product

- `apps/web/lib/tenant/tenant-membership.server.ts` — canonical `getRoleInTenant` / `hasMinRole` / `roleAtLeast` with `TenantRoleDb` including **stakeholder** (rank 0; never satisfies viewer+)
- Exported from `apps/web/lib/tenant/index.ts`
- `project-members.types.ts` includes `owner`; repository imports shared type
- `tenant.policy.ts` ROLE_ORDER documents `stakeholder: 0`

### Migrated call sites (9)

- `app/api/v1/tenant/invitations/route.ts`
- `app/api/v1/tenant/revoke/route.ts`
- `app/api/v1/projects/[id]/upload/route.ts`
- `app/api/v1/projects/[id]/jobs/[jobId]/trigger/route.ts`
- `app/api/projects/[id]/upload/route.ts`
- `lib/supabase/rpc.ts`
- `app/[locale]/(dashboard)/layout.tsx`
- `app/[locale]/(dashboard)/projects/page.tsx`
- `app/[locale]/(dashboard)/team/page.tsx`

### Tests

- `tenant-membership.server.test.ts`
- `phase2b5-role-model-unify.test.ts`

---

## 3. Explicitly not done (next batch)

- Wiring `redirectIfStakeholderBlockedPath` into `middleware.ts` → Phase **2B.6**
- Deleting unrelated `(1)` files outside this batch (maestro, wrangler, report-approval, etc.)

---

## 4. Validation

| Gate | Result |
| --- | --- |
| Focused: `tenant-membership` + `phase2b5` + stakeholder paths + policy | PASS — 29 tests |
| Broader: `lib/tenant` + `lib/domain/project-members` | PASS — 9 files / 43 tests |
| `bun run lint` | PASS |
| `bun run test` | PASS — 380 files / 2411 tests |
| `bun run build` | PASS |
| `bun run cf:build` | PASS — worker patch retained |
| Worker postcondition | PASS |
| `bun run --cwd apps/web check:design` | PASS |
| `node scripts/ci/validate-npm-lock.cjs` | PASS |
| `bun install --frozen-lockfile` | PASS |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `git diff --check` | PASS |

---

## 5. Constraints

| Constraint | Status |
| --- | --- |
| Phase 2A–2B.4 artifacts unchanged | YES |
| Dependency/lock files changed by this phase | NO |
| Migration applied | NO |
| Commit/push/deploy | NO |
| User dirty worktree preserved | YES |
| Stakeholder middleware not prematurely wired | YES |

---

## 6. Remaining known Phase 2B.5 issues

**none**
