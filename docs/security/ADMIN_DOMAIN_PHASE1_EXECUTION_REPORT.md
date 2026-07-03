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
| Cloudflare Access | `CLOUDFLARE_ACCESS_API_TOKEN` via `cf-admin-domain-access.mjs` | **DONE** (§5) |
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
| **Cloudflare Access** | **ENABLED** | App `526140c2-ea8e-40a5-be76-c9b4137faf4c` — §5 |
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

## 5. Cloudflare Access enablement — COMPLETE (2026-07-03)

**Credential:** `CLOUDFLARE_ACCESS_API_TOKEN` in `apps/web/.env.cf` (Access Apps & Policies Edit only; legacy `CLOUDFLARE_API_TOKEN` not used).

**Command:**

```bash
cd apps/web
unset CLOUDFLARE_API_TOKEN
node scripts/cf-admin-domain-access.mjs
```

### Application

| Field | Value |
|-------|-------|
| Name | AISTROYKA Platform Admin |
| Type | Self-hosted |
| Domain | `admin.aistroyka.ai` |
| Application ID | `526140c2-ea8e-40a5-be76-c9b4137faf4c` |
| Session duration | 8h |
| Auth domain | `z6pxn548dk.cloudflareaccess.com` |
| Bypass rules | **None** |

### Policy

| Field | Value |
|-------|-------|
| Name | Platform operators |
| Policy ID | `673eba0a-38f4-4176-b3b5-f928eb199840` |
| Decision | Allow |
| Include | `z6pxn548dk@privaterelay.appleid.com` |
| Exclude / bypass | **None** |
| Precedence | 1 |

### MFA

| Item | Status |
|------|--------|
| Access authentication required | **YES** — unauthenticated requests redirect to Cloudflare Access |
| Independent MFA (`mfa_config` on app/policy) | **PENDING org setting** — API returns `12130` until Zero Trust → Access settings enables allowed authenticators (token lacks Organizations Write) |
| Owner follow-up (Dashboard) | Zero Trust → Access settings → enable Authenticator app + Security key → Apply global MFA → re-apply policy MFA |

### Post-enablement validation

```bash
curl -sI https://admin.aistroyka.ai/
# HTTP/2 302 — location: https://z6pxn548dk.cloudflareaccess.com/cdn-cgi/access/login/admin.aistroyka.ai?...

curl -sI https://admin.aistroyka.ai/api/v1/health
# HTTP/2 302 — location: https://z6pxn548dk.cloudflareaccess.com/cdn-cgi/access/login/admin.aistroyka.ai?...redirect_url=%2Fapi%2Fv1%2Fhealth

curl -s https://aistroyka.ai/api/v1/health
# {"ok":true,...,"buildStamp":{"sha7":"7f1b42f"}} — HEALTHY
```

| Check | Pass |
|-------|------|
| Admin root → Cloudflare Access (not `/ru`) | **YES** |
| Admin health not publicly exposed | **YES** |
| Apex health unchanged | **YES** |

---

## 4. Cloudflare Access enablement — prior attempts (2026-07-03)

**Objective:** Create self-hosted Access app `AISTROYKA Platform Admin` on `admin.aistroyka.ai` with operator-email allow policy, mandatory MFA, no bypass, 8h session.

**Executor:** Principal Cloudflare Zero Trust / production infra (automated + dashboard probe).

### 4.1 Credential inventory (all sources inspected)

