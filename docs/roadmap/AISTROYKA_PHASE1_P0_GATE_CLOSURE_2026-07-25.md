# Phase 1 Closure — P0 Dependencies, Security Headers, Design Gate

**Phase:** 1 — P0 deps / security headers / design gate  
**Repo:** `/Users/alex/Projects/AISTROYKA`  
**Date:** 2026-07-25  
**Correction pass:** 2026-07-25 (static headers + full npm audit + brace-expansion dual-path)  
**Branch:** `security/platform-admin-separation`  
**Baseline (Phase 0):** `docs/roadmap/AISTROYKA_BASELINE_FREEZE_2026-07-25.md` (accepted; not re-litigated)  
**HEAD:** `7855fb1641b7511b24f98d7ad652a0c674dae8f7`  
**Bun:** `1.2.15` (unchanged)

---

## Verdict

| Field | Value |
| --- | --- |
| **Phase 1** | **YES** (after correction pass) |
| Temporary pre-correction verdict | **NO** (static header regression + full `npm audit` findings + Bun-only patch risk) |
| Next phase allowed? | **YES** — Phase 2 may start in a **new** session only |
| Production deploy claimed? | **NO** — source + local runtime closure only |

---

## 0. Correction audit (why Phase 1 was reopened)

External review rejected the first YES for three risks:

1. **Static header regression** — removing all `next.config.js` `headers()` left `/_next/*`, `favicon.ico`, and public image extensions without HSTS/`nosniff` (middleware matcher excludes them).
2. **Full `npm audit`** — `--omit=dev` was 0, but full audit still had 6 findings (`esbuild`, `js-yaml`, `undici`, `ws`, `wrangler`, `miniflare`).
3. **`brace-expansion` Bun patch** — `patchedDependencies` is Bun-only; npm/Vercel would not apply it.

No Phase 0 evidence was re-litigated. Prior Phase 1 design-token and Next 15.5.21 work was preserved (not rolled back).

---

## 1. Pre-implementation audit (original Phase 1)

### 1.1 Working tree (preserved)

- Dirty tracked at start: `AGENTS.md`, `docs/audits/ROMA_VENDOR_DEPENDENCY_AUDIT.md`, `package-lock.json`
- Pre-existing `package-lock.json` diff (`packages/roma-kernel` workspace + `@axe-core/playwright`) **preserved and extended**
- Untracked QA/launch/roadmap docs left untouched (not deleted)

### 1.2 Baseline confirmation (Phase 0)

| Gate | Observed at original audit |
| --- | --- |
| `npm audit --omit=dev` | **6** vulnerabilities (**5** high, **1** low) |
| `check:design` | exit 1 — reported **1** hit |
| Independent `rg` raw-color inventory | **9** hits in **4** files |
| Security headers | Dual emission via `next.config.js` `headers()` **and** `middleware.ts` |

---

## 2. Route ownership matrix (correction)

| Surface | Owner | Profile |
| --- | --- | --- |
| HTML pages | **middleware** | page (full CSP + XFO + Permissions + Referrer + nosniff; HSTS in prod) |
| Page / auth redirects / early denials | **middleware** | page |
| `/api/v1/*` | **middleware** | api (no CSP; HSTS in prod) |
| Legacy `/api/*` | **middleware** | api |
| `/_next/*` (static, image, etc.) | **next.config.js** narrow sources only | static (nosniff; HSTS in prod) |
| `/favicon.ico` | **next.config.js** | static |
| Public `svg/png/jpg/jpeg/gif/webp` | **next.config.js** | static |
| Middleware early API 403/503 | **middleware** | api |
| OpenNext CF API middleware bypass | **worker-bootstrap.js** (unchanged) | api keys only; CF-only path |

**Non-overlap rule:** `next.config.js` must never use `/:path*` or `/api/*` sources. Middleware matcher continues to exclude `_next/`, `favicon.ico`, and image extensions so static never runs auth/session/intl.

---

## 3. Changes Made

### 3.1 Original Phase 1 (retained)

- Next **15.5.21**, postcss/sharp/form-data/brace-expansion/body-parser production audit closure
- Design scanner + 9 raw-color token replacements
- Middleware as page/API header owner (removed broad next.config page/API duplication)

### 3.2 Correction pass

**Static headers**

- Added `getStaticSecurityHeaders`, `STATIC_SECURITY_HEADER_SOURCES`, `buildNextConfigStaticHeaderRules`
- Restored **narrow** `next.config.js` `headers()` for static-only sources
- Updated tests: allow static `headers()`; forbid page/API overlap

**Full dependency audit**

