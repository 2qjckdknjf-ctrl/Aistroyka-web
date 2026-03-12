# AGENTS.md — Aistroyka

## Learned User Preferences

- Do not use destructive git operations: no force push, no reset --hard, no history rewrite.
- Do not delete or remove things without explicit necessity.
- Run an audit or check state before performing risky or irreversible actions.
- Do not break existing dashboard, auth flows, middleware, or tenant logic when adding features.
- Do not commit secrets, .env files with real values, tokens, or build artifacts; use .gitignore and example files.
- Prefer adding new work in isolation (new components, routes, docs) rather than refactoring existing flows unnecessarily.
- For deploy and config: change only deploy-readiness or config wiring; do not change product code or architecture.
- Write reports and documentation into docs/ (and phase-specific subdirs like docs/mobile-rebuild/, docs/mobile-config/).
- Prefer clean architecture and explicit structure over patchwork or legacy naming.
- For mobile: do not merge Manager and Worker into one app; keep shared logic in Shared; do not use WorkerLite as primary product name.
- Do not invent or fake success (e.g. fake build results); document real blockers and missing values.
- When config values may exist in repo: search first (env examples, docs, scripts); do not ask for values that are already there; do not hardcode fake placeholders if real values exist.

## Learned Workspace Facts

- Aistroyka is a monorepo; web application lives in apps/web (Next.js, App Router).
- Root build: from repo root run npm install and npm run build (builds packages/contracts then apps/web).
- For Vercel deploy use Root Directory apps/web; install and build run from repo root via vercel.json.
- iOS apps are AiStroykaManager and AiStroykaWorker; shared code lives in ios/Shared; WorkerLite is deprecated as the primary product name.
- Android apps are AiStroykaManager and AiStroykaWorker with android/shared; structure mirrors iOS.
- Local iOS config: ios/Config/Secrets.xcconfig (gitignored) and Secrets.xcconfig.example; both apps use the same xcconfig.
- Public site and dashboard coexist; locale routes under [locale]; public pages under (public), dashboard under (dashboard).
- API routes live under apps/web/app/api/; tenant and auth logic are central and should not be changed without necessity.
- Docs and phase reports go under docs/ and subdirs (e.g. docs/mobile-rebuild/, docs/deploy-fix/, docs/pilot-launch/).
- Environment variables for production are documented in docs/ENVIRONMENT-VARIABLES.md; required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL.
