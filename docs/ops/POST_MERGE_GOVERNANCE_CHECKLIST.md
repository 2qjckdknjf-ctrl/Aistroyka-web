# Post-merge governance checklist (operators)

**Date:** 2026-06-15  
**Context:** PR #76 merged to `main`; prod build `cd130eb` (PR #83 hotfix included). Phase 13 verdict: **CONDITIONAL YES**.  
**Primary blocker:** **C-03** — branch protection / required checks not provable from repo API.

Repo: [2qjckdknjf-ctrl/Aistroyka-web](https://github.com/2qjckdknjf-ctrl/Aistroyka-web)

---

## Quick status (2026-06-15)

| Item | Status | Notes |
|------|--------|-------|
| PR #76 on `main` | **DONE** | Manager AI parity, i18n fix, E2E secrets hygiene |
| Staging + prod deploy | **DONE** | Runs `27528576940` / `27528720688`; docs PR #84 redeployed |
| `CI Check` on PRs | **PASS** (when run) | Not yet **required** for merge |
| `main` branch protection | **OPEN** | API: `branches/main/protection` → **404**; repo rulesets → `[]` |
| Stakeholder sanity (CI prod) | **PASS** | Blocking job in prod deploy |
| Stakeholder sanity (local) | **BLOCKED** | Needs `STAKEHOLDER_SMOKE_*` (not in `.env.pilot`) |
| iOS Layer B live E2E | **OPEN** | Operator simulator/device + `.uitest-e2e-credentials` |

---

## A. GitHub branch protection (C-03) — **do this first**

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

- [ ] Worker UITest smoke PASS
- [ ] Manager UITest smoke PASS
- [ ] Layer B integration PASS (attach log path to `docs/publication-readiness/IOS_RUNTIME_SMOKE_REPORT.md` if publishing)

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

When **A.3–A.6** are complete:

1. C-03 → **closed** in `docs/audit/DEEP_AUDIT_RISK_REGISTER.md`
2. Phase 13 governance row → **PASS** in `docs/product/PHASE13_ROADMAP_CLOSURE.md`
3. Optional: run **Release GO/NO-GO Council** workflow (`workflow_dispatch`) for formal sign-off

**Enterprise GA** still requires: iOS Layer B proof, branch protection proof, and P2 hygiene from `docs/audit/AUDIT_2026-06-11_full-project-audit-v2.md`.

---

## References

- Deploy truth: `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md` (§ branch protection)
- C-03 closure criteria: `docs/audit/DEEP_AUDIT_CLOSURE_CHECKLIST.md` (§ 5.1)
- Phase 13 verdict: `docs/product/PHASE13_ROADMAP_CLOSURE.md`
- Stakeholder account: `docs/security/STAKEHOLDER_SMOKE_ACCOUNT_SETUP_REPORT.md`
- iOS E2E: `ios/README.md`
