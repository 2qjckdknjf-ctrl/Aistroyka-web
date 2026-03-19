# Step 9B — Failure Inventory

**Date:** 2026-03-18  
**Purpose:** Exact picture of local build failure (SWC / native binding) for closure hardening.

---

## 1. Failing command(s)

| Command | Context | Result |
|--------|---------|--------|
| `npm run build` | From repo root | FAIL |
| `bun run build` | From repo root | FAIL (same flow) |
| `bun run build:web` | Root → cwd apps/web, then `next build` | FAIL |
| `next build` | From apps/web (via npx or node ../../node_modules/.bin/next) | FAIL |

**Exact flow when running `npm run build`:**
1. Root `build` script: `bun run build:contracts && bun run build:web`
2. `build:contracts`: OK (packages/contracts tsc)
3. `build:web`: `bun run --cwd apps/web build` → apps/web prebuild (`cd ../.. && bun run build:contracts:npm`) → OK → `next build` → **FAIL**

---

## 2. Exact failure area

- **Where:** During **loading of `next.config.js`**, before Next.js build starts.
- **Trigger:** `next.config.js` uses `createNextIntlPlugin("./i18n/request.ts")` (next-intl). The next-intl plugin loads `@swc/core`, which loads a **platform-specific native binding**.
- **Error text:**  
  `Failed to load next.config.js, see more info here https://nextjs.org/docs/messages/next-config-error`  
  `[Error: Failed to load native binding] { [cause]: [Array] }`

**Cause chain (from reproduced stack):**
1. `next.config.js` → `next-intl` plugin → `@swc/core` → `@swc/core/binding.js` → `requireNative`
2. `@swc/core` tries, in order:  
   - `./swc.darwin-universal.node` (in @swc/core) — MODULE_NOT_FOUND  
   - `@swc/core-darwin-universal` — MODULE_NOT_FOUND  
   - `./swc.darwin-x64.node` (in @swc/core) — MODULE_NOT_FOUND  
   - `@swc/core-darwin-x64` — **package present but** `swc.darwin-x64.node` **file missing** (MODULE_NOT_FOUND: "Please verify that the package.json has a valid \"main\" entry")

**Secondary (fixed earlier in diagnosis):** Next.js’ own `@next/swc-darwin-x64` also had only `package.json` + README; `next-swc.darwin-x64.node` was missing. Same pattern: optional native package directory present, binary not extracted.

---

## 3. Environment / package-manager context

| Item | Value |
|------|--------|
| **OS** | Darwin (macOS) |
| **Arch** | x86_64 (x64) |
| **Node** | v20.20.0 |
| **npm** | 10.8.2 |
| **Bun** | 1.2.15 |
| **Package manager (root install)** | Bun (`packageManager: "bun@1.2.15"`) |
| **Lockfiles** | Root: `bun.lock`, `package-lock.json`; apps/web: `package-lock.json` |
| **CI** | Linux (e.g. ubuntu); uses `bun install --frozen-lockfile`; build green (Linux uses `@next/swc-linux-*` / `@swc/core-linux-*`, not darwin) |

**Relevant dependency shape:**
- Root: `next` ^15.1.0, `optionalDependencies`: `@next/swc-darwin-x64` ^15.5.12.
- next-intl (apps/web) → `@swc/core` (optional deps include `@swc/core-darwin-x64`).
- Failure: **not** Next’s SWC in the first place, but **next-intl → @swc/core → @swc/core-darwin-x64**; and separately **@next/swc-darwin-x64** was also missing its binary.

---

## 4. Where failure happens (classification)

- [x] During next.config load (config file require chain)
- [x] Via SWC native load — **@swc/core** (used by next-intl plugin), not only Next’s built-in SWC
- [ ] During dependency resolution (resolution OK)
- [x] Optional native package install / extract — **binaries not present** in optional packages on darwin-x64 after Bun install
- [ ] Monorepo package linking (not the cause)

---

## 5. Evidence summary

- Reproduced by loading `next.config.js` in Node: same “Failed to load native binding” with cause array pointing to `@swc/core-darwin-x64` and missing `swc.darwin-x64.node`.
- `node_modules/@swc/core-darwin-x64/` contained only `README.md` and `package.json` (no `.node` file) before fix.
- `node_modules/@next/swc-darwin-x64/` contained only `README.md` and `package.json` (no `next-swc.darwin-x64.node`) before fix.
- After reinstalling `@next/swc-darwin-x64@15.5.12` and `@swc/core-darwin-x64@1.15.18` with **npm** (from root), both binaries appeared and `next build` completed successfully.
