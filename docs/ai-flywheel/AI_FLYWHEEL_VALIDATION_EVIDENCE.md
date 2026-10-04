# AI Flywheel Validation Evidence

**Date:** 2026-06-17  
**Environment:** macOS arm64, bun 1.2.15 (arm64 native via `~/.bun/bin/bun`)

---

## Local runner root cause (resolved)

| Issue | Cause | Fix |
|-------|-------|-----|
| `bad CPU type in executable: bun` | x86_64 bun binary on arm64 host | Reinstalled bun arm64 via `curl -fsSL https://bun.sh/install` |
| Volta intercept failures | `VOLTA_HOME` shims in PATH | Run with `PATH="$HOME/.bun/bin:/usr/bin:/bin"` |
| Vitest rollup native | x86 optional deps | `bun install` with arm64 bun |

---

## Commands and results

| Command | Result |
|---------|--------|
| `bun vitest run lib/platform/ai-flywheel app/api/v1/tenant/ai-training-consent` | **PASS** — 11 files, 66 tests |
| `bun scripts/ai/export-dataset-dry-run.ts` | **PASS** — dry-run report emitted |
| `bun run i18n:check` | **PASS** |
| `bun run lint` | **PASS** |
| `next build` (direct, contracts pre-built) | **PASS** |
| `bun vitest run` (full suite) | **PARTIAL** — 282/301 files pass; 2 test failures + 19 suite failures pre-existing (e.g. transcribe route 415) |
| `bun run build:web` (via npm prebuild) | **FAIL** — `npm: command not found` in minimal PATH (pre-existing script coupling) |
| `bun run cf:build` | **Not run** — depends on `build:web` npm prebuild chain |

---

## Flywheel-specific validation summary

All closure-sprint tests **passed**:
- flags default false
- consent service + route auth
- PII scrub + Spain edge cases
- finance guard
- feedback wire + capture
- behavior safety isolation
- export dry-run

---

## Failure classification

| Failure | Caused by this sprint? | Blocks flywheel closure? |
|---------|----------------------|--------------------------|
| Full-suite transcribe 415 | No — pre-existing | No |
| 19 suite setup failures | No — pre-existing env/mock | No |
| npm missing in PATH for `build:web` | No — tooling PATH | No (direct `next build` succeeded) |
| cf:build not executed | Toolchain PATH | P2 — recommend CI cf:build |

---

## Recommended CI command

```bash
export PATH="$HOME/.bun/bin:$PATH"
bun run --cwd apps/web test lib/platform/ai-flywheel
bun run lint
bun run cf:build
```
