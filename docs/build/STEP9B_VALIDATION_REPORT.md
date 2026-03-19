# Step 9B — Validation Report

**Date:** 2026-03-18  
**Purpose:** Verification after minimal fix for SWC/native binding local build.

---

## 1. Commands run

| Step | Command | Result |
|------|--------|--------|
| Fix applied | Reinstalled `@next/swc-darwin-x64@15.5.12` and `@swc/core-darwin-x64@1.15.18` via npm (--no-save) from root | OK |
| Full build | `npm run build` from repo root | **PASS** (exit code 0) |
| Config load | `node -e "require('./next.config.js'); console.log('config loaded');"` from apps/web | OK |
| SWC load | `node -e "require('@swc/core');"` from root | OK |

---

## 2. Environment summary

| Item | Value |
|------|--------|
| OS | Darwin |
| Arch | x86_64 |
| Node | v20.20.0 |
| npm | 10.8.2 |
| Bun | 1.2.15 |
| Package manager for install | Bun (root); postinstall runs ensure-swc-native.cjs |

---

## 3. Build result

- **npm run build:** Completed successfully. Next.js 15.5.12 built 276 static pages, compiled successfully, lint and type check passed.
- **Fresh install path:** Not re-tested in this run (fix was applied to existing node_modules). Postinstall script added so that a future `bun install` on darwin-x64 will run the guardrail and restore binaries if missing.
- **tsc --noEmit:** Not run separately; Next build includes "Linting and checking validity of types" and passed.

---

## 4. Remaining caveats

- **Darwin-arm64 (Apple Silicon):** Script only handles darwin-x64. On M1/M2, the relevant packages are `@next/swc-darwin-arm64` and `@swc/core-darwin-arm64`; if Bun has the same issue there, the script could be extended later (out of scope for this step).
- **CI:** Unchanged; still uses `bun install --frozen-lockfile` on Linux; no change required.

---

## 5. Confidence level

- **Local build (darwin-x64):** **FULL** after applying the fix and with postinstall in place.
- **Reproducibility:** **HIGH** — root cause documented, minimal fix applied, postinstall ensures future `bun install` on same platform gets binaries restored when missing.
