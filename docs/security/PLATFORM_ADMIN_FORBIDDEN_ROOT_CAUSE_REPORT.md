# Platform Admin FORBIDDEN — Root Cause Report

**Date:** 2026-07-04  
**Branch:** `security/platform-admin-separation`  
**Incident:** After Cloudflare Access login, `https://admin.aistroyka.ai/ru/platform-admin` returned **Forbidden**  
**Severity:** Production — platform operators blocked from admin cabinet

---

## 1. Executive summary

**Root cause (dual failure):**

1. **Database:** `platform_owner_grants` (and `platform_owner_audit_log`) migrations existed in the repo but were **never applied** to production Supabase project **AISTROYKA** (`vthfrxehrursfloevnlp`). `getPlatformOwnerGrant()` failed → `gateOwnerRequest()` returned **403 Forbidden** (`supabase_error` / `no_grant`).

2. **Auth flow:** Cloudflare Access and Supabase Auth are **separate layers**. Access success does not create a Supabase session. Middleware called `gateOwnerRequest()` for unauthenticated users and returned **403 Forbidden** instead of redirecting to `/login?next=/ru/platform-admin`.

**Not the cause:** Cloudflare Access misconfiguration, DNS/TLS, host routing Phase 2 logic, RBAC bypass, or `OWNER_ALLOWED_HOSTS` enforcement.

---

## 2. Request path trace

```
Cloudflare Access (admin.aistroyka.ai)     ✅ PASS — operator authenticated at edge
        ↓
Worker / OpenNext                          ✅ PASS — request reaches app
        ↓
Middleware (host routing)                  ✅ PASS — /ru/platform-admin allowed on admin host
        ↓
Middleware updateSession (Supabase)        ⚠️  Often NO session cookie after Access-only login
        ↓
Middleware gateOwnerRequest()              ❌ DENY
        ├─ no_session → 403 Forbidden (plain text)   [before fix]
        └─ no_grant / db_error → 403 Forbidden       [missing table]
        ↓
Platform Admin layout                      (never reached on deny)
```

**Component returning Forbidden:** `gateOwnerRequest()` in `apps/web/lib/platform-owner/middleware-owner-gate.ts` via `ownerForbiddenResponse(false)`.

---

## 3. Evidence

### CHECK 1 — Cloudflare Access identity

| Item | Finding |
|------|---------|
| Unauthenticated admin host | **302** → `*.cloudflareaccess.com` |
| Access policy | Allow `z6p***@privaterelay.appleid.com` (operator Apple Hide My Email) |
| CF JWT to Worker | Standard Access headers; identity **does not** substitute Supabase session |
| Gap | Access email ≠ Supabase auth email unless operator completes app login |

### CHECK 2 — Application authentication

| Item | Finding |
|------|---------|
| Supabase session after Access-only visit | **Typically absent** — separate cookie domain/session |
| Expected behavior | Operator must sign in at `/ru/login` on admin host after Access |
| Bug | Missing session returned **403** instead of login redirect |

### CHECK 3 — Identity mapping

| Layer | Mapping |
|-------|---------|
| Cloudflare Access | Apple relay operator email |
| Supabase Auth | Operator production account `626***@gmail.com` (last sign-in 2026-07-03) |
| Link | **Manual** — same human, different identifiers; no automatic bridge in app |

### CHECK 4 — Database (`platform_owner_grants`)

**Before fix:**

```sql
SELECT * FROM platform_owner_grants;
-- ERROR: relation "platform_owner_grants" does not exist
```

Remote migration history skipped repo files `20260427120000_platform_owner_grants` and `20260428120000_platform_owner_roles_audit`.

**After fix:**

| Field | Value |
|-------|-------|
| Table | `platform_owner_grants` — **created** |
| Audit table | `platform_owner_audit_log` — **created** |
| Grant row | **1 row**, role `OWNER`, user `86175e83-…` (masked email `626***@gmail.com`) |
| RLS | Select-own policy; writes service-role only |

### CHECK 5 — Middleware denial reasons

| Condition | Response | Log reason |
|-----------|----------|------------|
| No Supabase user | 403 `Forbidden` | `no_session` |
| Missing grants table / no row | 403 `Forbidden` | `supabase_error` / `no_grant` |
| Valid session + grant | Allow | `allow` |

### CHECK 6 — Logs

Owner gate emits structured JSON (`type: owner_gate`) to Worker logs. Production log tail not available in this session; denial reason inferred from code path + DB state.

---

## 4. Fixes applied

### 4.1 Production database (immediate)

Applied via Supabase MCP to project **AISTROYKA**:

1. Migration `platform_owner_grants` — table + RLS
2. Migration `platform_owner_roles_audit` — tiered roles + audit log
3. Provisioned **OWNER** grant for operator Supabase user (service-role SQL; email matched existing auth user)

### 4.2 Application (requires deploy)

| File | Change |
|------|--------|
| `apps/web/middleware.ts` | Unauthenticated platform-admin pages → **redirect** to `/{locale}/login?next=…` (not 403) |
| `apps/web/lib/entry/entry-routing.ts` | Allow `/platform-admin` and `/owner` in safe `next` post-login paths |
| `apps/web/scripts/bootstrap-platform-owner-grant.mjs` | Service-role bootstrap script for future operators |
| Tests | Middleware + entry-routing coverage |

**Security preserved:**

- Cloudflare Access unchanged
- `platform_owner_grants` RBAC unchanged
- No hardcoded bypass in app code
- Tenant admins still blocked without grant row
- Platform APIs still require owner gate

---

## 5. Validation

### Automated tests

```bash
cd apps/web
bunx vitest run middleware.host-routing.test.ts lib/entry/entry-routing.test.ts \
  lib/platform-admin/host-routing.test.ts lib/api/require-platform-admin-legacy-route.test.ts
```

### Operator smoke (post-deploy for middleware redirect)

1. Cloudflare Access login → `admin.aistroyka.ai`
2. If no Supabase session → redirect to `/ru/login?next=/ru/platform-admin`
3. Login with `626***@gmail.com` (Supabase credentials)
4. `/ru/platform-admin` → **200** Platform Admin shell
5. `/ru/platform-admin/testing` → ROMA Testing loads
6. Tenant admin account → still **403** on platform-admin (no grant)

### Immediate partial validation (DB grant live now)

Operators with an **existing Supabase session** and matching grant should reach platform-admin **before** middleware deploy. Operators with Access-only session need deploy + login flow.

---

## 6. Security impact

| Question | Answer |
|----------|--------|
| Security weakened? | **NO** |
| Access removed? | **NO** |
| RBAC bypass added? | **NO** |
| Grant self-service enabled? | **NO** — service-role bootstrap / SQL only |

---

## 7. Follow-up

1. **Deploy** middleware + entry-routing fix to production (merge + Cloudflare deploy)
2. Reconcile repo ↔ remote migration timestamps in `docs/audit/LIVE_SUPABASE_SCHEMA_REPORT.md`
3. Add rollout checklist item: verify `platform_owner_grants` exists before admin domain go-live
4. Optional: document that Access operator email may differ from Supabase login email

---

## 8. Verdicts

| Verdict | Value |
|---------|-------|
| `PLATFORM_ADMIN_LOGIN_FIXED` | **PARTIAL** — DB + grant **YES** (live); login redirect **YES** (needs deploy) |
| `ROOT_CAUSE` | Missing production `platform_owner_grants` table + no Supabase session after Access-only login treated as 403 |
| `SECURITY_WEAKENED` | **NO** |
| `ROMA_READY` | **YES** after operator completes Supabase login with OWNER grant (post-deploy redirect improves UX) |
