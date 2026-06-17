# Non-canonical GitHub Actions (do not use for production)

These workflow files live under `apps/web/.github/workflows/` for historical / Vercel-era experiments.

**Canonical CI and deploy paths are at the repository root:**

| Purpose | Canonical path |
|---------|----------------|
| PR validation | `.github/workflows/ci-check.yml` — **CI Check** |
| Staging deploy | `.github/workflows/deploy-cloudflare-staging.yml` |
| Production deploy | `.github/workflows/deploy-cloudflare-prod.yml` |

Do not enable `apps/web/.github/workflows/ci.yml` or `deploy.yml` as required checks on `main`. See `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`.

**Manual iOS Layer B:** `.github/workflows/ios-e2e-integration.yml` (repo root) — see `.github/workflows/README.md`.
