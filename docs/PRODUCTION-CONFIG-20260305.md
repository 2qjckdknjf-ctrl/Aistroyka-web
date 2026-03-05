# Production configuration

**Date:** 2026-03-05

---

## Branch and deploy

- **Branch:** `main`.
- **Worker:** aistroyka-web-production.
- **Build:** From repo root: `bun install --frozen-lockfile`, `bun run cf:build`. CI sets `NEXT_PUBLIC_APP_ENV=production`.

---

## Canonical domain

- **Primary:** https://aistroyka.ai (canonical).
- **Redirect:** https://www.aistroyka.ai → 301 to https://aistroyka.ai (or the opposite if preferred; set in Cloudflare DNS/Page rules or Redirect rules).

---

## DNS and routes

- Routes for aistroyka.ai and www.aistroyka.ai are attached to **aistroyka-web-production** in Cloudflare Dashboard (Workers & Pages → aistroyka-web-production → Triggers / Domains). They are not defined in wrangler.toml to avoid route conflicts.
- DNS: A/AAAA or CNAME as required by Cloudflare for the zone. Proxy (orange) recommended; SSL/TLS **Full (strict)**.

---

## Environment variables

- **Build:** Set in CI (NEXT_PUBLIC_* and NEXT_PUBLIC_APP_ENV=production). If using Cloudflare Build UI, use same vars as in ENVIRONMENT-MATRIX for production.
- **Runtime:** Worker → Settings → Variables and secrets. Production-only keys (Supabase prod, Stripe prod, etc.). No staging or debug keys.

---

## Verification

- GET https://aistroyka.ai → 200, app loads.
- GET https://aistroyka.ai/api/v1/health → 200 or 503, JSON with `ok`, `buildStamp`, optional `env: "production"`.
- Run: `cd apps/web && bun run smoke:prod`.
