## Learned User Preferences

- Do not use destructive git operations: no force push, no reset --hard, no history rewrite.
- Do not delete or remove things without explicit necessity.
- Run an audit or check state before performing risky or irreversible actions.
- Do not break existing dashboard, auth flows, middleware, tenant logic, or platform-owner access gates when adding features.
- Do not commit secrets, .env files with real values, tokens, or build artifacts; use .gitignore and example files.
- Prefer new work as isolated additions (components, routes, docs) over broad refactors; put reports and documentation under docs/ and phase subdirs (e.g. docs/mobile-rebuild/, docs/audit/).
- Keep dashboard and public UI copy aligned with the active page locale (next-intl) and consistent product terminology.
- For mobile: do not merge Manager and Worker into one app; keep shared logic in Shared; do not use WorkerLite as primary product name.
- Do not invent or fake success (e.g. fake build results); document real blockers and missing values.
- When config values may exist in repo: search first (env examples, docs, scripts); do not ask for values that are already there; do not hardcode fake placeholders if real values exist.
- Prefer end-to-end execution with minimal handoff when requested ("do it yourself"); when the user signals continuing by plan, without pausing, or in any language (e.g. keep going, proceed, don’t stop, «без остановки» / «делай дальше» / «по плану», etc.), chain subtasks (validate, fix failures, then proceed) without optional checkpoint prompts unless blocked or scope is unclear.
- Default to Russian-language communication when the user requests it.

## Learned Workspace Facts

- Aistroyka is a monorepo; web application lives in apps/web (Next.js, App Router).
- Root build: from repo root run `bun install` and `bun run build` (builds packages/contracts then apps/web).
- Production runtime and DNS ownership is **Cloudflare Workers** (`apps/web/wrangler.toml`, OpenNext); use `bun run cf:build` then Wrangler deploy, and verify apex/www routes through Cloudflare when making production readiness claims.
- iOS: AiStroykaManager and AiStroykaWorker (shared in ios/Shared); Android mirrors (android/shared); WorkerLite is deprecated as the primary product name.
- Local iOS config: ios/Config/Secrets.xcconfig (gitignored) and Secrets.xcconfig.example; both apps use the same xcconfig.
- Public site and dashboard coexist; locale routes under [locale]; public pages under (public), dashboard under (dashboard); web i18n uses next-intl message files for en/ru/es/it.
- API routes live under apps/web/app/api/; treat /api/v1/* as canonical, and do not change tenant/auth logic without necessity. Mobile sync 409 conflict responses expose `serverCursor` (a `server_cursor` alias may appear) for reconciliation—follow docs/runbooks/MOBILE_SYNC.md.
- Docs and phase reports go under docs/ and subdirs (e.g. docs/audit/, docs/final/, docs/mobile-rebuild/, docs/deploy-fix/, docs/pilot-launch/). Pilot audit: `bun run audit:pilot` at repo root; Playwright specs live under `apps/web/tests/e2e` with `PLAYWRIGHT_BASE_URL` as baseURL; scoped pilot run `bun run --cwd apps/web e2e:pilot`; env template `.env.pilot.example`; artifacts under docs/audit/artifacts/.
- Environment variables for production are documented in docs/ENVIRONMENT-VARIABLES.md; required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL. For Cloudflare/OpenNext (`cf:build`), those `NEXT_PUBLIC_*` values must be present at build time—they are inlined into the client bundle, so Worker runtime secrets alone do not satisfy client-side checks (e.g. login). Public Proof Pack token route (`GET /api/v1/share/proof/:token`) needs `SUPABASE_SERVICE_ROLE_KEY` server-side so the app can resolve share rows and pack sources under RLS; without it the route returns 503.
- Supabase migrations live under `apps/web/supabase/migrations/`; apply via Supabase CLI / dashboard (the repo previously shipped `apply-migrations.yml` — removed in Release 1 cleanup; re-add if you need GitHub-driven apply).
- PR merge gate: GitHub **CI Check** (`.github/workflows/ci-check.yml`) runs `bun install`, lint, tests, and `cf:build` on each pull request.
- Staging deploy (`.github/workflows/deploy-cloudflare-staging.yml`) may call reusable **Pilot E2E audit** (`.github/workflows/pilot-e2e-audit.yml`) after `pilot-smoke` with `continue-on-error: true`; that workflow supports `workflow_call` (and `workflow_dispatch`) with optional `locale` input (default `en`, maps to `E2E_LOCALE`); requires repo secrets `PILOT_E2E_BASE_URL`, `PILOT_E2E_EMAIL`, `PILOT_E2E_PASSWORD` (optional `PILOT_E2E_PROJECT_ID`).
