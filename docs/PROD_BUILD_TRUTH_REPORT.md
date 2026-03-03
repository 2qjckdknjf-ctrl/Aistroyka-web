# Production build truth report

Evidence for which build is served on **aistroyka.ai** and how to keep production on the latest **apps/web** deploy (Cloudflare Workers OpenNext).

---

## Phase 0 — Baseline

### Repo structure

- **Root Next app:** `app/`, `components/`, `lib/` at repo root. **Not** built or deployed by CI.
- **apps/web Next app:** Full app with `[locale]`, design tokens, Nav, dashboard, projects, admin. **This is the only app deployed to production.**

### Deploy config

- **Workflow:** `.github/workflows/deploy-cloudflare-prod.yml`
- **Working directory:** `apps/web` for install, build, and deploy.
- **Build:** `npm run cf:build` (OpenNext Cloudflare) → `.open-next/worker.js` and `.open-next/assets`.
- **Deploy:** `npx wrangler deploy --env production --config wrangler.toml`
- **Worker name:** `aistroyka-web-production` (from `apps/web/wrangler.toml`).
- **Routes:** Not managed by CI (commented out in wrangler); set manually in Cloudflare Dashboard. See **docs/ROUTES_MANUAL_SETUP.md** and **docs/DOMAIN_POINTS_TO_WORKER.md**.

### Current git SHA (main)

**975de22** (final push; run `git rev-parse main` locally to confirm).

### Last successful "Deploy Cloudflare (Production)" run

*(Fill from GitHub Actions: open latest successful run, copy the commit SHA.)*

- **Commit SHA:** _______________
- **Run URL:** _______________

---

## Phase 1 — Build marker

- **Location:** `apps/web/app/[locale]/(dashboard)/layout.tsx` — footer line `Build: <sha7> / <date>`.
- **SHA source (priority):** `GITHUB_SHA` (Cloudflare CI) → `VERCEL_GIT_COMMIT_SHA` (Vercel) → `"local"`.
- **Date source:** `NEXT_PUBLIC_BUILD_TIME` (set in CI before `npm run cf:build`).
- **Rendering:** Visible on every dashboard route (e.g. `/en/dashboard`, `/ru/dashboard`) for authenticated users.

---

## Phase 2 — Evidence from prod-verify.sh

Run (optional workers.dev base URL from deploy step output):

```bash
./scripts/prod-verify.sh
# or with workers.dev:
./scripts/prod-verify.sh "https://aistroyka-web-production.<account>.workers.dev"
```

### Paste output here

*(Run the script and paste the output below. Compare "Build marker" lines for domain vs workers.dev.)*

```
========== Domain /dashboard ==========
...
========== Domain /en/dashboard ==========
...
```

### Response headers (example)

- **cf-ray:** _______________
- **cache-status:** _______________
- **server:** _______________

---

## Conclusions

| Check | Result |
|-------|--------|
| workers.dev shows Build: \<sha7\> | ___ (yes/no) |
| aistroyka.ai shows Build: \<sha7\> | ___ (yes/no) |
| SHAs match latest deploy commit | ___ (yes/no) |

- **If workers.dev shows new sha but aistroyka.ai does not:** Routing/DNS/routes mismatch. Domain is not pointing to **aistroyka-web-production**. Fix: Cloudflare Dashboard → Workers & Pages → aistroyka-web-production → Triggers → Routes. Ensure `aistroyka.ai/*` and `www.aistroyka.ai/*` point to this worker. See **docs/ROUTES_MANUAL_SETUP.md** and **docs/DOMAIN_POINTS_TO_WORKER.md**.
- **If both show old sha:** CI may not be deploying the latest commit, or a different Worker is being deployed. Confirm workflow uses `working-directory: apps/web` and that the run completed for the expected commit.
- **If both show same new sha:** Domain is serving the latest deploy. No change needed.

---

## Next steps (if domain not aligned)

1. Open **Cloudflare Dashboard** → **Workers & Pages** → **Workers** → **aistroyka-web-production**.
2. **Triggers** → **Routes** → remove any route pointing to a deleted or wrong worker.
3. **Add route:** `aistroyka.ai/*` → Zone: **aistroyka.ai**.
4. **Add route:** `www.aistroyka.ai/*` → Zone: **aistroyka.ai**.
5. **DNS:** Ensure **@** and **www** are **Proxied** (orange cloud).
6. Hard refresh (Cmd+Shift+R) or incognito; run `./scripts/prod-verify.sh` again.

---

## Deployed commit SHA (final)

*(Update after verifying production with scripts/prod-verify.sh and GitHub Actions.)*

**Latest commit on main (at report write):** 08fb1c0  
**Deployed commit (from build marker or Actions):** _______________
