# Production ground truth

**Single source of truth:** Only **apps/web** is deployed as the production web app.

---

## Snapshot (at report creation)

| Item | Value |
|------|--------|
| **Current main SHA** | `3821ed4` (run `git rev-parse main` to confirm) |
| **Deployed directory** | **apps/web** |
| **Production worker name** | **aistroyka-web-production** |
| **workers.dev URL** | From deploy step output: `https://aistroyka-web-production.<account>.workers.dev` |

---

## Next.js apps in repo

- **Root** `app/`, `components/`, `lib/`: legacy; **not** built or deployed by CI.
- **apps/web**: full enterprise UI (locale, Nav, dashboard, projects, admin). **Only this app is deployed.**

---

## CI

- **Workflow:** `.github/workflows/deploy-cloudflare-prod.yml`
- **Trigger:** push to `main`
- **Steps:** checkout → Node 20 (npm cache) → Bun → install in apps/web → set build stamp env → cf:build → deploy with wrangler (env production)