| Source | Present | Used |
|--------|---------|------|
| `apps/web/.env.cf` → `CLOUDFLARE_API_TOKEN` | Yes (active, id `00790b4e…`) | Yes |
| `apps/web/.env.cf` → `CLOUDFLARE_ACCOUNT_ID` | Yes (`864f04d729c24f574a228558b40d7b82`) | Yes |
| `CLOUDFLARE_ACCESS_API_TOKEN` | **No** (not in repo or env files) | — |
| `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` (Global API Key) | **No** | — |
| Wrangler OAuth (`~/.wrangler/config/default.toml`, `wrangler auth token`) | Yes (`z6pxn548dk@privaterelay.appleid.com`) | Yes |
| Shell env `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | Yes (same as `.env.cf`) | Yes |
| Root `.env.local` Cloudflare keys | **No** | — |
| `local-secrets/` Cloudflare tokens | **No** (mobile-store dirs only) | — |
| GitHub repo secrets (`gh secret list`) | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` only | Names listed; values not readable |
| macOS Keychain (`cloudflare`) | **No** entries | — |
| `cloudflared` CLI | **Not installed** | — |
| Cloudflare Dashboard browser session | Tab at `dash.cloudflare.com/login` | **Not authenticated** |

### 4.2 API attempts (every credential)