| Package | Before (correction) | After |
| --- | --- | --- |
| `wrangler` | 4.69.0 | **4.114.0** |
| `miniflare` | 4.20260305.0 | **4.20260722.0** |
| `esbuild` | 0.27.3 (vuln) | **0.28.1** (override + wrangler) |
| `undici` | 7.18.2 | **7.28.0** |
| `ws` | 8.18.0 / 8.19.0 | **8.21.0** |
| `js-yaml` | 4.1.1 | **4.3.0** |
| `@opennextjs/cloudflare` | 1.16.6 (SSRF GHSA-c7mq) | **1.20.2** (pinned; peer Next ≥15.5.21) |

**brace-expansion compatibility**

- **REMOVED** Bun `patchedDependencies` + `patches/brace-expansion@5.0.8.patch`
- **RETAINED** override `brace-expansion@5.0.8` (audit floor)
- **ADDED** `scripts/ensure-brace-expansion-default.cjs` on root `postinstall` (Bun **and** npm/Vercel)
- Upstream parent still pulls `@node-minify/core@8` → `minimatch@8` needing default export; no safe parent-only fix without OpenNext major redesign

---

## 4. Checks Run (final after correction)

| Check | Result | Evidence |
| --- | --- | --- |
| `node scripts/ci/validate-npm-lock.cjs` | PASS | exit 0 |
| `bun install --frozen-lockfile` | PASS | Bun 1.2.15 |
| `bun run --cwd apps/web check:design` | PASS | self-test + 0 raw colors |
| Independent raw-color `rg` | PASS | **0** matches |
| `bun run lint` | PASS | exit 0 |
| `bun run test` | PASS | **1772** tests / **327** files |
| `bun run build` | PASS | Next 15.5.21 |
| `bun run cf:build` | PASS | OpenNext 1.20.2 complete |
| `npm audit` (full) | PASS | **0 vulnerabilities** |
| `npm audit --omit=dev` | PASS | **0 vulnerabilities** |
| `(cd packages/contracts && npm audit)` | PASS | **0 vulnerabilities** |
| `npm ci` | PASS | postinstall ensure ran; audit 0 |
| `npm run build:web:npm` (after contracts npm build) | PASS | exit 0 |
| Bun restore after npm ci | PASS | `bun install --frozen-lockfile` |
| Local production header probe | PASS | §5 |

---

## 5. Local production-like header probe (correction)

Port `60294` / recheck `60366`, `NODE_ENV=production`, server stopped after probe.

