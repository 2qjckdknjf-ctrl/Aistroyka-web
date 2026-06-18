# LG-1.5 Lint / Volta Root Cause

**Date:** 2026-06-18  
**Sprint:** LG-1.5 Technical Debt Closure

---

## Executive summary

| Question | Answer |
|----------|--------|
| Root cause class | **B — Script wiring** (+ **A — Volta installation** on developer machine) |
| Repo fix applied? | **YES** |
| `bun run lint` with Volta in PATH | **PASS** (post-fix) |
| CI impact | **None** — GitHub Actions uses `oven-sh/setup-bun`, no Volta |

---

## B1. Configuration inspected

| File | Finding |
|------|---------|
| `package.json` (root) | `"lint": "bun run --cwd apps/web lint"` |
| `apps/web/package.json` | Was: `"lint": "eslint app components lib middleware.ts --quiet"` |
| `.tool-versions` | Pins `bun 1.2.15`, `nodejs 22.9.0` (asdf-style; not Volta) |
| Root `package.json` | **No** `"volta"` block |
| `.github/workflows/ci-check.yml` | `bun run lint` on ubuntu-latest with setup-bun |

Volta is **not** a repo dependency. It is an optional developer PATH shim (`~/.volta/bin`).

---

## B2. Failure capture (pre-fix)

With Volta prepended to PATH:

```bash
export PATH="$HOME/.volta/bin:$HOME/.bun/bin"
cd /Users/alex/Projects/AISTROYKA && bun run lint
```

```
$ eslint app components lib middleware.ts --quiet
Volta error: Could not execute command.
Error cause: Bad CPU type in executable (os error 86)
error: script "lint" exited with code 126
```

Volta log (`~/.volta/log/volta-error-*.log`):

```
"node" ".../node_modules/.bin/eslint" "app" "components" "lib" "middleware.ts" "--quiet"
Error cause: Bad CPU type in executable (os error 86)
```

Same failure mode for `tsc` via `packages/contracts` build when Volta intercepts `node` for `node_modules/.bin/*` shims.

---

## B3. Root cause

**Primary:** Volta v2.0.2 intercepts `node` and routes `node_modules/.bin/eslint` (and `tsc`) through its shim. On this arm64 Mac, the resolved binary is **x86_64** → `Bad CPU type in executable (os error 86)`.

**Secondary (repo):** Scripts invoked bare `eslint` / `node`, which always traverse Volta when `~/.volta/bin` is first in PATH.

Classification:

| Option | Applies |
|--------|---------|
| A. Volta installation issue | **YES** — arch mismatch on local Volta node/toolchain |
| B. Script wiring issue | **YES** — bare `eslint`/`node` shims Volta-sensitive |
| C. Dependency issue | No |
| D. Repo logic issue | No |

---

## B4. Repo fixes applied

### `apps/web/package.json` — lint

```diff
- "lint": "eslint app components lib middleware.ts --quiet",
+ "lint": "bun ../../node_modules/eslint/bin/eslint.js app components lib middleware.ts --quiet",
```

`bun` executes ESLint without routing through Volta's `node` shim.

### `apps/web/package.json` — check:design

```diff
- "check:design": "node scripts/check-raw-colors.mjs",
+ "check:design": "bun scripts/check-raw-colors.mjs",
```

### `packages/contracts/package.json` — build (toolchain hardening)

```diff
- "build": "tsc -p tsconfig.json",
+ "build": "bun ../../node_modules/typescript/bin/tsc -p tsconfig.json",
```

Prevents Volta from breaking `bun run build:contracts` on Volta-first PATH.

**Note:** `next build` still fails under Volta-first PATH (Next CLI uses `node` shim). CI and recommended local PATH (`$HOME/.bun/bin` before Volta) are unaffected. Documented workaround: `export PATH="$HOME/.bun/bin:/usr/bin:/bin"` or remove Volta from PATH.

---

## B5. Validation results

| Command | PATH | Result |
|---------|------|--------|
| `bun run lint` | Volta first | **PASS** (post-fix) |
| `bun ../../node_modules/eslint/bin/eslint.js ...` | Volta first | **PASS** |
| `eslint ...` (bare) | Volta first | **FAIL 126** (pre-fix behavior) |
| `bun run lint` | Bun first, no Volta | **PASS** |
| CI `bun run lint` | ubuntu + setup-bun | **PASS** (no Volta) |

---

## Acceptance

**Option A satisfied:** `bun run lint` **PASS** with Volta in PATH after repo script fix.

External Volta arch mismatch remains a local environment concern for tools not yet migrated to `bun`-direct invocation (`next build`). Mitigation documented in `AGENTS.md` PATH guidance.
