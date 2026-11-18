# Governed AI PR E2E runner — owner secret setup

Configure staging credentials **without pasting values into PRs, chat, or commits**.

## Owner setup sequence (required order)

1. **Merge infra PR #245** into `main` (registers workflow on default branch).
2. Open GitHub → repository **Settings** → **Environments** → create or verify **`staging`**.
3. Enable **Required reviewers** for `staging` (owner approval before secrets deploy).
4. Confirm `protection_rules` is **not empty** and deployment branches/tags are restricted to selected branch `main` (workflow preflight fails with `BLOCKED_STAGING_ENVIRONMENT_UNPROTECTED` until configured).
5. **Only then** add environment secrets and the QA project variable below.
6. Dispatch **Governed AI PR E2E runner** from **`main`** with exact PR head SHA, GitHub Deployment ID, and Preview URL matching deployment `environment_url`.
7. When GitHub prompts for environment approval, **owner manually approves** the deployment.
8. Review the **redacted** workflow artifact only (never paste secrets into dispatch inputs).

Prefer **Environment secrets/variables** on protected `staging` over repository-wide secrets for runner credentials.

## Vercel — automation bypass

1. Open Vercel → project **`aistroyka-web-web-v7jq`**
2. **Settings** → **Deployment Protection**
3. Enable **Protection Bypass for Automation** (if not already)
4. Create or copy the **Automation Bypass** secret
5. Store it as GitHub Environment secret `VERCEL_AUTOMATION_BYPASS_SECRET` on **`staging`**

Do not append bypass tokens to Preview URLs in workflow inputs or documentation.

## GitHub — protected `staging` environment

1. Repository **Settings** → **Environments** → **`staging`**
2. **Required reviewers** — add at least one owner reviewer (mandatory before first dispatch)
3. **Deployment branches and tags** — choose selected branches/tags and allow only `main`
4. Add **Environment secrets**:

| Secret | Purpose |
|--------|---------|
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Vercel Deployment Protection bypass header |
| `PILOT_E2E_MANAGER_EMAIL` | Manager QA account (distinct from worker) |
| `PILOT_E2E_MANAGER_PASSWORD` | Manager QA password |

5. Verify these exist (move to Environment if currently repository-level):

| Secret | Purpose |
|--------|---------|
| `PILOT_SMOKE_EMAIL_STAGING` | Worker QA login |
| `PILOT_SMOKE_PASSWORD_STAGING` | Worker QA password |
| `STAKEHOLDER_SMOKE_EMAIL` | Owner/stakeholder QA login |
| `STAKEHOLDER_SMOKE_PASSWORD` | Owner/stakeholder QA password |
| `NEXT_PUBLIC_SUPABASE_URL_STAGING` | Staging Supabase (must reference `vthfrxehrursfloevnlp`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING` | Staging anon key |
| `GOVERNED_E2E_SEAL_PRIVATE_KEY` | RSA private key (PKCS#8 PEM) for inter-job E2E bundle unseal — **required**; public half is committed at `apps/web/lib/ops/governed-ai-pr-e2e-runner.seal-public-key.pem` |

6. Add **Environment variable** (not secret):

| Variable | Purpose |
|----------|---------|
| `PILOT_SMOKE_PROJECT_ID_STAGING` | Pinned disposable QA project UUID |

Optional (steps 23–24 only if dedicated personas exist):

- `PILOT_E2E_STAKEHOLDER_REVOKED_EMAIL` / `PILOT_E2E_STAKEHOLDER_REVOKED_PASSWORD`
- `PILOT_E2E_CROSS_TENANT_EMAIL` / `PILOT_E2E_CROSS_TENANT_PASSWORD`

## GitHub Deployment ID for dispatch

1. Open the product PR → **Checks** / **Deployments**
2. Locate the Vercel **Preview** deployment for the exact PR head SHA
3. Copy the GitHub **Deployment ID** (numeric) and the **environment URL** from the latest **success** status
4. Pass both as `deployment_id` and `preview_base_url` workflow inputs

Do **not** pin a static Preview hostname on `main`. Each new Preview deployment gets a new immutable URL; the runner binds trust via GitHub Deployment metadata and independent latest-status provenance.

Final authenticated acceptance requires **25/25 PASS** in the redacted artifact. Secrets are not provisioned by this infra PR; workflow is not E2E-dispatch-ready until a separate owner provisioning + dispatch gate.

Example (PR #244 @ `628bb6b1…`):

| Field | Value |
|-------|-------|
| `deployment_id` | `6064462333` |
| `preview_base_url` | `https://aistroyka-web-web-v7jq-8of2zsc02-2qjckdknjf-ctrls-projects.vercel.app` |

## Not required

- **`SUPABASE_SERVICE_ROLE_KEY_STAGING`** — intentionally **not** used by the runner (PR-checked-out code must not receive service-role keys)

## Preflight blockers (expected before setup complete)

| Code | Meaning |
|------|---------|
| `BLOCKED_STAGING_ENVIRONMENT_UNPROTECTED` | Add required reviewers and selected branch policy `main` to `staging` |
| `BLOCKED_STAGING_ENVIRONMENT_METADATA` | Environment API unavailable or misconfigured |
| `BLOCKED_SEAL_PRIVATE_KEY_MISSING` | Add `GOVERNED_E2E_SEAL_PRIVATE_KEY` to protected `staging` (see provisioning manifest below) |
| Missing secret names | Add required Environment secrets/variable |

## Seal key provisioning manifest (owner action — not automated by this PR)

Generate an RSA-2048 keypair locally. Commit **only** the public PEM to `apps/web/lib/ops/governed-ai-pr-e2e-runner.seal-public-key.pem` (already in repo). Store the PKCS#8 private PEM as protected Environment secret:

| Secret | Format | Scope |
|--------|--------|-------|
| `GOVERNED_E2E_SEAL_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----` … PKCS#8 PEM | `staging` environment only |

Until provisioned, staging-gate preflight fails closed with `BLOCKED_SEAL_PRIVATE_KEY_MISSING`. Do not paste key material into PRs, chat, or workflow inputs.

See also: `docs/ops/GOVERNED_AI_PR_E2E_RUNNER.md`, `docs/ops/GOVERNED_AI_PR_E2E_RUNNER_THREAT_MODEL.md`
