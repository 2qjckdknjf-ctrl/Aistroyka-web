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
| **Cloudflare Access** | **NOT CONFIGURED** | See blockers §4 |
| **OWNER_ALLOWED_HOSTS** | **NOT SET** | Phase 3 enforcement only |

---

## 3. Validation results

### Public production (unchanged)

```bash
curl -s https://aistroyka.ai/api/v1/health
# {"ok":true,"buildStamp":{"sha7":"7f1b42f",...}}
```

### Admin host

```bash
dig @1.1.1.1 +short admin.aistroyka.ai
# 104.21.45.103 / 172.67.213.36

curl -s --resolve admin.aistroyka.ai:443:188.114.96.5 https://admin.aistroyka.ai/api/v1/health
# {"ok":true,"buildStamp":{"sha7":"7f1b42f",...}}
```

SHA matches apex — same production Worker build.

### Worker routes (API read)

```json
["admin.aistroyka.ai/*", "aistroyka.ai/*", "www.aistroyka.ai/*"]
```

### Custom domain record

```json
{
  "hostname": "admin.aistroyka.ai",
  "service": "aistroyka-web-production",
  "enabled": true,
  "cert_id": "5d31e858-5c83-49ad-9cd9-db3e7f26c588"
}
```

### Cloudflare Access

Not observed — no Access challenge on admin host (expected until Access app created).

**Note:** Local stub resolver may lag; use `dig @1.1.1.1` or wait for cache expiry.

---

## 4. Exact blockers

### Cloudflare Access

| Field | Value |
|-------|-------|
| API call | `GET /accounts/864f04d729c24f574a228558b40d7b82/access/apps` |
| HTTP status | **403** |
| Error code | **10000** |
| Body | `Authentication error` |
| Blocker type | **credentials / permissions** |
| Cause | Neither `CLOUDFLARE_API_TOKEN` (`.env.cf`) nor Wrangler OAuth token includes Zero Trust Access scopes |

**Owner action (Dashboard):**

1. Zero Trust → Access → Applications → Add self-hosted app `admin.aistroyka.ai`
2. Policy: Allow platform operator emails only
3. **Require MFA** (TOTP/WebAuthn)
4. No bypass rules

### API token writes (earlier attempts — superseded for Worker by OAuth)

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

1. **Cloudflare Access** on `admin.aistroyka.ai` (Dashboard — see §4)
2. Confirm Access challenge: `curl -sI https://admin.aistroyka.ai/` → redirect to Cloudflare Access
3. Operator MFA enrollment test

## 7. Phase 2 readiness

After Access is live:

- Verify admin health + Access gate
- Deploy host-profile middleware to production (branch merge)
- Begin Phase 3 host enforcement (`OWNER_ALLOWED_HOSTS`, redirects)

---

## 8. Verdicts

| Verdict | Value |
|---------|-------|
| `ADMIN_DOMAIN_PHASE1_COMPLETE` | **NO** — Access not configured |
| `READY_FOR_PHASE2_HOST_ROUTING` | **PARTIAL** — Worker/DNS/TLS live; Access pending |
| `PRODUCTION_HEALTH` | **HEALTHY** |
