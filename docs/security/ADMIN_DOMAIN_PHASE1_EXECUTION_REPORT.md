# Admin Domain — Phase 1 Execution Report

**Date:** 2026-07-03  
**Branch:** `security/platform-admin-separation`  
**Executor:** Engineering (Wrangler OAuth + Cloudflare API)

---

## 1. Infrastructure changes actually completed

| Step | Action | Result |
|------|--------|--------|
| Worker route | `wrangler triggers deploy` OAuth — `admin.aistroyka.ai/*` | **DONE** (later superseded by custom domain) |
| Worker custom domain | `wrangler triggers deploy -c wrangler.admin-phase1.toml` | **DONE** |
| Apex routes preserved | `aistroyka.ai/*`, `www.aistroyka.ai/*` re-applied same deploy | **DONE** |
| DNS | Auto-created by custom domain binding | **DONE** (resolves on 1.1.1.1) |
| TLS | Certificate `cert_id` issued, HTTPS 200 | **DONE** |
| Cloudflare Access | API attempt | **NOT DONE** — auth error |
| `OWNER_ALLOWED_HOSTS` | Not set on Worker | **Correct for Phase 1** |

### Wrangler command used (OAuth — `CLOUDFLARE_API_TOKEN` unset)

```bash
cd apps/web
unset CLOUDFLARE_API_TOKEN
bunx wrangler triggers deploy -c wrangler.admin-phase1.toml -e production --name aistroyka-web-production
```

Output:

```
Deployed aistroyka-web-production triggers
  aistroyka.ai/* (zone name: aistroyka.ai)
  www.aistroyka.ai/* (zone name: aistroyka.ai)
  admin.aistroyka.ai (custom domain)
```

---

## 2. Status summary

| Component | Status | Detail |
|-----------|--------|--------|
| **DNS** | **LIVE** | `dig @1.1.1.1 +short admin.aistroyka.ai` → `104.21.45.103`, `172.67.213.36` |
| **TLS** | **VALID** | Custom domain `cert_id: 5d31e858-5c83-49ad-9cd9-db3e7f26c588`, `enabled: true` |
| **Worker binding** | **LIVE** | `admin.aistroyka.ai` → `aistroyka-web-production` |
| **Cloudflare Access** | **NOT ENABLED** | Validated 2026-07-03 — no Access challenge (§3) |
| **OWNER_ALLOWED_HOSTS** | **NOT SET** | Phase 3 enforcement only |

---

## 3. Validation results

**Validation run:** 2026-07-03 (post–Access-setup check, read-only, no code/deploy changes)

### Check 1 — Cloudflare Access before app access

| Probe | Expected | Observed | Pass |
|-------|----------|----------|------|
| `curl -sI https://admin.aistroyka.ai/` | Redirect to `*.cloudflareaccess.com` | **HTTP 307** → `location: /ru` (app locale middleware) | **NO** |
| Access response headers | `cf-access-*` or Access login redirect | None; `server: cloudflare` only | **NO** |

**Conclusion:** Cloudflare Access is **not** in front of the admin host. Unauthenticated clients reach the production Worker directly.

### Check 2 — Admin health endpoint Access policy

| Probe | Expected (with Access) | Observed | Pass |
|-------|------------------------|----------|------|
| `curl -sI https://admin.aistroyka.ai/api/v1/health` | Access challenge or deny without session | **HTTP 200**, `content-type: application/json` | **NO** |
| Body (unauth) | Not reachable without Access session | `{"ok":true,"db":"ok",...,"buildStamp":{"sha7":"7f1b42f"}}` | **NO** |

Health is **publicly reachable** on `admin.aistroyka.ai` — not gated by Access.

### Check 3 — Apex production health (unchanged)

```bash
curl -s https://aistroyka.ai/api/v1/health
# {"ok":true,"db":"ok","aiConfigured":true,...,"buildStamp":{"sha7":"7f1b42f","buildTime":"2026-07-01 12:58"}}

curl -s https://www.aistroyka.ai/api/v1/health
# {"ok":true,...,"buildStamp":{"sha7":"7f1b42f",...}}
```

| Verdict | **HEALTHY** — apex and www unaffected |

### Check 4 — DNS and TLS

| Target | Result | Pass |
|--------|--------|------|
| `dig @1.1.1.1 +short admin.aistroyka.ai` | `172.67.213.36`, `104.21.45.103` | **YES** |
| `dig @1.1.1.1 +short aistroyka.ai` | Same Cloudflare anycast pair | **YES** |
| TLS `admin.aistroyka.ai` | CN=`aistroyka.ai`, GTS WE1, valid Jul 3 – Oct 1 2026 | **YES** |

### Check 5 — Worker serves admin host after Access login

| Status | Detail |
|--------|--------|
| **NOT TESTED** | Access gate absent; cannot obtain Access session cookie from this environment |
| Worker reachability (unauth) | Admin host returns same build as apex (`sha7: 7f1b42f`) — Worker binding **live** |

Post-Access-login behavior requires owner MFA test after Access app is created.

