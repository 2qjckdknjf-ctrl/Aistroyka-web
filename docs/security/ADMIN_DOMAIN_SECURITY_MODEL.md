# Admin Domain — Security Model

**Date:** 2026-07-03  
**Host:** `admin.aistroyka.ai`  
**Principle:** Defense in depth — no single layer is sufficient

---

## 1. Layered security model

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 1 — DNS / subdomain separation                                    │
│ admin.aistroyka.ai ≠ aistroyka.ai — blast radius isolation              │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 2 — Cloudflare Access (Zero Trust)                                │
│ Identity at edge; default deny; allowlisted operators only              │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 3 — MFA (Access policy)                                           │
│ TOTP / WebAuthn required for all admin host sessions                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 4 — Application session (Supabase Auth)                           │
│ HttpOnly cookies; session freshness policy; no service role in browser  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 5 — platform_owner_grants (RBAC)                                  │
│ OWNER / OWNER_OPERATOR / OWNER_READONLY — not tenant_members          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 6 — API guard (requirePlatformOwnerApi)                           │
│ Method tiers; write/critical modes; rate limits; optional step-up      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 7 — Audit logging                                                 │
│ platform_owner_audit_log + gate events + Cloudflare Access logs         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 8 — Break-glass policy                                            │
│ platform_break_glass_grants; time-boxed; audited; owner-approved only   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Identity and access matrix

### Who can access `admin.aistroyka.ai`?

| Actor | Layer 2 Access | Layer 4 Session | Layer 5 Grant | Result |
|-------|----------------|-----------------|---------------|--------|
| Anonymous | Deny | — | — | Blocked at Access |
| Random authenticated user | Allow* | Yes | No grant | 403 at app gate |
| Tenant admin | Deny** | — | — | Blocked |
| Platform owner | Allow | Yes | OWNER* | Full (per role) |
| Platform operator | Allow | Yes | OWNER_OPERATOR | Read + scoped write |
| Platform readonly | Allow | Yes | OWNER_READONLY | Read only |

\*Access allowlist should only include platform operators, not all Supabase users.  
\**Tenant admins must not be in Access allowlist.

### Role capabilities (existing `owner-capabilities.ts`)

| Capability | OWNER | OWNER_OPERATOR | OWNER_READONLY |
|------------|-------|----------------|----------------|
| Read platform overview | Yes | Yes | Yes |
| Read ROMA dashboard | Yes | Yes | Yes |
| Read tenants/users/support | Yes | Yes | Yes |
| Billing pilot read | Yes | Yes | Yes |
| Billing pilot write | Yes | Yes | No |
| Leads CRM write | Yes | Yes | No |
| Critical mutations (`critical/echo`, step-up) | Yes | No | No |
| Feature flags (future platform route) | Yes | Write | No |

---

## 3. Operation-specific access

| Operation | Who can read | Who can operate | Who can approve release |
|-----------|--------------|-----------------|-------------------------|
| ROMA Testing dashboard | All platform grant roles | N/A (read-only) | OWNER (human judgment) |
| Future ROMA Safe Audit run | OWNER, OWNER_OPERATOR | OWNER_OPERATOR with step-up | OWNER |
| Platform billing reprocess | OWNER, OWNER_OPERATOR | OWNER, OWNER_OPERATOR (write) | OWNER |
| Pilot workspace management | All grants (read) | OWNER, OWNER_OPERATOR | OWNER |
| Contact leads CRM | All grants (read) | OWNER, OWNER_OPERATOR | N/A |
| Feature flags (when migrated) | OWNER_OPERATOR+ | OWNER, OWNER_OPERATOR | OWNER |
| Tenant data (metadata) | Per grant | OWNER, OWNER_OPERATOR | N/A |
| Break-glass tenant content | Audited grant only | OWNER with break-glass row | Owner policy |

**Release approval** is human/process — ROMA provides advisory `releaseDecision` only; no automated promote.

---

## 4. Host and network controls

| Control | Admin host | Public host |
|---------|------------|-------------|
| `OWNER_ALLOWED_HOSTS` | `admin.aistroyka.ai` | N/A (platform paths blocked/redirected) |
| `OWNER_IP_ALLOWLIST` | Recommended | Optional |
| Cloudflare WAF | Enabled | Enabled |
| Access MFA | Required | N/A |
| Security headers | Full page CSP + HSTS | Full page CSP + HSTS |
| `robots` | noindex on platform admin layout | Public SEO rules |

