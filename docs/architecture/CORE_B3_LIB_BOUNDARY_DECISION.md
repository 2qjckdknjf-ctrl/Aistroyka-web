# B3 — Root `lib/` vs `apps/web/lib` boundary — AISTROYKA

**Date:** 2026-03-18

---

## 1. Current state

### Root `lib/`

- Contains: `env.ts`, `storage.ts`, `rpc.ts`, `app-url.ts`, `types.ts`, `supabase/*` helpers, etc.  
- Patterns mirror early app-era helpers: Supabase browser/server clients, RPC wrapper, storage upload, public env helper.\n- **Imports:** `grep 'from \"lib/'` / `'../lib'` etc. in repo → **no active imports** from `apps/web` or `packages/*` into root `lib`.  
- Some files import `@/lib/*` from `apps/web/lib` (e.g. `lib/storage.ts` uses `@/lib/supabase-browser`), indicating root `lib` is not self-contained but shadows app-local helpers.\n
### `apps/web/lib`

- Large, structured tree: `config`, `domain`, `platform`, `supabase`, `ai-brain`, `features`, `api`, `ops`, `observability`, etc.  
- All app imports use `@/lib/...` pointing into `apps/web/lib`.  
- Env governance (B2.2) and most architecture docs treat `apps/web/lib` as the canonical **web** library surface.

---

## 2. Overlap and drift

- **Functional overlap:** Root `lib` provides functions (`getSupabaseBrowser`, `callRPC`, `uploadFile`, `getPublicEnv`) that have clear equivalents in `apps/web/lib` (`supabase-browser.ts`, `lib/rpc.ts`, `lib/storage.ts`, `lib/config/public.ts` / `release-env.ts`).  
- **No consumers:** No production code imports the root `lib` modules; all real usage is through `apps/web/lib`.  
- **Shadowing risk:** Root `lib` can confuse readers (“is this the shared platform lib?”) even though the real app logic lives under `apps/web/lib`.

---

## 3. Decision (B3)

- **Canonical role:**  
  - For the web app, **`apps/web/lib` is canonical**.  
  - Root `lib/` is **legacy/duplicate helper space**, not part of the web runtime boundary.  
- **Action in B3:**  
  - Do **not** delete root `lib/` due to possible out-of-band tooling or historical usage.  
  - Document clearly that root `lib/` is **non-canonical** and must not be used for new code; any new shared logic for the web should go under `apps/web/lib` (or packages when truly shared).

---

## 4. Remaining exceptions / future options

- If future evidence shows root `lib/` is entirely unused (including external tooling), it can be safely removed or moved under `archive/` in a later cleanup.  
- If a cross-app shared library is ever needed, it should go under `packages/*` with explicit workspaces and imports, not by reviving root `lib/` implicitly.

---

## 5. Summary

- **Current role of root `lib/`:** Legacy duplicate helper set; **not** a canonical boundary.  
- **Current role of `apps/web/lib`:** Primary web library layer; referenced by all app code and env governance.  
- **Overlap found:** Supabase/storage/RPC/env helpers effectively duplicated; only app-local versions are actually used.  
- **Cleanup action:** Documentation-only boundary clarification in B3; no code moved or deleted.  
- **Intentional exception:** Root `lib/` left in place as non-canonical, for possible historical or external use, with expectation it is not used by new code.\n*** End Patch
