# Routes — manual setup in Cloudflare Dashboard

CI deploy does not set zone routes (avoids Workers Routes permission on the API token). Add routes once in the Dashboard after the Worker is deployed.

---

## Steps

1. Open **Cloudflare Dashboard**: https://dash.cloudflare.com  
2. Select the account that owns the Worker (Account ID in `wrangler.toml`).  
3. Go to **Workers & Pages** → **Workers**.  
4. Click **aistroyka-web-production**.  
5. Open **Triggers** → **Routes**.  
6. Click **Add route** and add:

   | Route           | Zone        |
   |-----------------|-------------|
   | `aistroyka.ai/*`   | aistroyka.ai |
   | `www.aistroyka.ai/*` | aistroyka.ai |

7. Save. The zone **aistroyka.ai** must be on this Cloudflare account.

---

## Verify

- **Dashboard:** Triggers → Routes shows both routes for **aistroyka-web-production**.  
- **Browser:** https://aistroyka.ai and https://www.aistroyka.ai load the app (hard refresh: Cmd+Shift+R / Ctrl+Shift+R).