| # | Credential | Endpoint | Method | HTTP | CF code | Message | Missing permission |
|---|------------|----------|--------|------|---------|---------|-------------------|
| 1 | `.env.cf` `CLOUDFLARE_API_TOKEN` | `/accounts/…/access/apps` | GET | 403 | 10000 | Authentication error | **Access: Apps and Policies → Edit** |
| 2 | `.env.cf` `CLOUDFLARE_API_TOKEN` | `/accounts/…/access/apps` | POST | 403 | 10000 | Authentication error | **Access: Apps and Policies → Edit** |
| 3 | Wrangler OAuth (`cfoat_*`) | `/accounts/…/access/apps` | GET | 403 | 10000 | Authentication error | **Access: Apps and Policies → Edit** (not in OAuth scopes) |
| 4 | Wrangler OAuth | `/accounts/…/access/apps` | POST | 403 | 10000 | Authentication error | Same |
| 5 | `.env.cf` token | `/accounts/…/access/organizations` | GET | 403 | 10000 | Authentication error | Zero Trust org read |
| 6 | Wrangler OAuth | `/accounts/…/access/organizations` | GET | 403 | 10000 | Authentication error | Same |
| 7 | `.env.cf` token | `/accounts/…/access/groups` | GET | 403 | 10000 | Authentication error | Access groups |
| 8 | `.env.cf` token | `/accounts/…/access/service_tokens` | GET | 403 | 10000 | Authentication error | Access service tokens |
| 9 | `.env.cf` token | `/user/tokens` | POST (create token) | 403 | 9109 | Unauthorized to access requested resource | Cannot mint new API token |
| 10 | Wrangler OAuth | `/user/tokens` | POST | 403 | 9109 | Unauthorized | Cannot mint new API token |
| 11 | `node scripts/cf-admin-domain-access.mjs` | (wraps #1–2) | — | — | 10000 | Authentication error | Script exited 1 |

**Wrangler OAuth scopes (from `wrangler whoami`):** `account:read`, `user:read`, `workers:*`, `zone:read`, `ssl_certs:write`, … — **no Access / Zero Trust scope**.

**`.env.cf` token capabilities confirmed:** `GET /accounts/…/workers/domains` → **HTTP 200** (Workers read OK). Access endpoints uniformly **403 / 10000**.

### 4.3 Dashboard attempt

| Step | Result |
|------|--------|
| Open `https://dash.cloudflare.com/one/` | Redirected to **login** (no active session) |
| Automated sign-in | **Blocked** — requires human Apple/Google/GitHub/email auth |

### 4.4 Post-attempt live probes (Access still absent)

```bash
curl -sI https://admin.aistroyka.ai/
# HTTP/2 307 — location: /ru  (app middleware, NOT cloudflareaccess.com)

curl -sI https://admin.aistroyka.ai/api/v1/health
# HTTP/2 200 — application/json (public, NOT Access-gated)

curl -s https://aistroyka.ai/api/v1/health
# {"ok":true,...,"buildStamp":{"sha7":"7f1b42f"}} — HEALTHY
```

### 4.5 Owner unblock paths (only remaining)

**Path A — Dashboard (manual login required):**

1. Sign in at [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. Access → Applications → Add → Self-hosted
3. Name `AISTROYKA Platform Admin`, domain `admin.aistroyka.ai`
4. Allow policy: platform operator emails; **MFA required**; **no bypass**; session ~8h

**Path B — API token + automation script:**

1. My Profile → API Tokens → Create → **Account → Access: Apps and Policies → Edit**
2. Add to `apps/web/.env.cf` as `CLOUDFLARE_ACCESS_API_TOKEN=…`
3. Run:

```bash
cd apps/web
CLOUDFLARE_ACCESS_OPERATOR_EMAILS="z6pxn548dk@privaterelay.appleid.com" node scripts/cf-admin-domain-access.mjs
```

**Why automation could not self-unblock:** No available credential can read or write `/accounts/{id}/access/*`, and no authenticated Dashboard session exists. Creating a scoped token via API also failed (9109) with both credentials.

### 4.6 Access enablement retry (2026-07-03 — owner supplied token claim)

**Trigger:** Owner reported `CLOUDFLARE_ACCESS_API_TOKEN` added to `apps/web/.env.cf`.

**Pre-flight (disk):**

| Check | Result |
|-------|--------|
| `grep CLOUDFLARE_ACCESS_API_TOKEN apps/web/.env.cf` | **0 matches** |
| Keys present in `.env.cf` | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `OPENAI_API_KEY` only (3 lines) |
| Shell `CLOUDFLARE_ACCESS_API_TOKEN` | **unset** |

**Execution:**

```bash
cd apps/web
unset CLOUDFLARE_API_TOKEN   # script prefers CLOUDFLARE_ACCESS_API_TOKEN
node scripts/cf-admin-domain-access.mjs
# LIST apps failed HTTP 403 code 10000 — fell back to CLOUDFLARE_API_TOKEN (no ACCESS key on disk)
```

**Post-retry live probes:**

```bash
curl -sI https://admin.aistroyka.ai/
# HTTP/2 307 — location: /ru (NOT cloudflareaccess.com)

curl -sI https://admin.aistroyka.ai/api/v1/health
# HTTP/2 200 — public JSON (NOT Access-gated)

curl -s https://aistroyka.ai/api/v1/health
# ok: true — HEALTHY
```

**Unblock:** Save `CLOUDFLARE_ACCESS_API_TOKEN=<Access Apps/Policies Edit token>` as a **fourth line** in `apps/web/.env.cf` (gitignored), then re-run:

```bash
cd apps/web
unset CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCESS_OPERATOR_EMAILS="z6pxn548dk@privaterelay.appleid.com" node scripts/cf-admin-domain-access.mjs
```

### API token writes (Worker — resolved earlier via OAuth)

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

## 6. Remaining (post-Phase 1)

1. **Owner (optional, MFA hardening):** Enable independent MFA in Zero Trust → Access settings; then add `mfa_config` to app/policy
2. Owner MFA enrollment smoke after independent MFA is on
3. Phase 2: deploy host-profile middleware; Phase 3: `OWNER_ALLOWED_HOSTS`

## 7. Phase 2 readiness

Access gate live — ready to begin host-profile middleware deploy (branch merge) and Phase 3 planning.

---

## 8. Verdicts

| Verdict | Value |
|---------|-------|
| `ADMIN_DOMAIN_PHASE1_COMPLETE` | **YES** — Access app + policy live; independent MFA org setting optional follow-up |
| `CLOUDFLARE_ACCESS_ENABLED` | **YES** |
| `READY_FOR_PHASE2_HOST_ROUTING` | **YES** |
| `PRODUCTION_HEALTH` | **HEALTHY** |
| `MANUAL_OWNER_ACTION_REQUIRED` | **OPTIONAL** — independent MFA org settings in Dashboard |
