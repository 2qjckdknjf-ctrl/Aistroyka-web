# Platform Admin — Owner-Only Access Report

**Date:** 2026-07-04  
**Project:** AISTROYKA  
**Scope:** `admin.aistroyka.ai` + `/platform-admin` + `/api/v1/platform/*`  
**Auditor:** Principal Platform Security Engineer (automated + live probes)

---

## 1. Objective

Verify that Platform Admin access is limited to the **approved platform owner** only — not tenant admins, not all registered users, not domain-wide Cloudflare Access.

**Security model (defense in depth):**

```
Cloudflare Access (admin host perimeter)
        ↓
Supabase session (app auth)
        ↓
platform_owner_grants (RBAC — NOT tenant_members)
        ↓
gateOwnerRequest / requirePlatformOwnerApi
```

---

## 2. Cloudflare Access — `admin.aistroyka.ai`

**Audit method:** Read-only API via `CLOUDFLARE_ACCESS_API_TOKEN` (`cf-admin-domain-access-audit.mjs`).

| Check | Result | Evidence |
|-------|--------|----------|
| Apps bound to admin host | **1 app only** | `AISTROYKA Platform Admin` (`526140c2-ea8e-40a5-be76-c9b4137faf4c`) |
| Allow policies | **1** | `Platform operators` (precedence 1) |
| Bypass / non-identity policies | **0** | None |
| Everyone rule | **NO** | No `everyone` in include rules |
| Domain-wide allow (e.g. `@company.com`) | **NO** | Email allowlist only |
| Service-token bypass | **NO** | Not in include rules |
| Allowed identities (masked) | **1 email** | `z6***@privaterelay.appleid.com` (Apple Hide My Email — operator Access identity) |
| Session duration | **8h** | App config |

**Remediation:** None required — policy is already single-operator email allow.

**Note:** Cloudflare Access identity (Apple relay) differs from Supabase login email (`62***@gmail.com`). Same approved operator; separate layers by design.

---

## 3. Supabase — `platform_owner_grants`

**Project:** AISTROYKA (`vthfrxehrursfloevnlp`)

| Check | Result |
|-------|--------|
| Total grant rows | **1** |
| Roles present | **OWNER only** (no `OWNER_OPERATOR`, no `OWNER_READONLY`) |
| Approved owner (masked) | `62***@gmail.com` |
| Grant date | 2026-07-04 |
| Unexpected grants | **None** |

### Tenant admin separation

| Metric | Count |
|--------|-------|
| Users with `tenant_members.role` ∈ `{owner, admin}` | 5 |
| Of those, **with** `platform_owner_grants` | **1** (approved owner only) |
| Tenant owner/admin **without** platform grant | **4** |

Tenant roles (`tenant_members.owner` / `tenant_members.admin`) do **not** confer Platform Admin access unless a separate `platform_owner_grants` row exists.

**Remediation:** None required — no extra grants to remove.

---

## 4. Application guards

| Surface | Guard | Tenant admin sufficient? |
|---------|-------|------------------------|
| `/[locale]/platform-admin/*` pages | `gateOwnerRequest` + `assertPlatformOwnerPageAccess` → `getPlatformOwnerGrant` | **NO** |
| `/api/v1/platform/*` | `requirePlatformOwnerApi` → `getPlatformOwnerGrant` | **NO** |
| Legacy platform `/api/v1/admin/*` (flags POST, billing, leads, cron) | `requirePlatformOwnerLegacyAdminRoute` | **NO** |
| `/api/v1/admin/flags` POST (live probe) | Returns `platform_admin_required` without grant | **NO** |

**Middleware behavior (production `619429f`):**

- Unauthenticated → **307** to `/ru/login?next=…` (not anonymous access)
- Authenticated without grant → **403 Forbidden** (`no_grant`)
- `tenant_members` role is never read for platform-admin authorization

**Automated tests:** `require-platform-admin-legacy-route.test.ts`, `middleware.host-routing.test.ts` — **15/15 pass**.

---

## 5. Live validation (production, unauthenticated)

| Probe | Expected | Observed | Pass |
|-------|----------|----------|------|
| `GET https://admin.aistroyka.ai/` | Access gate | **302** → Cloudflare Access | **YES** |
| `GET /ru/platform-admin` (no session) | Login redirect | **307** → `/ru/login?next=…` | **YES** |
| `GET /api/v1/platform/overview` | Owner gate | **403** `{code: owner_gate}` | **YES** |
| `POST /api/v1/admin/flags` | Platform admin required | **403** `{code: platform_admin_required}` | **YES** |

### Expected behavior by actor (after Supabase login)

| Actor | Cloudflare Access | Supabase session | Platform grant | Platform Admin |
|-------|-------------------|------------------|----------------|----------------|
| Approved owner | Allow | Yes | OWNER | **Allow** |
| Tenant owner/admin (no grant) | Deny* or Allow* | Yes | None | **403** |
| Random registered user | Deny* | Yes | None | **403** |

\*On `admin.aistroyka.ai`, Access denies non-allowlisted emails before app. On public host `/ru/platform-admin`, app gate denies without grant.

---

## 6. Remediation actions taken

| Action | Status |
|--------|--------|
| Remove extra Access policy subjects | **Not needed** — already single email |
| Remove unexpected `platform_owner_grants` | **Not needed** — already single OWNER row |
| Delete normal user accounts | **Not performed** (not required) |
| Code / RBAC weakening | **None** |

---

## 7. Ongoing verification

```bash
# Cloudflare Access (masked output)
cd apps/web && node scripts/cf-admin-domain-access-audit.mjs

# Supabase grants (service role / MCP — count only)
# SELECT role, count(*) FROM platform_owner_grants GROUP BY role;

# App guards
cd apps/web && bunx vitest run lib/api/require-platform-admin-legacy-route.test.ts middleware.host-routing.test.ts
```

Re-run after any Access policy change, new operator onboarding, or grant provisioning.

---

## 8. Final verdicts

| Verdict | Value |
|---------|-------|
| `ONLY_APPROVED_OWNER_CAN_ACCESS` | **YES** |
| `CLOUDFLARE_ACCESS_OWNER_ONLY` | **YES** — single email allow, no bypass/everyone/domain rules |
| `SUPABASE_PLATFORM_GRANT_OWNER_ONLY` | **YES** — 1 OWNER row, no operator/readonly grants |
| `TENANT_ADMIN_BLOCKED` | **YES** — 4 tenant admins lack platform grant; guards require grant |
| `NORMAL_USER_BLOCKED` | **YES** — no grant + owner gate / Access deny |

**Security weakened:** **NO**

---

## 9. Related documents

- `docs/security/PLATFORM_ADMIN_FORBIDDEN_ROOT_CAUSE_REPORT.md`
- `docs/security/ADMIN_DOMAIN_PHASE1_EXECUTION_REPORT.md`
- `docs/security/ADMIN_DOMAIN_TARGET_ARCHITECTURE.md`
- `docs/audits/PLATFORM_ADMIN_P0_LOCKDOWN_REPORT.md`
