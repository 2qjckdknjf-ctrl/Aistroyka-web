# Build report: Cloudflare cf:build (Phase 1)

**Date:** 2026-03-05  
**Purpose:** Repo build invariants and green `cf:build` for OpenNext/Workers.

---

## 1. Build order (monorepo)

- **Root:** `bun run build` → `build:contracts` then `build:web`.
- **cf:build:** Root `bun run cf:build` → `build:contracts` then `bun run --cwd apps/web cf:build`.
- **apps/web cf:build:** Next (standalone) → fix-standalone → ensure-styled-jsx-dist → opennextjs-cloudflare build.

Internal package `@aistroyka/contracts` is dist-only; root scripts enforce order.

---

## 2. Commands run

| Step | Command | Result |
|------|---------|--------|
| Install | `bun install --frozen-lockfile` (root) | OK |
| Build | `bun run build` (root) | OK (contracts + Next 15.5.12) |
| CF build | `bun run cf:build` (root) | OK (after styled-jsx fix) |
| Tests | `cd apps/web && bun run test` | OK (61 files, 294 tests) |

---

## 3. OpenNext / styled-jsx fix

**Error (before fix):** During “Bundling the OpenNext server”, esbuild failed:

```text
Could not resolve "./dist/index"
.open-next/node_modules/styled-jsx/index.js:1:25:
  1 │ module.exports = require('./dist/index')
```

**Cause:** In a bun monorepo, `styled-jsx` is hoisted to root with full `dist/`; the copy under `apps/web/node_modules/styled-jsx` (or the one OpenNext uses) can lack `dist/`, so the bundle fails.

**Fix (minimal):**

1. **Script:** `apps/web/scripts/ensure-styled-jsx-dist.cjs` — before `opennextjs-cloudflare build`, copies `../../node_modules/styled-jsx/dist` into `apps/web/node_modules/styled-jsx/dist` when missing.
2. **cf:build:** Insert step: `node scripts/ensure-styled-jsx-dist.cjs` after `fix-standalone-for-opennext.cjs` and before `opennextjs-cloudflare build --skipNextBuild`.

No dependency pins or wrangler flags changed. No `serverExternalPackages` change (would require runtime styled-jsx on Workers).

---

## 4. Artifacts

- **Next:** `.next/standalone` (with symlink for monorepo trace root).
- **OpenNext:** `apps/web/.open-next/worker.js`, `apps/web/.open-next/assets`.
- **Verification:** `.open-next/worker.js` exists after cf:build; CI uses same commands from root.

---

## 5. Invariants for CI

- Single install from repo root: `bun install --frozen-lockfile`.
- No `npm install` (or install) inside `apps/web` in CI.
- Build: `bun run cf:build` (from root).
- Deploy/verify steps run with `working-directory: apps/web` where needed (e.g. wrangler deploy, check `.open-next/worker.js`).

---

## 6. Status

- **Phase 1:** Complete. `cf:build` is green locally; tests pass. Ready for Phase 2 (Cloudflare build settings doc) and subsequent phases.
