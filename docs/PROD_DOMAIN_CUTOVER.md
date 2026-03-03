# Production domain cutover — aistroyka.ai

Manual steps to point **aistroyka.ai** and **www.aistroyka.ai** at the Cloudflare Worker **aistroyka-web-production** after a successful workers.dev deploy.

---

## Prerequisites

- Worker **aistroyka-web-production** is deployed (CI or `npx wrangler deploy --env production`).
- Domain **aistroyka.ai** is added to the same Cloudflare account (Account ID in `wrangler.toml`).
- You have access to **Cloudflare Dashboard** for this account.

---

## 1. Where to add routes (Cloudflare UI)

Routes are defined in **wrangler.toml** and applied on deploy. If you need to add or change them in the UI:

1. Open **Cloudflare Dashboard** → **Workers & Pages**.
2. Click **aistroyka-web-production**.
3. Go to **Settings** → **Triggers** → **Routes**.
4. You should see (after a deploy that includes routes):
   - `aistroyka.ai/*`
   - `www.aistroyka.ai/*`
   (and optionally apex `aistroyka.ai`, `www.aistroyka.ai` if your wrangler config includes them.)

If routes are missing after deploy, add them manually:

- **Route:** `aistroyka.ai/*` → **Zone:** aistroyka.ai  
- **Route:** `www.aistroyka.ai/*` → **Zone:** aistroyka.ai  

**Worker:** aistroyka-web-production.

If another Worker or Page has these routes, remove them from that resource first to avoid “route already assigned” errors.

---

## 2. DNS records needed

The zone **aistroyka.ai** must be in this Cloudflare account so Workers routes can be attached.

- **Apex (aistroyka.ai):**  
  - Either: **Proxy (orange cloud)** A/AAAA to Cloudflare IPs (e.g. 192.0.2.1 or CNAME to the zone’s proxy target), **or**  
  - Use a **Worker route** only (no A record) and rely on the Worker for apex (Next.js/OpenNext handles the app).
- **www (www.aistroyka.ai):**  
  - CNAME to `aistroyka.ai` (or to the same target as apex), **Proxy (orange cloud) on**, **or**  
  - A/AAAA proxied; Worker route `www.aistroyka.ai/*` sends traffic to the Worker.

**Suggested minimum (in Cloudflare DNS for aistroyka.ai):**

| Type  | Name | Content        | Proxy |
|-------|------|----------------|-------|
| A     | @    | 192.0.2.1      | Proxied (orange) |
| CNAME | www  | aistroyka.ai   | Proxied (orange) |

(Replace 192.0.2.1 with your preferred proxy target; Cloudflare often shows a “proxy only” CNAME target for the zone. The important part is that the zone is proxied so traffic hits Cloudflare and then the Worker routes.)

---

## 3. Nameservers check

1. **Cloudflare Dashboard** → **Websites** → **aistroyka.ai** → **DNS** → **Records**.
2. Ensure the zone is **Active** and not “Pending nameservers”.
3. At your domain registrar (where aistroyka.ai is registered), confirm **Nameservers** are set to the two (or five) nameservers shown in Cloudflare for aistroyka.ai (e.g. `xxx.ns.cloudflare.com` and `yyy.ns.cloudflare.com`).
4. Wait for DNS propagation (minutes to 48 hours). Check with:
   ```bash
   dig NS aistroyka.ai
   ```
   The NS records should list Cloudflare’s nameservers.

---

## 4. How to verify

### 4.1 curl (health / response)

```bash
# Apex
curl -sI https://aistroyka.ai/

# www
curl -sI https://www.aistroyka.ai/
```

Expect **200** (or 304) and no certificate errors. If you have a health route (e.g. `/api/health`):

```bash
curl -s https://aistroyka.ai/api/health
```

### 4.2 Browser

1. Open **https://aistroyka.ai** and **https://www.aistroyka.ai**.
2. Hard refresh to avoid cache: **Cmd+Shift+R** (macOS) or **Ctrl+Shift+R** (Windows/Linux).
3. Confirm the app loads and no mixed-content or SSL errors.
4. Check the padlock and certificate (issued for aistroyka.ai / www.aistroyka.ai).

### 4.3 Workers & Pages

- **Workers & Pages** → **aistroyka-web-production** → **Deployments**: latest deployment is **Active**.
- **Triggers** → **Routes**: `aistroyka.ai/*` and `www.aistroyka.ai/*` (and apex if configured) point to this Worker.

---

## Summary checklist

- [ ] Zone **aistroyka.ai** is on the same Cloudflare account as the Worker.
- [ ] Nameservers at registrar point to Cloudflare.
- [ ] DNS: apex and www proxied (orange cloud) as needed.
- [ ] Routes on **aistroyka-web-production**: `aistroyka.ai/*`, `www.aistroyka.ai/*` (and apex/www apex if in wrangler).
- [ ] No other Worker/Page using the same routes.
- [ ] `curl -sI https://aistroyka.ai/` and `https://www.aistroyka.ai/` return 200.
- [ ] Browser hard refresh shows the app and valid SSL.
