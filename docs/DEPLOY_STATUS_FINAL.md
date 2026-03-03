# Deploy pipeline — final status and troubleshooting

Production-ready Cloudflare Workers deploy via OpenNext. Routes are managed in the Dashboard; CI does not require zone route permissions.

---

## Current workflow names

| Workflow file | Trigger | Worker name |
|---------------|---------|-------------|
| **Deploy Cloudflare (Production)** | push to `main` | aistroyka-web-production |
| **Deploy Cloudflare (Staging)** | push to `develop` | aistroyka-web-staging |

Step order (both): checkout → Setup Node → Setup Bun → Verify bun → npm ci --legacy-peer-deps → npm run cf:build → wrangler deploy → Post-deploy summary.

---

## wrangler.toml env strategy

| Section | name | workers_dev | preview_urls | Routes |
|---------|------|-------------|--------------|--------|
| (base) | aistroyka-web | — | — | — |
| **[env.production]** | aistroyka-web-production | false | false | Commented out; add in Dashboard |
| **[env.staging]** | aistroyka-web-staging | true | — | None in file |

- **account_id** set in wrangler.toml (no secret in repo).
- **Assets:** `.open-next/assets` binding `ASSETS` for both envs.
- **Services:** `WORKER_SELF_REFERENCE` to the same worker name per env.

---

## Manual routes note

CI does **not** manage routes. Add in Cloudflare Dashboard:

**Workers & Pages** → **Workers** → **aistroyka-web-production** → **Triggers** → **Routes**:

- `aistroyka.ai/*` (Zone: aistroyka.ai)
- `www.aistroyka.ai/*` (Zone: aistroyka.ai)

See **docs/ROUTES_MANUAL_SETUP.md** and **docs/DEPLOY_VERIFY.md**.

---

## Secrets required (names only)

Configure in **GitHub** → **Settings** → **Secrets and variables** → **Actions**:

| Secret name | Purpose |
|-------------|---------|
| **CLOUDFLARE_API_TOKEN** | Wrangler auth; Workers Scripts edit. No Workers Routes permission needed. |
| **CLOUDFLARE_ACCOUNT_ID** | Cloudflare account ID (also in wrangler.toml). |

Do not print or store these in logs or docs.

---

## Troubleshooting: historical failure classes

### (a) Bun missing

**Symptom:** `/bin/sh: 1: bun: not found` during `npm run cf:build` (OpenNext calls `bun run build`).

**Fix:** Workflows include **Setup Bun** (`oven-sh/setup-bun@v1`, `bun-version: "latest"`) and **Verify bun** before install/build. If a new workflow is added, include these steps before `npm ci` and `cf:build`.

---

### (b) npm ci lock mismatch

**Symptom:** `npm ci` fails (e.g. "lockfile doesn't match package.json" or dependency resolution errors).

**Fix:**

1. Locally (repo root): `rm -rf node_modules && npm install --legacy-peer-deps`.
2. Confirm `npm ci --legacy-peer-deps` passes locally.
3. Commit only **package-lock.json** and push. CI uses `package-lock.json` at repo root; ensure no drift between branches.

---

### (c) Cloudflare route permissions (7003 / object identifier invalid)

**Symptom:** Wrangler error 7003 or "perhaps your object identifier is invalid" when deploying or when routes were in wrangler.toml.

**Fix:**

1. **Routes:** Routes are commented out in wrangler.toml. Add them manually in Dashboard (see **Manual routes note** above). The API token does not need Workers Routes or zone permissions.
2. **Account ID:** Must match the Cloudflare account that owns the Worker. Set in wrangler.toml and (for consistency) in GitHub secret **CLOUDFLARE_ACCOUNT_ID**.
3. **Token:** Same account as account_id; **Workers Scripts: Edit** is sufficient. Regenerate token if revoked or expired.

---

## Related docs

- **docs/DEPLOY_VERIFY.md** — How to verify deploy, workers.dev URL, production domain, hard refresh.
- **docs/ROUTES_MANUAL_SETUP.md** — Exact steps to add routes in Cloudflare UI.
- **docs/PROD_DOMAIN_CUTOVER.md** — DNS, nameservers, and production domain cutover.
- **docs/CLOUDFLARE_DEPLOY_CHECKLIST.md** — Pre-deploy checklist (account, token, worker name).
