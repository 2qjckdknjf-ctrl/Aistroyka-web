# Admin Domain — Cloudflare Plan

**Date:** 2026-07-03  
**Host:** `admin.aistroyka.ai`  
**Status:** Design only — **no Cloudflare changes in this commit**

---

## 1. Prerequisites

| Prerequisite | Owner |
|--------------|-------|
| Cloudflare zone `aistroyka.ai` admin access | Platform owner |
| Worker `aistroyka-web-production` deploy rights | CI + owner |
| Zero Trust / Access license (included in most CF plans) | Owner |
| Platform operator email list / IdP group | Owner |
| `security/platform-admin-separation` merged to `main` | Engineering |

---

## 2. DNS

### Production record

| Field | Value |
|-------|-------|
| Type | `CNAME` (recommended) or `AAAA`/`A` if using CF proxy on Worker custom domain |
| Name | `admin` |
| Target | Same as apex Worker routing target (proxied orange cloud **ON**) |
| TTL | Auto |
| Proxy status | **Proxied** (required for Access + WAF) |

**Note:** With Workers custom domains, Cloudflare may auto-create DNS when binding `admin.aistroyka.ai` to `aistroyka-web-production`. Prefer **Workers Custom Domains** UI over manual A record when available.

### Staging (recommended before prod)

| Option | Record | Purpose |
|--------|--------|---------|
| A | `admin-staging.aistroyka.ai` → staging Worker | Validate Access + routing without prod cutover |
| B | Use `staging.aistroyka.ai` path fallback only | Lower isolation; not recommended for Access test |

---

## 3. Worker routing

### Option A — Custom Domain binding (recommended)

1. Cloudflare Dashboard → Workers & Pages → `aistroyka-web-production`
2. Settings → Domains & Routes → **Add Custom Domain**
3. Domain: `admin.aistroyka.ai`
4. Confirm TLS certificate issuance (CF managed)

Same Worker serves both `aistroyka.ai` and `admin.aistroyka.ai`; host header distinguishes routing.

### Option B — Route pattern (legacy)

```
Zone: aistroyka.ai
Pattern: admin.aistroyka.ai/*
Worker: aistroyka-web-production
```

Also add bare host route if needed: `admin.aistroyka.ai`

**Repo policy:** Routes are dashboard-managed (`wrangler.toml` routes commented). Document binding in runbook; do not auto-create via CI (permission 10000 note in wrangler).

### TLS expectations

| Item | Expectation |
|------|-------------|
| Certificate | Cloudflare Universal SSL or Advanced Certificate for `admin.aistroyka.ai` |
| Mode | Full (strict) between CF edge and origin if origin exists; Worker-only = CF-managed |
| HSTS | App middleware sets `Strict-Transport-Security` on HTML responses |
| Minimum TLS | TLS 1.2+ (zone SSL/TLS settings) |

---

## 4. Cloudflare Access (Zero Trust)

### Application definition

| Field | Value |
|-------|-------|
| Application name | `AISTROYKA Platform Admin` |
| Application type | Self-hosted |
| Session domain | `admin.aistroyka.ai` |
| Protected paths | `admin.aistroyka.ai/*` (entire subdomain) |

### Policy (default deny)

| Policy | Action | Rule |
|--------|--------|------|
| Platform operators | **Allow** | Email in allowlist **OR** IdP group `aistroyka-platform-admin` |
| Everyone else | **Block** | Default |

**Allowed identities (initial):**

- Named platform owner emails (from `platform_owner_grants` holders)
- Optional: Google Workspace / GitHub org group if IdP integrated

**Bypass rules:** **None by default.**

- No IP bypass for production
- No service token bypass until automation need is documented (ROMA Safe Audit future slice)

### MFA requirement

| Setting | Value |
|---------|-------|
| MFA | **Required** for all allowed identities |
| Method | TOTP (authenticator app) preferred; WebAuthn if IdP supports |
| Remember device | **Disabled** for platform admin (or max 1 day if operator friction too high) |

