# AISTROYKA.com → AISTROYKA.ai Cloudflare Redirect Report

**Date:** 2026-06-04  
**Operator scope:** Cloudflare DNS + redirect for `aistroyka.com` / `www.aistroyka.com` only. No changes to `aistroyka.ai`, Supabase, auth, app routes, or mobile.

---

## 1. Final status

**PARTIAL**

| Layer | Status |
|-------|--------|
| Zone `aistroyka.com` in Cloudflare | **Active** |
| Worker redirect + routes | **Deployed** |
| DNS proxied through Cloudflare | **Not done** (blocker) |
| Live 301 redirect validation | **Not passing** |

Redirect cannot take effect until apex and `www` DNS records are **Proxied** (orange cloud). Today traffic bypasses Cloudflare and hits a legacy Vercel origin (`216.198.79.1`) with an **expired TLS certificate**.

---

## 2. Domain policy

| Host | Role |
|------|------|
| `aistroyka.ai` | **Primary canonical production app domain** (unchanged) |
| `www.aistroyka.ai` | **Production app** (unchanged) |
| `aistroyka.com` | **Redirect-only entry domain** → `https://aistroyka.ai` |
| `www.aistroyka.com` | **Redirect-only entry domain** → `https://aistroyka.ai` |

No duplicate production app on `.com`. No redirect from `.ai` to `.com`.

---

## 3. Stage A — Access and zone discovery

### A1. Local access check

| Check | Result |
|-------|--------|
| `wrangler` on PATH | Not installed globally; **npx wrangler@4** works from `apps/web` |
| `wrangler whoami` | OAuth logged in (account `864f04d7...7b82`) |
| `CLOUDFLARE_API_TOKEN` | **unset** |
| `CLOUDFLARE_ACCOUNT_ID` | **unset** |
| `CLOUDFLARE_ZONE_ID_AISTROYKA_COM` | **unset** |
| `CF_API_TOKEN` / `CF_ACCOUNT_ID` | **unset** |

OAuth token permissions include `zone:read`, `workers:write`, `workers_routes:write` but **not** DNS read/write or Single Redirect / Rulesets write.

### A2. Zone `aistroyka.com`

| Field | Value |
|-------|-------|
| Zone name | `aistroyka.com` |
| Zone ID (masked) | `8168...275e` |
| Status | **active** |
| Plan | Free Website |
| Nameservers | `carter.ns.cloudflare.com`, `vivienne.ns.cloudflare.com` |

Zone is already on Cloudflare; **no registrar nameserver change required**.

### A3. Zone `aistroyka.ai` (read-only sanity check)

| Field | Value |
|-------|-------|
| Nameservers | Same Cloudflare pair |
| Public A records | `104.21.45.103`, `172.67.213.36` (proxied Cloudflare anycast) |
| Live `curl -I https://aistroyka.ai` | **307 → `/ru`**, `server: cloudflare` — production intact |

**No DNS or route changes were made on `aistroyka.ai`.**

---

## 4. Stage B — DNS readiness (public + API)

OAuth token **cannot read or write** zone DNS via API (`403 Authentication error`). Public DNS inspection:

| Hostname | Record observed | Proxy inference |
|----------|-----------------|-----------------|
| `aistroyka.com` | A → `216.198.79.1` | **DNS-only** (Vercel origin; not Cloudflare anycast) |
| `www.aistroyka.com` | **No record** | NXDOMAIN / unresolved |

Live HTTP behavior confirms bypass:

- `http://aistroyka.com` → **308** to `https://aistroyka.com/`, `server: Vercel`
- `https://aistroyka.com` → TLS fails: **certificate expired** on `216.198.79.1`

### Required DNS (operator — Cloudflare Dashboard)

**Do not point `.com` at the production Worker.** Redirect-only; proxied records with no real origin required.

1. **Cloudflare Dashboard** → zone **`aistroyka.com`** → **DNS** → **Records**
2. **Apex `@`**
   - If an A record exists pointing at Vercel (`216.198.79.x` or similar): edit it.
   - **Type:** A  
   - **Name:** `@`  
   - **Content:** `192.0.2.1` (placeholder; ignored when proxied)  
   - **Proxy status:** **Proxied** (orange cloud)  
3. **`www`**
   - **Type:** CNAME  
   - **Name:** `www`  
   - **Target:** `aistroyka.com`  
   - **Proxy status:** **Proxied**
4. Remove or disable any legacy **Vercel** DNS targets for this zone if still present.
5. Wait for DNS propagation (usually minutes).

**Verification after DNS change:**

```bash
dig +short aistroyka.com A
dig +short www.aistroyka.com A
```

Expect Cloudflare anycast IPs (e.g. `104.x.x.x`, `172.x.x.x`), not `216.198.79.1`.

---

## 5. Stage C / F — Redirect implementation

### Preferred: Single Redirect (Redirect Rules)

Not applied via API — OAuth lacks **Dynamic URL Redirects Write** / **Single Redirect Edit**.

When a scoped API token is available, run:

```bash
export CLOUDFLARE_API_TOKEN='***'   # Zone DNS + Single Redirect Edit
bash scripts/ops/configure-aistroyka-com-redirect-rules.sh
```

Equivalent Dashboard rule:

| Setting | Value |
|---------|-------|
| **Name** | Redirect aistroyka.com to aistroyka.ai |
| **If** | `(http.host eq "aistroyka.com" or http.host eq "www.aistroyka.com")` |
| **Then** | Dynamic redirect |
| **Target** | `concat("https://aistroyka.ai", http.request.uri.path)` |
| **Preserve query string** | On |
| **Status** | **301** |

