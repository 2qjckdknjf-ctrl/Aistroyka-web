# Wave 0.6 — Web test truth (host-backed)

**Date:** 2026-03-26 (UTC)  
**Host:** macOS — Node from nvm: `/Users/alex/.nvm/versions/node/v24.14.0/bin/node` (v24.14.0).

---

## 1. Commands run

| Step | Command | CWD |
|------|-----------|-----|
| Lite allow list | `npx vitest run lib/api/lite-allow-list.test.ts --maxWorkers=1` | `apps/web` |
| Full suite | `npm run test` (→ `vitest run --maxWorkers=1`) | `apps/web` |

**Authoritative command for `apps/web`:** `npm run test` / `bun run test` as defined in `apps/web/package.json` (`vitest run --maxWorkers=1`).

---

## 2. Results

| Suite | Result | Counts |
|-------|--------|--------|
| `lite-allow-list.test.ts` | **PASS** | 13/13 |
| Full `apps/web` Vitest | **PASS** (after harness fix) | **179** files, **1106** tests |

---

## 3. Harness fix (allowed — test mock only)

| File | Issue | Fix |
|------|-------|-----|
| `app/api/v1/media/upload-sessions/route.test.ts` | Route imports `createClientFromRequest`; mock only had `createClient` | Added `createClientFromRequest: vi.fn().mockResolvedValue({})` |
| `app/api/v1/media/upload-sessions/[id]/finalize/route.test.ts` | Same | Same |

**No** changes to `apps/web/lib/supabase/server.ts` or routes.

---

## 4. Blockers

**None** for web test suite execution on this host after mock fix.

---

## 5. Authoritative test command decision

| Use case | Command |
|----------|---------|
| **CI / PR gate** | `npm run test` from `apps/web` (or `bun run test` per workspace) |
| **Lite client guard** | `npx vitest run lib/api/lite-allow-list.test.ts --maxWorkers=1` (subset) |

---

## 6. Environment note

`PATH` must include Node (`nvm` or system Node). **Wave 0.5** agent had no `node` on PATH; **Wave 0.6** used explicit nvm path.