---

## 5. API protection model

### Platform APIs (`/api/v1/platform/*`)

| Check | Enforced by |
|-------|-------------|
| Host = admin (post-cutover) | Middleware (future) |
| Cloudflare Access JWT present | Edge (implicit — request only arrives if Access passed) |
| Supabase session valid + fresh | `gateOwnerRequest` / `requirePlatformOwnerApi` |
| `platform_owner_grants` row | `getPlatformOwnerGrant` |
| HTTP method vs role | `assertOwnerHttpMethodForRole` |
| Write/critical mode | `requirePlatformOwnerApi({ mode })` |
| Rate limit | `assertOwnerRateLimit` |
| Critical step-up | `OWNER_STEP_UP_SECRET` + header |
| Audit row | `insertPlatformOwnerAudit` |

### System / cron plane

| Surface | Protection |
|---------|------------|
| `CRON_SECRET` routes | Secret header only; no browser UI |
| `OWNER_GATE_SECRET` routes | Optional `X-Owner-Key` |
| Tenant `/api/v1/admin/jobs/*` | `blockAuthenticatedNonPlatformCronCaller` (P0) |

### Legacy aliases

Same grant requirements via delegation — deprecation headers signal migration.

---

## 6. Tenant admin isolation guarantees

| Vector | Mitigation |
|--------|------------|
| Tenant admin visits `/platform-admin` on public host | Redirect to admin host → Access deny (not in allowlist) |
| Tenant admin calls `/api/v1/platform/*` | 403 host + grant |
| Tenant admin uses `/api/v1/admin/billing/*` | Delegates to platform API → grant required |
| Tenant admin escalates via `/owner` | Redirect; grant required |
| Tenant admin on admin host URL | Access deny at edge |
| Cross-tenant data via platform UI | Metadata only; break-glass for content |

---

## 7. Secrets handling

| Secret | Location | Client exposure |
|--------|----------|-----------------|
| Supabase anon key | `NEXT_PUBLIC_*` | Public (RLS protected) |
| Service role key | Worker secret | **Never** client |
| `OWNER_GATE_SECRET` | Worker secret | **Never** |
| `OWNER_STEP_UP_SECRET` | Worker secret | **Never** |
| `CRON_SECRET` | Worker secret | **Never** |
| Cloudflare Access keys | CF dashboard | **Never** in repo |

---

## 8. Audit requirements

| Action | Log destination | Fields |
|--------|-----------------|--------|
| Access login success/fail | Cloudflare Access | email, IP, device |
| Owner gate deny | `logOwnerGateEvent` | reason, path, userId, IP |
| Platform API call | `platform_owner_audit_log` | user_id, action, entity, IP, metadata |
| Critical mutation | Audit + security alert | step-up verified |
| Break-glass use | `platform_break_glass_grants` + audit | grant id, expiry |

Retention: align with compliance policy; minimum 90 days for Access logs.

---

## 9. Break-glass policy

Use when:

- Operator locked out of Access (IdP outage)
- Emergency production intervention requires platform owner content access

Rules:

1. Pre-provisioned `platform_break_glass_grants` row with expiry
2. Requires second owner approval out-of-band
3. All actions audited with `break_glass=true` metadata
4. Post-incident review within 24h
5. **Never** disable Access bypass globally for convenience

Emergency fallback for admin host outage: use primary domain fallback **only** if DNS/routing broken — not as steady state (see rollback plan).

---

## 10. Threat scenarios

| Threat | Layers that mitigate |
|--------|----------------------|
| Stolen tenant admin credentials | No grant; Access deny; host separation |
| Stolen platform owner password | MFA; session freshness; rate limits |
| Direct API attack on `/api/v1/platform/*` | Host binding; grant; rate limit |
| CSRF on platform admin | SameSite cookies; CSP frame-ancestors none |
| XSS in platform admin | CSP; no secrets in DOM |
| Reconnaissance of admin surface | Subdomain not linked from public marketing |
| Insider readonly escalation | Role checks on write/critical modes |

---

## 11. Compliance with customer-finance boundary

Platform admin may see **metadata** (tenant ids, billing pilot status, support tickets).  
Must **not** expose internal contractor financial state on any surface reachable by customers.  
ROMA and platform admin remain operator-only — no stakeholder/portal overlap.