| Endpoint | Status | CSP | HSTS | X-CTO | XFO | Permissions | Referrer | Cache-Control | Auth redirect |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/en` | 200 | **1× full page** | **1×** | **1×** | **1×** | **1×** | **1×** | private no-store family | `pass` |
| `/en/login` | 200 | **1×** | **1×** | **1×** | **1×** | **1×** | **1×** | private no-store | `pass` |
| `/en/dashboard` | 307 | **1×** | **1×** | **1×** | **1×** | **1×** | **1×** | — | `login` |
| `/api/v1/health` | 200 | **absent** | **1×** | **1×** | **1×** | **1×** | **1×** | — | — |
| lite `/api/v1/.../tasks` | 403 | **absent** | **1×** | **1×** | **1×** | **1×** | **1×** | — | — |
| legacy `/api/webhooks/incoming` | 405 | **absent** | **1×** | **1×** | **1×** | **1×** | **1×** | — | — |
| `/favicon.ico` | 200 | absent | **1×** | **1×** | absent | absent | absent | `public, max-age=0` | none |
| `/_next/static/css/*.css` | 200 | absent | **1×** | **1×** | absent | absent | absent | `public, max-age=31536000, immutable` | none |
| `/_next/static/chunks/*.js` | 200 | absent | **1×** | **1×** | absent | absent | absent | `public, max-age=31536000, immutable` | none |
| `/apple-touch-icon.png` | 200 | absent | **1×** | **1×** | absent | absent | absent | `public, max-age=0` | none |
| `/brand/aistroyka-logo.png` | 200 | absent | **1×** | **1×** | absent | absent | absent | `public, max-age=0` | none |

Unit tests also prove development static rules omit HSTS (`buildNextConfigStaticHeaderRules({ isProduction: false })`).

**Static cache preserved:** YES — `_next/static` remains `immutable` long-cache; public icons remain `public, max-age=0`. No auth redirects on static.

**Header duplicates locally:** none observed (all applicable counts = 1).

---

## 6. Full npm audit before / after (correction)

### Before correction

```text
6 vulnerabilities (1 low, 5 high)
esbuild, js-yaml, undici, ws, wrangler, miniflare
```

### After correction

```text
npm audit              → found 0 vulnerabilities
npm audit --omit=dev   → found 0 vulnerabilities
packages/contracts     → found 0 vulnerabilities
```

---

## 7. brace-expansion decision

| Decision | Detail |
| --- | --- |
| Bun `patchedDependencies` / `patches/*.patch` | **REMOVED** |
| Override `brace-expansion: 5.0.8` | **RETAINED** (audit requirement) |
| Compatibility mechanism | **`scripts/ensure-brace-expansion-default.cjs`** on postinstall |

**Why still needed:** `@opennextjs/aws` still depends on `@node-minify/core@8` → `minimatch@8` ESM `import expand from 'brace-expansion'`. brace-expansion@5 exports named `expand` only. Bun cannot nest-override glob under `@node-minify/core`.

**Compatibility proof**

- ESM named import: PASS  
- ESM default import: PASS (after ensure)  
- CJS `require()` callable: PASS  
- `@node-minify/core` import: PASS  
- Stripping defaults → minify fails → ensure patches → minify OK (proven)  
- `npm ci` + `npm run build:web:npm`: PASS  
- `bun install --frozen-lockfile` + `cf:build`: PASS  

---

## 8. Failures found and fixed (correction loop)

1. Static assets lost HSTS/nosniff → narrow next.config static rules + shared static profile.  
2. Full audit 6 vulns → wrangler 4.114.0 + overrides (`esbuild`, `js-yaml`, `undici`, `ws`).  
3. OpenNext 1.16.6 SSRF advisory after pinning → upgrade to **1.20.2**.  
4. Bun-only patch unsafe for npm → replace with postinstall ensure script; delete `patches/`.  
5. Tests that banned any `headers()` → updated to ban page/API overlap only.

---

## 9. Files changed

**Correction-added / updated**

- `apps/web/lib/security-headers.ts` / `.js` / `.test.ts`
- `apps/web/next.config.js`
- `package.json` / `apps/web/package.json`
- `bun.lock` / `package-lock.json`
- `scripts/ensure-brace-expansion-default.cjs` (**new**)
- `docs/roadmap/AISTROYKA_PHASE1_P0_GATE_CLOSURE_2026-07-25.md` (this file)

**Removed**

- `patches/brace-expansion@5.0.8.patch`
- `package.json` `patchedDependencies`

**Preserved from earlier Phase 1**

- Design scanner + tokenized UI files
- Middleware page/API ownership
- Next 15.5.21 alignment

**Not touched:** user dirty `AGENTS.md` / ROMA audit doc; QA/launch untracked trees; auth/RBAC/RLS/customer-finance; AI config; iOS/Android; deploy.

---

## 10. Remaining known Phase 1 issues

**None known locally.** Live production may still serve old headers until a deploy phase. Phase 2+ product gates remain open for overall release.

---

## PHASE 1 CORRECTION CLOSURE

```text
PHASE 1 CORRECTION CLOSURE

Verdict: YES
Overall release verdict: NO-GO

Static header regression fixed: YES
Static route owner:
- next.config.js narrow sources via buildNextConfigStaticHeaderRules (static profile only)
Page/API route owner:
- middleware (page + api profiles)

HTML header probe: PASS
API header probe: PASS
Static header probe: PASS
Static cache behavior preserved: YES
Header duplicates remaining locally: none

Full npm audit before:
- 6 vulnerabilities (1 low, 5 high): esbuild, js-yaml, undici, ws, wrangler, miniflare

Full npm audit after:
- 0 vulnerabilities

Production npm audit after:
- 0 vulnerabilities (--omit=dev)

npm clean install: PASS
npm build path: PASS
Bun frozen install: PASS
Cloudflare build: PASS

brace-expansion patch:
- REMOVED (Bun patchedDependencies / patches/*.patch)
Reason:
- Bun-only patches do not apply on npm/Vercel; replaced with postinstall ensure script
Compatibility proof:
- ESM named+default, CJS require, node-minify, npm ci, npm build:web:npm, bun frozen, cf:build all PASS
- override brace-expansion@5.0.8 retained for audit floor

Design gate still green: YES
Full tests:
- 1772 passed / 327 files; lint/build/cf:build PASS

Files changed during correction:
- security-headers.ts/js/test, next.config.js, package.json(+apps/web), locks,
  scripts/ensure-brace-expansion-default.cjs, this report; removed patches/

Remaining known Phase 1 issues:
- none local; production deploy of headers still pending (not Phase 1)

User changes preserved: YES
Customer-finance isolation unchanged: YES
Production deployed: NO
Allowed to proceed to Phase 2: YES
```

**Stop — Phase 2 not started.**
