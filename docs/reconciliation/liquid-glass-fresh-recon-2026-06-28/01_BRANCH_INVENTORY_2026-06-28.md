# 01 — Branch Inventory (LG / Design candidates)

**Date:** 2026-06-28  
**Base main:** `d54278c680162cf8af598466fda1d72dc9c733dc`

`behind / ahead` = commits on main not on branch / commits on branch not on main
(`git rev-list --left-right --count origin/main...<branch>`).

---

## Open PRs at recon time

| PR | Branch | Base | Status | Relation to LG |
|----|--------|------|--------|----------------|
| **#148** | `evidence/android-debug-instrumented-2026-06-26` | main | OPEN, `BEHIND`, REVIEW_REQUIRED | **Android evidence — keep SEPARATE from LG** |
| #119 | `cursor/critical-bug-investigation-66e8` | main | OPEN | Invite provisioning fix — not LG |
| **#108** | `design/liquid-glass-public-shell-lg2a` | main | OPEN, REVIEW_REQUIRED | **LG public site redesign** |
| #106 | `ai/expert-review-queue-mvp` | main | OPEN | ai-flywheel — not LG |
| #104 | `ai/gold-memory-mvp` | main | OPEN | ai-flywheel — not LG |
| #103 | `ai/flywheel-final-tail-closure` | main | OPEN | ai-flywheel — not LG |

**PR #148 is still OPEN** → do not mix with LG. No open *deploy* PRs. The
ai-flywheel PRs (#103/#104/#106) are risky broad-merge candidates and unrelated to LG.

---

## Liquid Glass candidate branches

| Branch | Tip SHA | Last commit | behind / ahead | Footprint | Risk |
|--------|---------|-------------|----------------|-----------|------|
| `origin/release/web-pilot-rc` | `9d6a7812` | 2026-06-20 | **81 / 23** | 269 files: `apps/web` (185) + `docs/design` (81) + 1 script + contracts + package.json | **SAFE_CANDIDATE (source for re-slice)** |
| `origin/design/liquid-glass-public-shell-lg2a` (PR #108) | `68be705a` | 2026-06-19 | 86 / 38 | 349 files: `apps/web` (164) + `docs/ai-flywheel` (72) + `ios` (7) + `scripts/ai` | **MANUAL_REVIEW_REQUIRED** |
| `feature/unified-product-design-certification` (local only) | `38e0d705` | 2026-06-20 | 86 / 50 | 721 files: `apps/web` (281) + ios + android + flywheel + scripts/smoke + architecture | **DO_NOT_BROAD_MERGE** |

Notes:
- `feature/unified-product-design-certification` exists **only locally** (not on origin).
- `origin/release/web-pilot-rc` is the previously-curated **web-only** LG branch:
  no `ios/`, no `android/`, no `ai-flywheel/`, no API routes. It is the cleanest
  source — but it is **81 commits behind main** and its `package.json` diffs are
  **stale tooling reverts** (see `03`), so it must be **re-sliced on fresh main**,
  not merged as-is.

---

## Risk classification

| Branch | Classification | Reason |
|--------|----------------|--------|
| `origin/release/web-pilot-rc` | **SAFE_CANDIDATE** | Web-only LG; no API/auth/middleware/mobile/flywheel; but stale → re-slice |
| `origin/design/liquid-glass-public-shell-lg2a` | **MANUAL_REVIEW_REQUIRED** | Mixes ai-flywheel + iOS into LG; PR #108 open |
| `feature/unified-product-design-certification` | **DO_NOT_BROAD_MERGE** | 721 files across web + iOS + Android + flywheel + architecture |
