# Step 9B — Fix Plan

**Date:** 2026-03-18  
**Purpose:** Minimal corrective path for SWC/native binding local build.

---

## 1. Allowed fix types (from task)

- Normalize package manager usage where needed  
- Repair install/build script path  
- Fix optional dependency/install flow  
- Fix local dependency state in a controlled way  
- Add guardrail scripts/docs if truly needed  

**Not allowed without strong justification:** broad Next upgrade, broad package churn, deleting repo state blindly, changing unrelated runtime architecture.

---

## 2. Chosen approach

**Guardrail: postinstall script that ensures native SWC binaries on darwin-x64.**

- **Problem:** After `bun install` on darwin-x64, `@next/swc-darwin-x64` and `@swc/core-darwin-x64` can be present without their `.node` files.  
- **Fix:** From repo root, on platform darwin and arch x64 only:
  - If `@next/swc-darwin-x64` is present but `next-swc.darwin-x64.node` is missing → run `npm install @next/swc-darwin-x64@<version> --no-save` (version from `next/package.json` or lockfile).
  - If `@swc/core-darwin-x64` is present but `swc.darwin-x64.node` is missing → run `npm install @swc/core-darwin-x64@<version> --no-save` (version from `@swc/core/package.json`).
- **Why minimal:**  
  - No change to CI (Linux unaffected).  
  - No upgrade of Next or next-intl.  
  - Single script, run only on darwin-x64, only when binaries are missing.  
  - Reproducible: “bun install” then “npm run build” works after postinstall.

**Alternative considered:** Normalize root install to npm. Rejected for this step: CI and docs use Bun; normalizing would require CI and doc updates and broader change; guardrail is sufficient to close the caveat.

---

## 3. Implementation checklist

- [x] Add `scripts/ensure-swc-native.cjs`: detect darwin-x64, check for missing binaries, run npm install for the two packages with version read from existing package.json.
- [x] Add root `package.json` script: `"postinstall": "node scripts/ensure-swc-native.cjs"`.
- [x] Keep root `optionalDependencies` for `@next/swc-darwin-x64` (already present); no need to add `@swc/core-darwin-x64` at root (it’s transitive from next-intl).
- [x] Document (see STEP9B_COMPLETION_SUMMARY and this file): On macOS (darwin) x64, if local build fails with "Failed to load native binding", run from root `npm run build` (postinstall will fix native packages). Manual one-time: `npm install @next/swc-darwin-x64@$(node -p "require('./node_modules/next/package.json').version") @swc/core-darwin-x64@$(node -p "require('./node_modules/@swc/core/package.json').version") --no-save`.

---

## 4. What we do not change

- Next.js or next-intl versions  
- next.config.js or plugin usage  
- CI workflow (bun install --frozen-lockfile)  
- Lockfiles (no forced npm lockfile; script uses npm only for the two packages, --no-save)
