# Cloudflare deploy checklist (wrangler 7003 / env.production)

Use this to confirm the deploy target matches your Cloudflare account and Workers.

- [ ] **Workers & Pages → Overview** — Note your **Account ID** (right sidebar / Account details). It must match the value in GitHub Actions secret `CLOUDFLARE_ACCOUNT_ID`.
- [ ] **Workers & Pages → Workers** — Check whether **aistroyka-web-production** exists (or will be created on first deploy). If you use a different name, align `[env.production] name` in `wrangler.toml`.
- [ ] **API token** — GitHub secret `CLOUDFLARE_API_TOKEN` must have **Workers Scripts** edit permission and be valid (not revoked).
- [ ] **Routes** — For production, `aistroyka.ai` and `www.aistroyka.ai` are set in `wrangler.toml` under `[env.production]`. Ensure the zone **aistroyka.ai** is on this account; if another Worker has the route, remove it there or deploy will fail with “assigned to another worker”.

`account_id` is not in `wrangler.toml`; CI passes `CLOUDFLARE_ACCOUNT_ID` so wrangler uses it at deploy time.
