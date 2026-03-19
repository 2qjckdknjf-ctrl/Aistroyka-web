# Step 9B — Completion Summary

**Date:** 2026-03-18  
**Scope:** Local Build Environment Normalization (closure of Step 9 SWC/native binding caveat).

---

## Outcome

- **Result A (ideal) achieved:** Local `npm run build` passes green. Root cause (missing native binaries for `@next/swc-darwin-x64` and `@swc/core-darwin-x64` after Bun install on darwin-x64) was found and addressed with a minimal, reproducible fix.
- **No refactor, no dependency upgrade spree, no redesign.** Only diagnosis, minimal fix, and documentation.

---

## Root cause (one sentence)

Bun install on darwin-x64 leaves optional native packages `@next/swc-darwin-x64` and `@swc/core-darwin-x64` without their `.node` binaries; next.config load (via next-intl → @swc/core) then fails with "Failed to load native binding."

---

## Fix applied

1. **One-time repair:** Reinstalled `@next/swc-darwin-x64@15.5.12` and `@swc/core-darwin-x64@1.15.18` with `npm install ... --no-save` from repo root so binaries are present.
2. **Guardrail:** Added `scripts/ensure-swc-native.cjs` (runs only on darwin-x64; checks for missing binaries; runs npm install for the two packages when needed) and root `postinstall` script so future `bun install` on the same platform gets binaries restored automatically when missing.
3. **Docs:** Created `docs/build/STEP9B_*.md` (failure inventory, root cause analysis, fix plan, validation report, release confidence decision, post-audit, completion summary).

---

## Validation

- `npm run build` from root: **PASS.**
- next.config.js load and @swc/core load: **OK.**
- No change to CI; no new app/runtime regressions introduced.

---

## Release confidence

- **Local build confidence:** FULL (darwin-x64).
- **CI-only dependency:** NO.
- **Step 9 caveat closed:** YES.

---

## Files created

- `docs/build/STEP9B_FAILURE_INVENTORY.md`
- `docs/build/STEP9B_ROOT_CAUSE_ANALYSIS.md`
- `docs/build/STEP9B_FIX_PLAN.md`
- `docs/build/STEP9B_VALIDATION_REPORT.md`
- `docs/build/STEP9B_RELEASE_CONFIDENCE_DECISION.md`
- `docs/build/STEP9B_POST_AUDIT.md`
- `docs/build/STEP9B_COMPLETION_SUMMARY.md`
- `scripts/ensure-swc-native.cjs`

## Files changed

- `package.json` (added `postinstall` script)
