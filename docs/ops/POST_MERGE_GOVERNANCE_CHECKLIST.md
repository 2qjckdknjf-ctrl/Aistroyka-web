# Post-merge governance checklist (operators)

**Date:** 2026-06-16  
**Context:** Post-merge closure complete. Prod build **`a7686d6`** (PR #89–#90). Phase 13: **CONDITIONAL YES**.  
**Governance:** C-03 **closed** 2026-06-16 (branch protection on `main`).

Repo: [2qjckdknjf-ctrl/Aistroyka-web](https://github.com/2qjckdknjf-ctrl/Aistroyka-web)

---

## Quick status (2026-06-16)

| Item | Status | Notes |
|------|--------|-------|
| PR #76–#90 on `main` | **DONE** | AI parity, i18n, deploy fix, C-03, smoke arm64, operator tooling |
| Staging + prod deploy | **DONE** | Latest prod `27649470701` / build `a7686d6` |
| `CI Check` on PRs | **REQUIRED** | `check` + 1 review on `main` |
| `main` branch protection | **DONE** | `configure-main-branch-protection.sh` 2026-06-16 |
| Stakeholder sanity (CI prod) | **PASS** | Blocking job `27649470701` |
| Stakeholder sanity (local) | **OPTIONAL** | `STAKEHOLDER_SMOKE_*` in `.env.pilot`; script auto-loads file — `bun run smoke:pilot:check` |
| iOS Layer B live E2E | **PASS (local)** | 2026-06-16 |

---

## A. GitHub branch protection (C-03) — **DONE 2026-06-16**

### A.1 Who

- **Repo admin** or **org owner** with permission to edit branch protection / rulesets.

### A.2 Where (pick one model)

**Option 1 — Classic branch protection (simplest)**

1. Open: `https://github.com/2qjckdknjf-ctrl/Aistroyka-web/settings/branches`
2. **Add branch protection rule** (or edit existing) for **`main`**.

**Option 2 — Repository ruleset (recommended for new setups)**

1. Open: `https://github.com/2qjckdknjf-ctrl/Aistroyka-web/settings/rules`
2. **New ruleset** → target branch **`main`**.

**Option 3 — Organization ruleset (if repo is org-managed)**

1. Org: `https://github.com/organizations/2qjckdknjf-ctrl/settings/rules`
2. Confirm whether an org ruleset already targets `Aistroyka-web` / `main` (repo API may still show 404).

### A.3 Required settings (checklist)

- [ ] **Protect branch `main`** (rule or ruleset applies to `main` only).
- [ ] **Require a pull request before merging**
  - [ ] Minimum approvals: **1** (or team policy).
  - [ ] Dismiss stale approvals on new commits: **on** (recommended).
- [ ] **Require status checks to pass before merging**
  - [ ] **Required check:** `check` (job inside workflow **CI Check**)
    - In the GitHub UI dropdown the label may appear as **`check`** or **`CI Check`** — enable the one that maps to workflow file `.github/workflows/ci-check.yml`.
  - [ ] **Do NOT require** Vercel contexts (`Vercel`, `Vercel Preview Comments`, project slug checks) — production is **Cloudflare**, not Vercel.
  - [ ] **Do NOT require** `Deploy Cloudflare (Staging)` / `Deploy Cloudflare (Production)` on PR merge — those run **after** merge to `main`, not on open PRs.
- [ ] **Require branches to be up to date before merging** (recommended).
- [ ] **Restrict who can push to matching branches** — disallow direct pushes to `main` except admins (recommended).
- [ ] **Do not allow bypassing the above settings** — or document explicit bypass list (release managers only).
- [ ] **Optional (iOS PRs):** if using rulesets with path filters, also require **`Worker + Manager UI smoke`** when `ios/**` changes (workflow `.github/workflows/ios-ui-smoke.yml`). Classic protection cannot path-filter; use rulesets for this.

### A.4 What NOT to require on PR merge

| Check | Why skip on PR |
|-------|----------------|
| `Deploy Cloudflare (Staging)` | Triggers on **push to `main`**, not on PR |
| `Deploy Cloudflare (Production)` | Chains from successful staging **after** merge |
| `Vercel` / preview deploys | Non-canonical; creates false merge blockers |
| `Workers Builds: aistroyka-web-production` | Third-party / parallel noise; use Cloudflare workflow as truth |

### A.5 Evidence to capture (close C-03)

After saving settings, record:

- [ ] Screenshot or export: **Branches** or **Rulesets** page showing `main` + required checks.
- [ ] Note **date**, **operator**, and **exact required check names** as shown in GitHub UI.
- [ ] Optional API snapshot (reference only — **not sufficient alone**):

```bash
gh api repos/2qjckdknjf-ctrl/Aistroyka-web/branches/main/protection
gh api repos/2qjckdknjf-ctrl/Aistroyka-web/rulesets
```

- [ ] Update `docs/audit/DEEP_AUDIT_RISK_REGISTER.md` — C-03 → **`closed`** with evidence link/date.
- [ ] Update `docs/product/PHASE13_ROADMAP_CLOSURE.md` — branch protection row → **PASS**.

### A.6 Smoke-test the rule

- [ ] Open a trivial docs-only PR (or use an existing open PR).
- [ ] Confirm **merge is blocked** until **`check` / CI Check** is green.
- [ ] Confirm merge is **not** blocked waiting for Vercel or Cloudflare deploy workflows.

### A.7 API helper (optional — repo admin token)

If you have a GitHub token with **administration** write on the repo:

```bash
GH_TOKEN=ghp_... bash scripts/ops/configure-main-branch-protection.sh --dry-run
GH_TOKEN=ghp_... bash scripts/ops/configure-main-branch-protection.sh
```

Override check name if the UI dropdown differs: `REQUIRED_STATUS_CHECK='CI Check' GH_TOKEN=... bash scripts/ops/configure-main-branch-protection.sh`

On failure (403/404), use § A.2 UI steps — API cannot replace org-level rulesets without org admin.

---

## B. Post-merge runtime gates (already green — re-run after big changes)

| Gate | Command / trigger | Last result |
|------|-------------------|-------------|
| Staging health | `curl -sS https://staging.aistroyka.ai/api/v1/health` | 200 |
| Production health | `curl -sS https://aistroyka.ai/api/v1/health` | 200, build `cd130eb` |
| Staging pilot smoke | `BASE_URL=https://staging.aistroyka.ai bash scripts/smoke/pilot_launch.sh` | PASS |
| Production pilot smoke | `BASE_URL=https://aistroyka.ai bash scripts/smoke/pilot_launch.sh` (+ `CRON_SECRET` for cron-tick) | metrics PASS; cron needs secret locally |
| AI live provider | `BASE_URL=https://aistroyka.ai bash scripts/smoke/ai_live_provider.sh --require-live` | PASS, fallback 0% |
| Playwright pilot | `source .env.pilot && PLAYWRIGHT_SKIP_WEB_SERVER=1 bun run --cwd apps/web e2e:pilot` | 21 passed, 1 skipped |
| iOS API chain | `source .env.pilot && BASE_URL=https://aistroyka.ai bash scripts/smoke/ios_mobile_api_chain.sh` | PASS |
| Stakeholder finance | `STAKEHOLDER_SMOKE_EMAIL=… STAKEHOLDER_SMOKE_PASSWORD=… bash scripts/verify/stakeholder_finance_sanity.sh` | CI prod PASS; local needs creds |

---

## C. iOS Layer B (operator device / simulator)

Prerequisites:

- [ ] `ios/Config/Secrets.xcconfig` (from `Secrets.xcconfig.example`)
- [ ] Gitignored `ios/Config/.uitest-e2e-credentials` (see `ios/Shared/Sources/Shared/e2e-credentials.env.example`)
- [ ] `.env.pilot` with pilot email/password (never commit)

Run:

```bash
# Layer A — UITest smoke (login surface)
CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh

# Layer B — live pilot E2E (API + optional auto sign-in)
CI_SIGNING_HACK=1 bash ios/scripts/run-ios-e2e-integration-local.sh
```

- [x] Worker UITest smoke PASS (2026-06-16 Layer B)
- [x] Manager UITest smoke PASS (2026-06-16 Layer B)
- [x] Layer B integration PASS — `CI_SIGNING_HACK=1 bash ios/scripts/run-ios-e2e-integration-local.sh`

---

## D. Secrets and accounts (one-time / periodic)

| Secret / account | Where | Action |
|------------------|-------|--------|
| `STAKEHOLDER_SMOKE_EMAIL` / `PASSWORD` | GitHub Actions secrets | Dedicated stakeholder user only — see `docs/security/STAKEHOLDER_SMOKE_ACCOUNT_SETUP_REPORT.md` |
| `PILOT_SMOKE_BEARER_*` | GitHub + Cloudflare | User JWT for ops/metrics; rotate if exposed |
| `CRON_SECRET` | Cloudflare + GitHub | Required for prod `cron-tick` in `pilot_launch.sh` |
| E2E credentials | Local gitignored only | Never bundle in SPM; rotate if ever committed |

---

## E. Closure verdict update

**Complete (2026-06-16):** governance C-03 closed; prod deploy gates green; iOS Layer B PASS; smoke scripts portable on arm64.

Optional ongoing: rotate secrets if exposed; re-run Layer B after major `ios/` changes; local `STAKEHOLDER_SMOKE_*` only if operator wants offline replay (CI prod already blocks on deploy).

---

## References

- Deploy truth: `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md` (§ branch protection)
- C-03 closure criteria: `docs/audit/DEEP_AUDIT_CLOSURE_CHECKLIST.md` (§ 5.1)
- Phase 13 verdict: `docs/product/PHASE13_ROADMAP_CLOSURE.md`
- Stakeholder account: `docs/security/STAKEHOLDER_SMOKE_ACCOUNT_SETUP_REPORT.md`
- iOS E2E: `ios/README.md`
