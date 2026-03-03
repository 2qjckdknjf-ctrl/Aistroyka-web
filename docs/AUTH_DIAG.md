# Auth diagnostics endpoint

**Endpoint:** `GET /api/auth/diag`

Returns JSON with safe, non-sensitive auth/config info for troubleshooting production login (Cloudflare Worker + Supabase Auth). No secrets are printed; the anon key is masked (first 6 + last 4 characters).

---

## Response fields

| Field | Description |
|-------|-------------|
| **appUrl** | `NEXT_PUBLIC_APP_URL` (e.g. `https://aistroyka.ai`) or null |
| **supabaseUrlHost** | Hostname of `NEXT_PUBLIC_SUPABASE_URL` or null |
| **anonKeyPresent** | `true` if anon key is set |
| **anonKeyMasked** | Masked key (e.g. `eyJhbG...3842`) or null |
| **requestHost** | `Host` header of the request |
| **requestOrigin** | `Origin` header or null |
| **envName** | `VERCEL_ENV` or `NODE_ENV` if set |
| **timestamp** | ISO timestamp of the response |

---

## How to use

1. **Production:**  
   `curl -s https://aistroyka.ai/api/auth/diag`  
   Or open in browser: https://aistroyka.ai/api/auth/diag

2. **Check Supabase config:**  
   - `anonKeyPresent: true` and `supabaseUrlHost` set → env vars are reaching the Worker.  
   - `anonKeyPresent: false` or `supabaseUrlHost: null` → set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Cloudflare Worker Variables.

3. **Check app URL for redirects:**  
   - `appUrl` should be `https://aistroyka.ai` in production.  
   - If null, set `NEXT_PUBLIC_APP_URL` in Cloudflare Worker Variables.

4. **Compare with request:**  
   - `requestHost` should match the domain you’re using (e.g. `aistroyka.ai`).  
   - If you’re on aistroyka.ai but `requestHost` is wrong, routing or host headers may be misconfigured.

---

## Security

- No secret values are returned.  
- Only masked anon key (first 6 + last 4) and hostnames/URLs are included.
