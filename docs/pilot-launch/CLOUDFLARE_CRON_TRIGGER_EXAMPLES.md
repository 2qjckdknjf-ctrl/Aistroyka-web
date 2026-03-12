# Cloudflare cron trigger examples

**Goal:** Call `POST https://YOUR_APP/api/v1/admin/jobs/cron-tick` with header `x-cron-secret: YOUR_CRON_SECRET` every 5–15 minutes.

---

## Option 1: Separate scheduled Worker (recommended)

Cloudflare Cron Triggers send a **GET** request to the worker and **cannot** add custom headers. So use a **second Worker** that only runs on a schedule and POSTs to your main app with the secret.

### 1. Create a new Worker (e.g. `aistroyka-cron-caller`)

**Worker code (paste as-is; replace URL and use env for secret):**

```javascript
export default {
  async scheduled(event, env, ctx) {
    const url = env.CRON_TICK_URL || "https://aistroyka.ai/api/v1/admin/jobs/cron-tick";
    const secret = env.CRON_SECRET;
    if (!secret) {
      console.error("CRON_SECRET not set");
      return;
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-cron-secret": secret },
    });
    if (!res.ok) {
      console.error("Cron tick failed", res.status, await res.text());
    }
  },
};
```

### 2. Bind secrets (Dashboard or wrangler)

- **CRON_SECRET** — same value as in your main app worker (Encrypted).
- **CRON_TICK_URL** (optional) — e.g. `https://aistroyka.ai/api/v1/admin/jobs/cron-tick`. If not set, code uses default above.

### 3. Add Cron Trigger

- Workers & Pages → aistroyka-cron-caller → Settings → Triggers → Cron Triggers.
- Add: **Cron expression** `*/5 * * * *` (every 5 minutes).
- Save.

### 4. Deploy the Worker

Deploy so the trigger is active.

---

## Option 2: wrangler.toml for cron Worker

If you manage Workers via repo, create a second worker:

```toml
# wrangler-cron.toml (or add to existing)
name = "aistroyka-cron-caller"
main = "cron-worker.js"
compatibility_date = "2024-01-01"

[vars]
CRON_TICK_URL = "https://aistroyka.ai/api/v1/admin/jobs/cron-tick"

# Set CRON_SECRET in Dashboard as Encrypted secret

[triggers]
crons = ["*/5 * * * *"]
```

`cron-worker.js` (minimal):

```javascript
export default {
  async scheduled(event, env, ctx) {
    const url = env.CRON_TICK_URL || "https://aistroyka.ai/api/v1/admin/jobs/cron-tick";
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-cron-secret": env.CRON_SECRET || "" },
    });
    if (!res.ok) console.error("Cron tick failed", res.status);
  },
};
```

---

## Option 3: External cron (e.g. GitHub Actions, system cron)

**Command to run every 5 minutes:**

```bash
curl -sS -X POST \
  -H "x-cron-secret: ${CRON_SECRET}" \
  "https://aistroyka.ai/api/v1/admin/jobs/cron-tick"
```

Store CRON_SECRET in GitHub Secrets or env; do not log it.

---

## Verification

```bash
curl -sS -X POST -H "x-cron-secret: YOUR_CRON_SECRET" "https://YOUR_APP/api/v1/admin/jobs/cron-tick"
```

Expected: HTTP 200, body like `{"ok":true,"scheduled":N,"processed":N,"tenants":N}`.
