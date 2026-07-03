# Repository Operating Inventory — AISTROYKA

> Stage A of the Project Operating System setup. Read-only inspection snapshot.
> Date: 2026-06-30 · Inspected branch: `post-merge-pr171` (== `origin/main`)
> Purpose: give any Cursor agent (desktop or cloud) a trustworthy map of the repo.

## 1. Repo identity

| Field | Value |
|---|---|
| Monorepo | Yes (Bun workspaces + pnpm-workspace.yaml present) |
| Package manager (canonical) | **Bun 1.2.15** (`.tool-versions`, `bun.lock`) |
| Node pin | 22.9.0 (`.tool-versions`); local machine runs 22.23.0 |
| Root npm lock | `package-lock.json` exists **only** for the Vercel npm preview path; validate with `node scripts/ci/validate-npm-lock.cjs` |
| Remote | `git@github.com:2qjckdknjf-ctrl/Aistroyka-web.git` (`origin`) |
| Default branch | `origin/main` |

## 2. Repo map (top level)

```
apps/                # application surfaces (see §3)
packages/            # shared libraries (contracts, api-client, contracts-openapi)
shared/              # shared cross-surface code
android/             # Android Manager + Worker (Compose) + shared
ios/                 # iOS Manager + Worker + Shared (SPM)
scripts/             # ops/ci/audit/smoke/release/db tooling (see SCRIPTS_INVENTORY.md)
docs/                # all documentation + phase reports (~298 entries)
.github/workflows/   # CI/CD (17 workflow files)
maestro/             # mobile UI flows (output/ is gitignored)
archive/             # historical material
artifacts/           # generated audit artifacts (gitignored)
reports/             # generated reports (root /reports gitignored)
evidence/            # store-upload + smoke evidence (GITIGNORED — see §6)
local-secrets/       # local-only secret material (GITIGNORED — see §6)
logs/                # local logs
node_modules/        # deps (gitignored)
```

### Key root config files
- `package.json` — root workspace + canonical scripts (build, lint, test, cf:build, smoke:*, audit:*).
- `wrangler.toml` (root) + `apps/web/wrangler.toml`, `apps/web/wrangler.deploy.toml` — Cloudflare Workers.
- `tsconfig.json`, `.eslintrc.json`, `pnpm-workspace.yaml`, `.npmrc`.
- `.tool-versions` — toolchain pins.
- `AGENTS.md` — learned preferences + workspace facts (authoritative agent context).
- `README.md` — repo intro.

## 3. Apps

| Path | What it is |
|---|---|
| `apps/web` | **Primary product.** Next.js 15 App Router, Supabase, OpenNext→Cloudflare Workers. Public site + dashboard + `/api/v1/*` + AI/Copilot runtime. |
| `apps/cloudflare-agent` | Cloudflare agent starter split (auxiliary). |
| `apps/cloudflare-com-redirect` | `.com → aistroyka.ai` 301 redirect worker. |

## 4. Packages

| Path | What it is |
|---|---|
| `packages/contracts` | Shared TS contracts; built before web (`build:contracts`). Output `dist/` is gitignored. |
| `packages/api-client` | API client library. |
| `packages/contracts-openapi` | OpenAPI contract sources. |

## 5. Mobile surfaces

| Path | What it is |
|---|---|
| `ios/AiStroykaManager`, `ios/AiStroykaWorker`, `ios/Shared` | iOS apps (primary mobile contour). Checked-in Xcode projects include UITest targets. `ios/Config/Secrets.xcconfig` is gitignored. |
| `android/AiStroykaManager`, `android/AiStroykaWorker`, `android/shared` | Android Compose scaffolds (thinner than iOS). Gradle 8.7 / AGP 8.6.1 / JDK 17. `android/.secrets/`, `keystore.properties` gitignored. |

## 6. DANGEROUS — never commit (already gitignored, verify before any add)

- `.env`, `.env.local`, `apps/web/.env.local`, `.env.pilot`, all `.env*` (except `*.example`).
- `local-secrets/` — local store-upload credentials.
- `evidence/` — store/smoke evidence (large, includes built `.xcarchive`, binaries).
- `ios/Config/Secrets.xcconfig`, `ios/Config/.uitest-e2e-credentials`, `*.p8`, `AuthKey_*.p8`, `*.cer`, `*.mobileprovision`.
- `android/.secrets/`, `android/keystore.properties`, `*.jks`, `*.keystore`, `*.aab`, `*.apk`.
- `play-service-account*.json`, `google-play*.json`, `service-account*.json`.
- `*.pem`, `*.key`, `*.p12`, `.dev.vars`, `secrets/`.
- Build/generated: `.next`, `.open-next`, `.wrangler`, `.turbo`, `*.tsbuildinfo`, `packages/contracts/dist`, `node_modules`.

> **Rule:** never `git add .`. Stage explicit paths only. `.env.local` (real values) currently exists at root — confirmed gitignored.

## 7. Generated / local-only folders (do not treat as source)

`node_modules/`, `.next`, `.open-next`, `.wrangler`, `.turbo`, `artifacts/`, root `reports/`, `evidence/`, `maestro/output/`, `ios/build/`, `**/DerivedData/`, `tsconfig.tsbuildinfo`, `*.zip` archives at root.

## 8. Unclear / cleanup-candidate items (documented, NOT acted on)

- Duplicate-suffixed files: `apps/web/wrangler (1).deploy.toml`, `scripts/release-readiness-check (1).mjs`, `scripts/validate-release-env (1).mjs` — likely accidental copies; leave for owner decision (HARD RULE: do not delete).
- Root archives `Архив.zip`, `archive_prod_smoke_green_v4_*.zip` — gitignored (`*.zip`) but present on disk.
- `.tmp-home/`, `.mcp_apply_payload.json` — local scratch; `.tmp-home/` gitignored.

## 9. Existing docs structure (relevant to ops)

- `docs/ops/` — EXISTS (runbooks: live/staging smoke, billing pilot, post-merge governance). This setup adds the operating-system files.
- `docs/runbooks/` — EXISTS (deployment source of truth, incident/sync/upload runbooks).
- `docs/reports/` — EXISTS.
- `docs/tasks/`, `docs/handoff/`, `docs/decisions/` — **MISSING** → created by this setup (Stage E).
- `docs/CURRENT_PROJECT_TRUTH_INDEX.md`, `docs/audit/`, `docs/reconciliation/` — authoritative truth/audit trees.

## 10. Recommended canonical structure (target)

```
docs/
  ops/        # operating system: working model, cloud-agent flow, templates, audits
  tasks/      # one scoped task file per active task (from TASK_TEMPLATE.md)
  handoff/    # one handoff file per finished/paused task (from HANDOFF_TEMPLATE.md)
  decisions/  # lightweight ADRs
  reports/    # setup + operating reports
  runbooks/   # operational runbooks (existing)
PROJECT_CONTEXT.md   # master, safe-to-share context (root)
STATUS.md            # live, mobile-readable status (root)
```