### Fallback applied: Cloudflare Worker

Redirect Rules API was unavailable with current credentials. A minimal redirect Worker was deployed instead.

| Object | Value |
|--------|-------|
| Worker name | `aistroyka-com-redirect` |
| Source | `apps/cloudflare-com-redirect/worker.js` |
| Config | `apps/cloudflare-com-redirect/wrangler.toml` |
| Version ID | `b78f8577-6b41-4b5d-868e-e8aeb77b4929` |

**Routes attached (zone `aistroyka.com` only):**

| Pattern | Script |
|---------|--------|
| `aistroyka.com` | `aistroyka-com-redirect` |
| `aistroyka.com/*` | `aistroyka-com-redirect` |
| `www.aistroyka.com` | `aistroyka-com-redirect` |
| `www.aistroyka.com/*` | `aistroyka-com-redirect` |

**Not attached to:** `aistroyka.ai`, `www.aistroyka.ai`.

Worker logic (301, path + query preserved):

```javascript
const url = new URL(request.url);
url.hostname = "aistroyka.ai";
url.protocol = "https:";
return Response.redirect(url.toString(), 301);
```

After DNS is proxied, this Worker should satisfy requirements without app code changes. Optionally replace with Single Redirect later and delete the Worker routes.

---

## 6. Stage G — Validation evidence

### Primary domain (must not redirect to .com)

```text
$ curl -I https://aistroyka.ai
HTTP/2 307
location: /ru
server: cloudflare
```

```text
$ curl -I https://www.aistroyka.ai
HTTP/2 307
location: /ru
server: cloudflare
```

**Pass:** `.ai` serves the app via Cloudflare; no redirect to `.com`.

### Redirect domains (before DNS fix — **FAIL**)

```text
$ curl -I http://aistroyka.com
HTTP/1.0 308 Permanent Redirect
Location: https://aistroyka.com/
server: Vercel
```

```text
$ curl -I https://aistroyka.com
(curl: SSL certificate problem: certificate has expired)
```

```text
$ curl -I http://www.aistroyka.com
(could not resolve host)
```

```text
$ curl -I https://www.aistroyka.com
(could not resolve host)
```

```text
$ curl -I "https://aistroyka.com/pricing?x=1"
(TLS failure — traffic never reaches Cloudflare Worker)
```

### Expected after DNS proxied (re-run these)

```bash
curl -I http://aistroyka.com
curl -I https://aistroyka.com
curl -I http://www.aistroyka.com
curl -I https://www.aistroyka.com
curl -I "https://aistroyka.com/pricing?x=1"
curl -I "https://www.aistroyka.com/contact?source=test"
curl -IL "https://aistroyka.com/pricing?x=1"
```

**Expected:**

| Request | Status | Location |
|---------|--------|----------|
| `http://aistroyka.com` | 301 | `https://aistroyka.ai/` |
| `https://aistroyka.com` | 301 | `https://aistroyka.ai/` |
| `http://www.aistroyka.com` | 301 | `https://aistroyka.ai/` |
| `https://www.aistroyka.com` | 301 | `https://aistroyka.ai/` |
| `https://aistroyka.com/pricing?x=1` | 301 | `https://aistroyka.ai/pricing?x=1` |
| `https://www.aistroyka.com/contact?source=test` | 301 | `https://aistroyka.ai/contact?source=test` |

---

## 7. Remaining manual actions

1. **DNS (required):** Proxied `@` A + proxied `www` CNAME in zone `aistroyka.com` (Section 4).
2. **Re-validate:** Run curl commands above; status cannot become **CLOSED** until all return **301** to `https://aistroyka.ai/...`.
3. **Optional — detach Vercel:** Remove `aistroyka.com` from Vercel project domains to avoid stale origin/cert noise.
4. **Optional — Single Redirect:** With API token, run `scripts/ops/configure-aistroyka-com-redirect-rules.sh` and remove Worker routes if you prefer Dashboard Redirect Rules over Worker.
5. **Optional — API token for CI:** Store `CLOUDFLARE_ZONE_ID_AISTROYKA_COM` (`8168...275e`) if automating future `.com` zone ops.

---

## 8. Safety notes

- **No** Supabase, database, auth, mobile, or product route changes.
- **No** `aistroyka.ai` DNS or Worker route changes.
- **No** secrets committed.
- **No** redirect loop detected on `.ai`.
- Worker fallback used because OAuth token cannot manage Single Redirect rulesets or DNS via API.
- Redirect Worker is isolated under `apps/cloudflare-com-redirect/` (infra only).

---

## 9. Files added

| File | Purpose |
|------|---------|
| `apps/cloudflare-com-redirect/worker.js` | 301 redirect Worker |
| `apps/cloudflare-com-redirect/wrangler.toml` | Worker routes on `.com` zone only |
| `scripts/ops/configure-aistroyka-com-redirect-rules.sh` | Single Redirect via API when token available |
| `docs/ops/AISTROYKA_COM_REDIRECT_CLOUDFLARE_REPORT.md` | This report |

---

## 10. Cloudflare objects changed

| Type | Action |
|------|--------|
| Worker `aistroyka-com-redirect` | **Created / deployed** |
| Route `aistroyka.com` | **Created** |
| Route `aistroyka.com/*` | **Created** |
| Route `www.aistroyka.com` | **Created** |
| Route `www.aistroyka.com/*` | **Created** |
| DNS records | **Not changed** (no API permission) |
| Single Redirect ruleset | **Not created** (no API permission) |

---

**Verdict:** Infrastructure for redirect is in place; **DNS proxied status is the blocking step.** Re-run validation after Section 4 DNS changes to close this task.
