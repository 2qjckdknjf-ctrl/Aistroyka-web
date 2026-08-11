# AI Flywheel Full Test Baseline

**Date:** 2026-06-17  
**Sprint:** AI Flywheel Tail Closure

## Command

```bash
export PATH="$HOME/.bun/bin:/usr/bin:/bin"
cd apps/web
bun ../../node_modules/vitest/vitest.mjs run --maxWorkers=1
```

## Result

| Metric | Value |
|--------|-------|
| Test files | 304 total |
| Passed files | **285** |
| Failed files | **19** |
| Passed tests | **1483** |
| Failed tests | **2** |
| Duration | ~18s |

**Full suite green:** **NO**

---

## Failure classification

### Environment / tooling (17 files — module load failures)

All fail at import with `TypeError: undefined is not an object (evaluating 'z.object')` — Zod not resolving under Vitest SSR for route modules:

| File |
|------|
| `app/api/contact/route.test.ts` |
| `app/api/v1/contact/route.test.ts` |
| `app/api/v1/auth/methods/route.test.ts` |
| `app/api/v1/auth/telegram/route.test.ts` |
| `app/api/v1/health/route.test.ts` |
| `app/api/v1/devices/register/route.test.ts` |
| `app/api/v1/devices/unregister/route.test.ts` |
| `app/api/v1/media/upload-sessions/route.test.ts` |
| `app/api/v1/media/upload-sessions/[id]/finalize/route.test.ts` |
| `app/api/v1/sync/bootstrap/route.test.ts` |
| `app/api/v1/sync/changes/route.test.ts` |
| `app/api/v1/sync/ack/route.test.ts` |
| `app/api/v1/worker/report/submit/route.test.ts` |
| `app/api/v1/ai/analyze-image/route.test.ts` |
| `app/api/v1/ai/analyze-image/route.fallback.test.ts` |
| `app/api/ai/analyze-image/route.test.ts` |
| `app/api/v1/ai/analyze-video-daily/route.test.ts` |
| `lib/platform/billing-readiness/billing-readiness.contracts.test.ts` |

**Class:** unrelated pre-existing / environment-tooling (Zod + Vitest SSR interop on local Bun path)

### Unrelated pre-existing (2 tests)

| File | Test | Issue |
|------|------|-------|
| `app/api/v1/ai/transcribe/route.test.ts` | returns 415 for unsupported mime | Expected 415, got 200 |
| `app/api/v1/ai/transcribe/route.test.ts` | returns 200 with text | Expected 200, got 415 |

**Class:** unrelated pre-existing (transcribe route behavior vs test expectations)

### AI Flywheel / feedback / changed paths

| Scope | Result |
|-------|--------|
| `lib/platform/ai-flywheel/**` | **All pass** |
| `lib/features/ai/api/**` | **All pass** |
| `lib/ai-brain/phase-d/feedback/**` | **All pass** |
| `app/api/v1/ai/feedback/route.test.ts` | **Pass** |
| `app/api/v1/projects/[id]/copilot/chat/stream/route.test.ts` | **Pass** |

**Changed-path failure remains:** **NO**

---

## Targeted changed-path command

```bash
vitest run lib/platform/ai-flywheel lib/features/ai/api lib/ai-brain/phase-d/feedback \
  app/api/v1/ai/feedback/route.test.ts \
  app/api/v1/projects/[id]/copilot/chat/stream/route.test.ts
```

**Result:** 94/94 pass

---

## Verdict

| Item | Verdict |
|------|---------|
| Full suite green | NO (19 files / 2 tests) |
| Failures classified | YES |
| Flywheel-related failures | NONE |
| Changed paths green | YES |

Fixing Zod SSR and transcribe tests is **out of tail-closure scope** unless they block CI — CI Check `Test` step passed on run 27669872727 (see CI evidence doc).
