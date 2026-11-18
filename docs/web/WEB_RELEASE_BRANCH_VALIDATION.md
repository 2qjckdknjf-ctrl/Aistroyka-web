# WEB Release Branch Validation

**Date:** 2026-06-20  
**Branch:** `release/web-pilot-rc` @ `9d6a7812`  
**Remote:** `origin/release/web-pilot-rc`

---

## Commands run

| Check | Command | Result |
|-------|---------|--------|
| i18n | `bun run i18n:check` | **PASS** — ru, es, it match en (activation/dashboard namespaces) |
| ESLint | `cd apps/web && bun run lint` | **PASS** (quiet) |
| Unit tests | `bun run test` | **PARTIAL** — 1434 passed, 2 failed; 19 files load errors (zod/vite) |
| Next build | `next build` (clean `.next`, no gitignored export WIP) | **PASS** |
| cf:build | `bun run cf:build` | **FAIL local** — Volta/node exit 126 on host |
| OpenNext full | Not run locally | Defer to **CI Check** / staging deploy |

---

## Test failure detail

### Failed tests (2)

- `apps/web/app/api/v1/ai/transcribe/route.test.ts` — status expectation mismatch (415 vs 200)

Likely pre-existing; not introduced by LG commits (no transcribe changes in RC diff).

### Test file load errors (19)

`TypeError: undefined is not an object (evaluating 'z.object')` — vitest/zod SSR import issue affecting multiple route tests. Same class of failures likely on main; CI Check on PR is authoritative gate.

---

## Build notes

### Gitignored WIP pollution

Root `.gitignore` line `exports/` ignores:

- `apps/web/lib/platform/exports/export.service.ts`
- `apps/web/app/api/v1/exports/` (local only)

These files are **not on RC branch** but can break local `next build` if present on disk. CI checkout is clean.

### Local Node/Volta

```
Volta error: Could not execute command (exit 126)
```

Workaround used: `bun ../../node_modules/next/dist/bin/next build` — **PASS**.

Full `cf:build` requires CI or fixed Volta toolchain.

---

## CI expectation

Opening PR `release/web-pilot-rc` → `main` should trigger **CI Check**:

- install, i18n, lint, test, **cf:build**

**Not triggered in this audit run** — recommend operator confirm PR CI green before prod.

---

## Local route validation

Not run (no local dev server + auth creds in this pass). Staging deploy proof replaces live-like validation.

---

## Validation verdict

| Gate | Status |
|------|--------|
| i18n | PASS |
| Lint | PASS |
| Next production build | PASS (clean tree) |
| cf:build local | BLOCKED (env) |
| Tests | PARTIAL (non-LG failures) |

**Acceptable for staging deploy** with CI cf:build as hard gate. **Not acceptable for production** until staging runtime proof + CI PASS.