### Check 6 — Route exposure on admin host (compatibility mode, no enforcement)

`OWNER_ALLOWED_HOSTS` **not set**; host enforcement **not enabled** (by design for Phase 1).

| Path | Unauth response | Notes |
|------|-----------------|-------|
| `/` | 307 → `/ru` | Public locale routing (same as product host) |
| `/ru/dashboard` | 307 → `/ru/login?next=...` | Tenant dashboard path reachable; app auth only |
| `/platform-admin` | 404 → `/ru/platform-admin` | Legacy alias still routed (compatibility) |
| `/api/v1/health` | 200 JSON | Public |
| `/api/v1/ops/metrics` | 401 JSON | App-level auth gate only |

**Conclusion:** Admin host currently mirrors full product routing — **no Access layer**, **no host-profile enforcement**. Exposure is limited to existing app auth rules only; this matches Phase 1 compatibility mode but **fails** the intended Access-first admin perimeter.

### Worker routes (API read — unchanged)

```json
["admin.aistroyka.ai/*", "aistroyka.ai/*", "www.aistroyka.ai/*"]
```

### Custom domain record (unchanged)

```json
{
  "hostname": "admin.aistroyka.ai",
  "service": "aistroyka-web-production",
  "enabled": true,
  "cert_id": "5d31e858-5c83-49ad-9cd9-db3e7f26c588"
}
```

### Cloudflare Access API (read attempt)

```bash
GET /accounts/864f04d729c24f574a228558b40d7b82/access/apps
# HTTP 403, code 10000 — cannot confirm app existence via API token
```

**Note:** Local stub resolver may lag; validation used live `https://admin.aistroyka.ai` and `dig @1.1.1.1`.

---

## 4. Exact blockers

### Cloudflare Access (remaining)

| Field | Value |
|-------|-------|
| API call | `GET /accounts/864f04d729c24f574a228558b40d7b82/access/apps` |
| HTTP status | **403** |
| Error code | **10000** |
| Body | `Authentication error` |
| Blocker type | **credentials / permissions** |
| Cause | `CLOUDFLARE_API_TOKEN` in `.env.cf` lacks Zero Trust Access scopes; Wrangler OAuth also lacks Access |

**Dashboard configuration (owner — matches approved spec):**

1. Zero Trust → Access → Applications → **Add application** → **Self-hosted**
2. Name: `AISTROYKA Platform Admin`
3. Domain: `admin.aistroyka.ai`
4. Policy: **Allow** — platform operator emails only (default script email: `z6pxn548dk@privaterelay.appleid.com`; set `CLOUDFLARE_ACCESS_OPERATOR_EMAILS` for more)
5. **MFA: Required** (independent MFA / TOTP)
6. **Bypass: None**

**Or API (after creating token with Access edit scope):**

```bash
cd apps/web
# Add CLOUDFLARE_ACCESS_API_TOKEN to .env.cf (separate from read-only deploy token)
CLOUDFLARE_ACCESS_OPERATOR_EMAILS="ops@example.com" node scripts/cf-admin-domain-access.mjs
```

**Validate Access live:**

```bash
curl -sI --resolve admin.aistroyka.ai:443:188.114.96.5 https://admin.aistroyka.ai/ | head
# Expect redirect to *.cloudflareaccess.com (not direct /ru)
```

### API token writes (Worker — resolved via OAuth)

| API call | HTTP | Code | Blocker |
|----------|------|------|---------|
| `POST .../routes` with API token | 405 | 10405 | permissions |
| `POST .../domains` with API token | 405 | 10405 | permissions |
| `POST zones/.../dns_records` with API token | 403 | 10000 | permissions |

---

## 5. What was not done (by design)

- `OWNER_ALLOWED_HOSTS` not set on production Worker
- No host enforcement / public redirects
- No legacy alias removal
- No ROMA changes
- No production Worker code deploy

---

## 6. Remaining for Phase 1 completion

1. **Create Cloudflare Access app** on `admin.aistroyka.ai` (Dashboard — see §4)
2. Re-run validation: `curl -sI https://admin.aistroyka.ai/` → `*.cloudflareaccess.com` (not `/ru`)
3. Confirm `/api/v1/health` on admin host is Access-gated (challenge or 302 to Access)
4. Owner MFA enrollment + post-login smoke on admin host

## 7. Phase 2 readiness

Blocked until Access validation passes (§3 checks 1–2 **YES**):

- Deploy host-profile middleware to production (branch merge)
- Begin Phase 3 host enforcement (`OWNER_ALLOWED_HOSTS`, redirects)

---

## 8. Verdicts

| Verdict | Value |
|---------|-------|
| `ADMIN_DOMAIN_PHASE1_COMPLETE` | **NO** — Access not enabled; checks 1–2 failed |
| `CLOUDFLARE_ACCESS_ENABLED` | **NO** |
| `READY_FOR_PHASE2_HOST_ROUTING` | **NO** — Worker/DNS/TLS live; Access gate required first |
| `PRODUCTION_HEALTH` | **HEALTHY** |
