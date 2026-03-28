# Wave 3 — Operator access and stack inventory

**Date (UTC):** 2026-03-28  
**Repo HEAD (local after push):** `f941d0e2` on `main`

## Tools available (this environment)

| Tool | Available | Notes |
|------|-----------|--------|
| `git` | Yes | Clean push to `origin main` succeeded |
| `gh` | Yes | Authenticated (`repo`, `workflow` scopes); repo `2qjckdknjf-ctrl/Aistroyka-web` |
| `curl` | Yes | Used for health, rules, smoke |
| `node` / `npm` | Yes | Builds and Vitest |
| `npx vercel` | Yes | CLI can run; **no `VERCEL_TOKEN` in env** — production updates via Git integration / dashboard |
| `wrangler` | Via `npx` in repo | Not on global PATH; used in CI |
| `supabase` CLI | Present | Not required for this sprint |
| Vercel MCP | `mcp_auth` only | No automated deploy tool without interactive auth |

## External access

- **GitHub Actions:** readable and triggerable via `gh` (workflow runs listed).
- **GitHub secrets:** not readable from CLI (expected). Observed failure when secret `PILOT_SMOKE_BEARER_PRODUCTION` is empty in Actions.
- **Production smoke credentials:** `apps/web/.env.local` present locally (not committed); used only for authenticated curls — **no secrets printed in reports**.

## Deploy candidates (repo truth)

1. **Vercel** — `apps/web/vercel.json` install/build from monorepo root; domain attachment in Vercel for `aistroyka.ai` / `www.aistroyka.ai`.
2. **Cloudflare Workers (OpenNext)** — `bun run cf:build` + `wrangler deploy --env production`; worker name `aistroyka-web-production` (`apps/web/wrangler.toml`).
3. **CI** — `.github/workflows/deploy-cloudflare-prod.yml` on push to `main`; `.github/workflows/ci.yml` does **not** run on `main` (only PR + `feature/**`).

## Evidence: which stack serves `https://aistroyka.ai` / `www`

| Check | Result |
|-------|--------|
| `dig +short www.aistroyka.ai` | CNAME to `*.vercel-dns-017.com` |
| `curl -sSIL https://aistroyka.ai/api/v1/health` | `307` to `www`; **`server: Vercel`**, `x-vercel-id` present |
| `GET https://www.aistroyka.ai/api/v1/health` JSON | **`buildStamp.sha7`** matches Git-based deploy (see alignment report) |

**Conclusion:** Public production traffic for the product domain is served by **Vercel**, not by the Cloudflare Worker hostname. The Cloudflare path remains a **second** production artifact (worker `aistroyka-web-production`) updated by CI.

## Missing / partial access

- **Vercel:** no non-interactive token in environment; deploy proven via **Git push → Vercel production** (health stamp).
- **GitHub:** cannot read or set `PILOT_SMOKE_BEARER_PRODUCTION` from this agent — **P0** for green `Deploy Cloudflare (Production)` job end-to-end (post-deploy secret step fails).
- **Second worker user** for cross-tenant peer denial: not available in automated env without explicit seeding — **blocker for strict cross-worker proof** (see cross-worker report).
