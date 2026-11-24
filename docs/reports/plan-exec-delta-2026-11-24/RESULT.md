# Plan execution — Codex/Cursor delta 2026-11-24

## Inputs

| Item | Value |
|---|---|
| Planning branch | `origin/roadmap/weekly-ai-reconciliation-2026-11-10` (PR #488) |
| Implementation branch | `cursor/plan-exec-delta-2026-11-24` |
| Worktree | `/Users/alex/Projects/AISTROYKA-plan-exec-2026-11-24` |
| Base | `origin/main` @ `3878624006a2b6b9f2b3aaab747c3096232f59ae` (#506) |
| Open PRs reviewed | #488 (roadmap), #501, #503, #504, #505 |

## Gap matrix (summary)

Updated tables in:

- `docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md` → § Execution status — Cursor 2026-11-24
- `docs/roma/ROMA_EXECUTION_ASSURANCE_PLAN_2026-09-23.md` → § Execution status — Cursor 2026-11-24

Statuses used: `IMPLEMENTED` / `PARTIAL` / `MISSING` / `BLOCKED`. Nothing marked DONE without independent review + merge evidence.

## Code / config landed this branch

### P0

1. Pre-egress secret detection (`secret-detection.ts`) + `runPolicy` rule `secret_detected`
2. `AI_PROVIDER_ALLOWLIST` filter in vision provider router
3. Fail-closed `AI_FALLBACK_ON_ERROR` default in tenant AI preferences (+ unit tests)
4. GET peer-isolation tests for `GET /api/v1/reports/:id`
5. CI Gitleaks workflow (OSS CLI v8.30.1, Apache-2.0) + `.gitleaks.toml` allowlist for known FP/synthetic fixtures

### P1 (confirmed gaps)

6. `.github/dependabot.yml` — npm (root), github-actions, android/gradle weekly
7. D10 supplier fixture negatives — VAT / unit / price drift / malicious catalog flags; lost-ACK + duplicate idempotency rehearsal; forbidden buyer role helper (portal/stakeholder/customer denied)

## Tests (reproducible)

```sh
cd /Users/alex/Projects/AISTROYKA-plan-exec-2026-11-24
bun install --frozen-lockfile
cd apps/web
bunx vitest run \
  lib/platform/ai-governance/secret-detection.test.ts \
  lib/platform/ai-governance/policy.service.test.ts \
  lib/platform/ai/providers/provider.router.test.ts \
  lib/platform/ai/routing/tenant-ai-preferences.test.ts \
  'app/api/v1/reports/[id]/route.test.ts'
```

**Result:** see `vitest.log` (expect 5 files / 43 tests pass after preferences suite).

```sh
# Gitleaks tree scan (local binary v8.30.1)
gitleaks detect --source . --no-git --config .gitleaks.toml --redact --exit-code 1
```

**Result:** `no leaks found` (log: `gitleaks-no-git.log`). Full-history scan still surfaces 9 legacy example JWTs/test keys — OWNER_GATE cleanup; CI uses tree + PR-range only.

## Aikido

`aikido_scan_paths` on changed TS sources: **0 issues**.

## Merge

| Item | Value |
|---|---|
| PR | #507 MERGED |
| merge_sha | `030e089ab0bd80ff2a4dbb64466daa029c2c8446` |
| head_sha | `9c9f1eda9ed82b54ef620a64c465ed76873f4cab` |
| review | non-author APPROVED (`6262265-cpu`) |

## CI on PR #507 (HEAD `704f77a3`)

| Check | Conclusion |
|---|---|
| CI Check (`check`) | SUCCESS |
| Gitleaks | SUCCESS |
| Cursor Security Agent | SUCCESS |
| Workers Builds | SUCCESS |

## Not DONE / remaining blockers

| Item | Status |
|---|---|
| Independent non-author review / merge | pending (`REVIEW_REQUIRED`) |
| Production deploy | not authorized |
| D3a inference retention / vendor ZDR | BLOCKED OWNER_GATE |
| D3b tenant-scoped AI credentials / rotation | BLOCKED OWNER_GATE |
| Full-history gitleaks cleanup | OWNER_GATE (no history rewrite) |
| Dependabot GitHub feature enablement | OWNER_GATE if org setting off |
| D7/D9/D11/D12 research vendors | RESEARCH_ONLY — no installs |
| D10 supplier VAT/injection fixtures | PARTIAL→code landed (review pending) |
| Real FCM / aps-environment (mobile) | OWNER_GATE (separate mobile WT) |

## Cost

Local agent compute only; no paid vendor API calls; synthetic tokens only in tests.

## License / compatibility notes

| Tech | Decision |
|---|---|
| Gitleaks CLI 8.30.1 | Apache-2.0; pinned release; no gitleaks-action license key |
| Dependabot | GitHub-native; no new runtime dependency |
| OmniEVIE / GLM / Monitor / Claude Ship / Strands / LangSmith | RESEARCH_ONLY — not installed |
