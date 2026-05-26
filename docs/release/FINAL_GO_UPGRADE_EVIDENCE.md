# FINAL GO UPGRADE EVIDENCE

Date: 2026-05-22  
Project: AISTROYKA

## Stage A — Scope control

- `git branch --show-current`: `release/publication-readiness-mega-sprint`
- `git rev-parse --short HEAD`: `d7176a96`
- `git status --short`: only `AGENTS.md` is modified before this sprint work.
- `git diff --stat`: only `AGENTS.md` (1 insertion, 1 deletion) before this sprint work.

### AGENTS.md handling decision

- `AGENTS.md` is treated as unrelated to final GO upgrade closure scope.
- It is intentionally left uncommitted unless explicitly required later.
- No deletion/rewrite was performed.

## Stage B — Strict pilot smoke env closure

- Script inspected: `scripts/smoke/check_pilot_prereqs.sh`, `scripts/smoke/pilot_launch.sh`.
- Runbook added: `docs/release/STRICT_PILOT_SMOKE_ENV_RUNBOOK.md`.
- Validation command:

```bash
SMOKE_EMAIL=<stakeholder_smoke_email> \
SMOKE_PASSWORD=<stakeholder_smoke_password> \
NEXT_PUBLIC_SUPABASE_URL=https://vthfrxehrursfloevnlp.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key> \
bun run smoke:pilot:check --strict
```

- Result: **PASS** for strict metrics-auth gate.
- Remaining non-strict gaps: `E2E_EMAIL`, `E2E_PASSWORD`, `PLAYWRIGHT_BASE_URL`, `SUPABASE_ACCESS_TOKEN`.

## Stage C — iOS full runtime transaction proof

- Automated simulator smoke re-run:

```bash
CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh
```

- Result: PASS for worker+manager login-surface smoke.
- Closure status: **OPERATOR_REQUIRED** for full transaction-chain proof (submit/review/resubmit).
- Added:
  - `docs/release/IOS_FULL_RUNTIME_PROOF_RUNBOOK.md`
  - `docs/release/IOS_FULL_RUNTIME_PROOF.md`

## Stage D — AI provider-backed non-fallback validation

- Evidence reviewed from AI SLO run `26219023147`.
- Observed:
  - `analyze-image OK (degraded fallback=provider_unavailable)`
  - `copilot stream OK (done received)`
- Result: **PARTIAL / OPERATOR_REQUIRED** (non-fallback analyze-image not proven).
- Added: `docs/release/AI_PROVIDER_BACKED_VALIDATION.md`.

## Stage E — Legal/signoff docs

- Created `docs/06_PRIVACY_LEGAL_STATUS.md` with truthful statuses (`IN_PROGRESS` / `OPERATOR_REQUIRED`).
- Created `docs/_operator/release-signoff-template.md` with named signoff checklists and signature/date fields.

## Stage F — Android publication decision

- Decision set to: **DEFER_ANDROID_PUBLICATION**.
- Evidence basis: deferred track policy + missing publish-ready runtime/store evidence.
- Reflected in `docs/release/FINAL_OPERATOR_ONLY_CHECKLIST.md`.

## Stage G — Final gate rerun

- `bun run lint`: PASS
- `bunx tsc -p apps/web/tsconfig.json --noEmit`: PASS
- `bun run test`: PASS (`1452` tests)
- `bun run build:contracts`: PASS
- `bun run build:web`: PASS (after script compatibility fix in root `package.json`)
- `bun run cf:build`: PASS
- Migration sanity (`list_migrations` on Supabase project `vthfrxehrursfloevnlp`): PASS
- `bun run release:check`: PASS_WITH_WARNINGS
- `scripts/verify/stakeholder_finance_sanity.sh`: PASS
- `bun run smoke:pilot:check --strict`: PASS (strict auth path), with non-strict warnings for missing `E2E_*` and `SUPABASE_ACCESS_TOKEN`
- Final council replay:
  - run `26273351280`: PASS

## Stage H — GO upgrade decision test

- GO criteria not fully satisfied for full public multi-platform launch due unresolved operator/runtime/legal closures:
  1. iOS full runtime transaction proof not completed.
  2. AI provider-backed non-fallback analyze-image path not proven.
  3. Legal/release signatures pending.
  4. Android explicitly deferred for publication.

- Final decision remains: **CONDITIONAL GO** (no forced upgrade to GO without evidence).

