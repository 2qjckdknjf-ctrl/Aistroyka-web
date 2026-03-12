# Cloudflare Cron Triggers setup

Use this to call cron-tick on a schedule from Cloudflare Workers.

## 1. Create a Cron Trigger

1. Cloudflare Dashboard → Workers & Pages → your worker (e.g. aistroyka-web-production).
2. **Settings** → **Triggers** → **Cron Triggers**.
3. Add trigger: e.g. **Every 5 minutes** → `*/5 * * * *` (cron expression).
4. The trigger will send a request to your worker. You must **route the request** to your cron-tick handler and add the secret header.

## 2. Sending the secret

Cron Triggers send a **GET** request by default to the worker. Your app expects **POST** to `/api/v1/admin/jobs/cron-tick` with header **x-cron-secret**.

**Option A — Worker binding with secret:**  
In wrangler.toml or Dashboard → Settings → Variables, set:

- `CRON_SECRET` = (generate a long random string)
- `REQUIRE_CRON_SECRET` = true

Cloudflare Cron does not support custom headers. So you have two approaches:

**Option B — Use a scheduled Worker that POSTs:**  
Create a separate Worker that runs on a schedule (Cron Trigger) and that Worker makes a **fetch** to your main app:

```js
// In the scheduled Worker
export default {
  async scheduled(event, env, ctx) {
    const res = await fetch("https://your-app.com/api/v1/admin/jobs/cron-tick", {
      method: "POST",
      headers: { "x-cron-secret": env.CRON_SECRET },
    });
    if (!res.ok) console.error("Cron tick failed", res.status);
  },
}
```

Bind **CRON_SECRET** (secret) in that Worker. Schedule it with Cron Trigger `*/5 * * * *`.

**Option C — Same worker, cron route:**  
If your Next.js/OpenNext worker can handle a specific path for cron (e.g. from Cloudflare’s cron request), add a route that accepts the cron trigger request and forwards to cron-tick with the secret. This requires the worker to read the secret from env and call the same handler logic. Implementation is app-specific.

## 3. Recommended

Use **Option B**: a small scheduled Worker that POSTs to your app’s cron-tick URL with `x-cron-secret`. Keep CRON_SECRET in Cloudflare secrets. Schedule every 5–15 minutes.

## 4. Verify

After deploy:

```bash
curl -X POST -H "x-cron-secret: YOUR_CRON_SECRET" "https://your-app.com/api/v1/admin/jobs/cron-tick"
```

Expect **200** and `{"ok":true,"scheduled":...,"processed":...,"tenants":...}`.
