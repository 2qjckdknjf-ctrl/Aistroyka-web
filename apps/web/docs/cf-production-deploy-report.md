# Production deploy report — local Cloudflare Workers workflow

**Date:** 2026-02-23  
**Project:** AISTROYKA-WEB (Next.js + OpenNext Cloudflare + Supabase)

---

## Tool versions

| Tool     | Version   |
|----------|-----------|
| Node     | v20.20.0  |
| npm      | 10.8.2    |
| bun      | 1.3.9     |
| wrangler | 4.67.0    |

---

## Repo state (A)

- **pwd / git root:** `/Users/alex/Desktop/AISTROYKA/AISTROYKA-WEB`
- **git status before commits:** modified `package.json`, untracked `bun.lock`, docs.

---

## Changes made (build/deploy only)

| File         | Change |
|--------------|--------|
| **package.json** | Added script `"cf:deploy": "wrangler deploy"`. Upgraded devDependency `wrangler` from `^3.99.0` to `^4.67.0`. |
| **bun.lock**     | Added (lockfile after `bun add -d wrangler` and `bun install`). |

No backend/RPC or TS typing changes in this run (Supabase adapters already typed).

---

## Verification

- **Wrangler auth:** `bunx wrangler login` completed; `bunx wrangler whoami` shows account (OAuth).
- **`bun run cf:build`:** Passes locally. OpenNext build completes; worker output: `.open-next/worker.js`.
- **`bun run cf:deploy`:** Succeeds. Worker deployed to Cloudflare.

---

## Deploy result (F)

- **Worker name:** `aistroyka-web`
- **Environment:** Cloudflare Workers (account ID: 864f04d729c24f574a228558b40d7b82)
- **URL:** https://aistroyka-web.z6pxn548dk.workers.dev
- **Version ID:** 78741cdb-dc9d-4153-bcb0-f838d21b78a7

---

## One-command redeploy

From repo root (with `bun` in PATH or `PATH="$HOME/.bun/bin:$PATH"`):

```bash
bun run cf:deploy
```

To rebuild and deploy:

```bash
bun run cf:build && bun run cf:deploy
```

---

## Notes

- Backend/RPC and Next.js version were not changed.
- Optional: add `workers_dev = false` or `preview_urls = false` in `wrangler.toml` if you want to match dashboard or disable workers.dev/preview URLs.