### Session duration

| Setting | Recommended |
|---------|-------------|
| Application session | **8 hours** (workday) |
| Idle timeout | **30 minutes** |
| Re-auth for sensitive | Align with app `OWNER_STEP_UP` for critical API mutations |

### Optional hardening (recommendations)

| Control | Recommendation |
|---------|----------------|
| Country policy | Allow operator countries only if team is geo-stable |
| IP allowlist | Mirror `OWNER_IP_ALLOWLIST` at Access layer for defense in depth |
| Device posture | Require managed device if fleet supports (CF device posture) |
| WAF | Enable OWASP core ruleset on zone; custom rule block non-GET to `/api/v1/platform/critical/*` without Access JWT |

---

## 5. Access → application identity flow

```
Browser → admin.aistroyka.ai
    → Cloudflare Access challenge (email + MFA)
    → Access JWT (Cf-Access-Jwt-Assertion header to origin)
    → Worker / OpenNext
    → Supabase session cookie (separate login if not already authenticated)
    → platform_owner_grants check
```

**Important:** Cloudflare Access and Supabase auth are **independent layers**. Access gates the host; Supabase session gates application grants.

**Future enhancement (not Phase 1):** Validate `Cf-Access-Jwt-Assertion` in middleware to bind Access identity to audit logs. Not required if grant check remains mandatory.

---

## 6. Service tokens (deferred)

Use **only** when:

- Automated ROMA Safe Audit runner needs headless access
- CI needs read-only platform health from admin host

If added later:

- Dedicated Access policy for service token
- Scope: `GET /api/v1/platform/testing/quality` only
- No bypass on write/critical routes
- Token rotation quarterly

---

## 7. Logging expectations

| Log source | Retention | Use |
|------------|-----------|-----|
| Cloudflare Access logs | 30–90 days (plan dependent) | Who reached admin host |
| Worker observability | CF dashboard | 5xx, latency on admin host |
| `platform_owner_audit_log` | DB retention policy | What operators did in app |
| Owner gate events | App logs / observability | Deny reasons |

Alerting (recommended):

- Spike in Access denials
- Spike in `owner_gate` denials with `host_blocked`
- Any `critical/echo` success from non-operator IP

---

## 8. Environment variables (Worker secrets)

Set on `aistroyka-web-production` (Dashboard or `wrangler secret`):

| Secret / var | When to set |
|--------------|-------------|
| `OWNER_ALLOWED_HOSTS=admin.aistroyka.ai` | Phase 3 app enforcement |
| `OWNER_IP_ALLOWLIST` | Optional, operator IPs |
| `OWNER_AUDIT_DENIED=1` | Phase 4 validation |
| Existing Supabase keys | Already required |

**Do not** put Access secrets in Worker env — Access is edge-configured.

---

## 9. Cloudflare change checklist (owner execution)

- [ ] Create DNS / custom domain for `admin.aistroyka.ai`
- [ ] Verify TLS certificate active
- [ ] Create Access application for subdomain
- [ ] Add allow policy (emails/groups)
- [ ] Enable MFA requirement
- [ ] Set session duration (8h / 30m idle)
- [ ] Confirm no bypass rules
- [ ] Test Access login from operator browser
- [ ] Confirm blocked for non-allowlisted email
- [ ] Set `OWNER_ALLOWED_HOSTS` on production Worker
- [ ] Deploy app host-routing code (separate engineering PR)
- [ ] Run validation checklist (`ADMIN_DOMAIN_VALIDATION_CHECKLIST.md`)

---

## 10. What we are NOT doing in Cloudflare (this plan)

- Changing apex `aistroyka.ai` routes
- Moving tenant traffic to different Worker
- Exposing platform admin without Access
- Creating public bypass for `/platform-admin/testing`
- Committing API tokens or Access service keys to repo
