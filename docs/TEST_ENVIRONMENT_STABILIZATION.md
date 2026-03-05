# Test Environment Stabilization Report

This document describes the cleanup and stabilization steps applied to the repository to address hanging test/build processes, accidental staging of build artifacts, and unstable test execution.

## 1. Processes That Caused Hangs

Background processes that can keep Node event loops alive and cause tests or builds to hang:

- **workerd** — Cloudflare Workers runtime (e.g. `workerd serve`)
- **jest-worker** — Jest/Vitest worker processes (`processChild`)
- **wrangler** — Cloudflare CLI (`wrangler dev`)
- **next dev** — Next.js development server

**Mitigation:** Run `./scripts/kill-hanging-dev.sh` before tests or when the environment feels stuck. The script terminates these processes with `pkill -f <pattern> || true` so that missing processes do not cause errors.

## 2. Cleanup Steps Applied

1. **Staging reset** — `git reset` was run to unstage any accidentally staged files (no files were deleted).
2. **.gitignore update** — Root `.gitignore` was updated to ignore build and derived artifacts (see below).
3. **Index cleanup** — `git rm --cached -r` was run for `TestLogs`, `ios/build`, and `ios/ci_derived` where they were tracked (to remove nested repos/artifacts from the index only; files on disk were not deleted).
4. **Checkpoint commit** — Project changes (apps/web, packages, docs, scripts) were committed as a single checkpoint after cleanup.

## 3. .gitignore Changes

The following entries were added or ensured in the root `.gitignore`:

- **Cursor / IDE:** `.cursor/`
- **Node:** `node_modules/`
- **Test artifacts:** `TestLogs/`, `test-results/`, `playwright-report/`, `apps/web/test-results/`
- **iOS derived builds:** `ios/build/`, `ios/ci_derived/`, `DerivedData/`, `**/DerivedData/`, `**/SourcePackages/`, `*.xcresult`
- **Archives:** `*.zip`
- **macOS:** `.DS_Store`

Existing rules for Next.js (`.next`, `out`), env files, and Cloudflare (`.open-next`, `.dev.vars`) were left unchanged.

## 4. Network Mocking Policy

Unit tests must **never** perform real network requests.

- **Mechanism:** `apps/web/vitest.setup.ts` runs before each test file. It stubs the global `fetch` so that any call throws:  
  `Error: Network calls are forbidden in unit tests. Mock fetch.`
- **After each test:** `vi.unstubAllGlobals()` and `vi.restoreAllMocks()` are called so that test-local mocks are not leaked.
- **Tests that need HTTP:** Mock `fetch` (or the module that uses it) inside that test or via `vi.mock()`; do not rely on real network in unit tests.

## 5. How to Run Tests Safely

1. **Kill hanging dev processes (optional but recommended):**
   ```bash
   ./scripts/kill-hanging-dev.sh
   ```

2. **From repo root, install and run tests:**
   ```bash
   cd apps/web
   npm install --legacy-peer-deps
   npm test
   ```

3. **Test script:** `npm test` runs `vitest run --maxWorkers=1` to avoid worker deadlocks and ensure sequential execution.

4. **If a test fails with "Network calls are forbidden":** That test (or a module it imports) is calling `fetch`. Add a mock for `fetch` or for the code path that performs the request (e.g. Supabase client, API client).

## 6. Known Test Status

- **223 tests passing** across 48 test files (as of stabilization).
- **3 failing tests** in `lib/platform/ai/providers/provider.router.test.ts`: these are assertion/expectation mismatches around provider fallback behavior (e.g. which provider/model is used after failure). They are not caused by network mocking and can be addressed in a follow-up (test expectations or router behavior).

## 7. Build Verification

After stabilization, verify builds:

```bash
cd apps/web
npm run build
npm run cf:build
```

Both should complete successfully before considering the environment fully stabilized.
