# DNS and domain ownership (Phase 3)

**Date:** 2026-03-05  
**Purpose:** Cloudflare owns PROD (aistroyka.ai, www); canonical = apex; www → 301; no Vercel on apex/www.

---

## 1. Policy

- **Canonical domain:** `aistroyka.ai` (apex).
- **www:** Must 301-redirect to `https://aistroyka.ai` (no redirect loops).
- **Owner of apex and www:** Cloudflare only. Vercel must not have aistroyka.ai or www.aistroyka.ai on any project.
- **STAGING:** `staging.aistroyka.ai` → staging Worker (Phase 4).

---

## 2. Before/after (template)

### BEFORE STATE (snapshot)

Capture before changes: run from repo root (with `CLOUDFLARE_API_TOKEN` set):

```bash
node apps/web/scripts/cf-dns-list-aistroyka.mjs
```

Or in Cloudflare Dashboard → **aistroyka.ai** → **DNS** → export/screenshot. Paste below:

| Type  | Name   | Content        | Proxy | TTL |
|-------|--------|----------------|-------|-----|
| (fill from script or Dashboard) | | | | |

**Target state:**

| Type  | Name   | Content        | Proxy | TTL | Notes |
|-------|--------|----------------|-------|-----|--------|
| A     | @      | 192.0.2.1      | Yes   | 1   | Placeholder; Workers custom domain overrides. Or use CNAME flattening to Worker if supported. |
| CNAME | www    | aistroyka.ai   | Yes   | 1   | Then Redirect Rule: www → apex 301. |

**Rollback:** Restore previous records from your “before” snapshot. Remove Redirect Rule if added.

### Custom domains + Redirect Rule (Dashboard; no plugin API)

- **Production Worker (aistroyka-web-production):** Workers & Pages → Worker → Settings → Domains → add `aistroyka.ai` and `www.aistroyka.ai`.
- **Staging Worker (aistroyka-web-staging):** add `staging.aistroyka.ai`.
- **Redirect Rule:** Zone aistroyka.ai → Rules → Redirect Rules → create: When hostname equals `www.aistroyka.ai` → Dynamic redirect to `https://aistroyka.ai` + `http.request.uri.path` (301).
- **Validation:** `curl -I https://www.aistroyka.ai` → single 301 to `https://aistroyka.ai/`; `curl -I https://aistroyka.ai` → 200 (no loop).

---

## 3. Vercel

- In **Vercel Dashboard** → each project → **Settings** → **Domains**: if `aistroyka.ai` or `www.aistroyka.ai` is listed, **remove** them so Vercel does not manage or verify apex/www.
- Allowed: other hostnames (e.g. `marketing.aistroyka.ai`, preview URLs) if needed.

---

## 4. Cloudflare DNS (script)

Repo script: `apps/web/scripts/cf-dns-setup-aistroyka.mjs`.

- Requires: `CLOUDFLARE_API_TOKEN` (Zone:Read, Zone:Edit).
- Creates if missing: **A @** → 192.0.2.1 (proxied), **CNAME www** → aistroyka.ai (proxied). Optional: **CNAME staging** if `STAGING_CNAME_TARGET` is set.
- Run from repo root: `CLOUDFLARE_API_TOKEN=xxx node apps/web/scripts/cf-dns-setup-aistroyka.mjs`.
- **Does not** create the www → apex redirect; that is done in Dashboard (Redirect Rules).

---

## 5. Cloudflare Redirect Rule (www → canonical)

- **Dashboard:** aistroyka.ai → **Rules** → **Redirect Rules** → Create.
- **Name:** e.g. “www to apex”.
- **When:** Hostname equals `www.aistroyka.ai`.
- **Then:** Dynamic redirect, expression e.g. `concat("https://aistroyka.ai", http.request.uri.path)` (or static `https://aistroyka.ai`), status 301.
- **Order:** Above any catch-all so www is always redirected.

Avoid: redirecting apex to www (we use apex as canonical). Check for loops: open https://www.aistroyka.ai → must get single 301 to https://aistroyka.ai.

---

## 6. SSL/TLS

- **Dashboard:** SSL/TLS → Overview: **Full (strict)** if origin presents a valid cert; otherwise Full. Ensure no redirect loops (e.g. Flexible + app redirecting to HTTPS can loop).

---

## 7. Staging DNS

- **staging.aistroyka.ai:** CNAME `staging` → target of staging Worker (or Worker custom hostname). Script creates it if `STAGING_CNAME_TARGET` is set; otherwise add **Custom domain** in Worker **aistroyka-web-staging** in Dashboard.

---

## 8. No secrets

This report documents structure and procedure only. No API tokens or secrets. “Before” table to be filled from Dashboard at change time; “after” is target state.
