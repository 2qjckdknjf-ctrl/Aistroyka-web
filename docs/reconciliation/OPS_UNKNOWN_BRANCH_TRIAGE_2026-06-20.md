# Ops / Unknown Branch Triage — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

## chore/phase13-operator-refresh

- Ref reviewed: `chore/phase13-operator-refresh`
- Ahead/behind: 1 ahead, 18 behind
- Last commit: `72ef0222` — `chore: operator tooling, legacy API inventory, doc refresh`
- Changed files:
  - `apps/web/app/api/tenant/members/route.ts`
  - `docs/audit/DEEP_AUDIT_RISK_REGISTER.md`
  - `docs/audit/LEGACY_API_SURFACE_INVENTORY.md`
  - `docs/ops/POST_MERGE_GOVERNANCE_CHECKLIST.md`
  - `docs/product/PHASE13_ROADMAP_CLOSURE.md`
  - `ios/README.md`
  - `scripts/smoke/check_pilot_prereqs.sh`
  - `scripts/verify/stakeholder_finance_sanity.sh`

### Determination
- What it contains: operator tooling, legacy API inventory, post-merge governance docs, iOS README updates, pilot prerequisite smoke updates, stakeholder finance sanity verification, and one tenant members API route change.
- Real work or accidental/test branch: Real work.
- Touches production configs: NO direct deployment config.
- Touches migrations: NO.
- Touches docs only: NO, includes tenant API and scripts.
- Should be ignored: NO, but not as a full merge.

### Decision
- Risk: P0 because it touches tenant/API/security-sensitive behavior.
- Decision: `manual_review_again`.
- Integration method: split into docs/scripts candidates and tenant API route review. Do not merge branch wholesale.
- Reasoning: Useful operator docs and verification scripts may be recoverable, but the tenant members route must be compared against current main auth/tenant behavior.

## cursor-test

- Ref reviewed: `origin/cursor-test`
- Ahead/behind: 0 ahead, 490 behind
- Last commit: `3d88f1ba` — 2026-03-15 — `fix(vercel): update install command to include dev dependencies for Vercel build`
- Changed files relative to `origin/main`: none

### Determination
- What it contains: no commits ahead of main.
- Real work or accidental/test branch: stale/test branch.
- Touches production configs: NO relative to main.
- Touches migrations: NO.
- Touches docs only: NO changes ahead.
- Should be ignored: YES.

### Decision
- Risk: P3.
- Decision: `ignore_archive`.
- Integration method: none.
- Reasoning: Branch is stale, behind main by 490 commits, and has no unique work to recover.

## Ops/Unknown Conclusion
- `chore/phase13-operator-refresh` may contain useful governance/smoke/docs work, but needs manual split review because it touches tenant API behavior.
- `cursor-test` should be ignored/archived after owner confirmation.
