# Step 9B — Post-Audit

**Date:** 2026-03-18

---

## 1. Root cause identified?

**YES.** Bun install on darwin-x64 does not extract native binaries for optional packages `@next/swc-darwin-x64` and `@swc/core-darwin-x64`. The failure surfaced when loading next.config.js (next-intl plugin → @swc/core → native binding).

---

## 2. Local build fixed?

**YES.** Reinstalling the two packages with npm from root restored the binaries; `npm run build` completes successfully. Postinstall script `scripts/ensure-swc-native.cjs` added to restore binaries on darwin-x64 when missing after any future `bun install`.

---

## 3. Local build confidence

**FULL** (on darwin-x64).

---

## 4. Step 9 caveat closed?

**YES.**

---

## 5. Release validation rule now

**CI + local.** Release can rely on CI green and, where applicable, local `npm run build` green on darwin-x64. No longer CI-only.

---

## 6. Remaining P1

None.

---

## 7. Remaining P2

- **Darwin-arm64:** If the same Bun behavior affects Apple Silicon, extend `ensure-swc-native.cjs` to handle darwin-arm64 (optional follow-up).
- **Documentation:** Ensure any release/runbook that referenced "local build not confirmed" is updated to reflect Step 9B closure (done in this doc set).

---

## 8. Repo free of the Step 9 release-confidence caveat?

**YES.** The caveat is closed; release confidence no longer has an open SWC/native binding caveat for local build on the diagnosed platform.
