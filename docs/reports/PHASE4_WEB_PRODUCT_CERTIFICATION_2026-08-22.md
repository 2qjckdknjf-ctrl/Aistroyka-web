# Phase 4 — Web Product Certification (initial pass)

**Date:** 2026-08-22  
**Target:** `https://staging.aistroyka.ai` (`buildStamp.sha7=a714424`)  
**Branch:** `feature/phase4-web-certification-2026-08-22`  
**Status:** **IN PROGRESS**

---

## 1. Unauthenticated surfaces (staging)

| Route | HTTP | Result |
|-------|------|--------|
| `/en/login` | 200 | **PROVEN** |
| `/en/dashboard` | 307 → `/en/login?next=...` | **PROVEN** (auth gate) |
| Security headers smoke | PASS | **PROVEN** (`scripts/smoke/security_headers.sh`) |

## 2. AI runtime (staging, canonical gate)

| Check | Result |
|-------|--------|
| `bash scripts/smoke/ai_live_provider.sh --require-live` | **PROVEN GO** — live provider, 0% fallback |

## 3. Authenticated manager/worker journeys

| Journey | Result |
|---------|--------|
| Login → portfolio → project → tasks → reports | **NOT TESTED** — requires pilot E2E credentials session |
| Portal / stakeholder | **NOT TESTED** |
| Platform admin | **NOT TESTED** — owner session + Access |

## 4. Phase 2 dependencies (not on staging until merge)

| Feature | Staging state |
|---------|---------------|
| Password recovery UI | **NOT DEPLOYED** — PR #229 pending merge |
| Legal draft copy | **NOT DEPLOYED** — PR #229 pending merge |

## 5. Known open UX P1 (from product design backlog)

| ID | Item | Status |
|----|------|--------|
| PD-P1-04 | Dual project tab bars | OPEN — Slice 02 |
| PD-P1-05 | Client portal contractor shell | OPEN — Slice 02 |

## 6. Blockers

| Blocker | Type |
|---------|------|
| Authenticated E2E personas | `BLOCKED_EXTERNAL` without `PILOT_E2E_*` / `.env.pilot` in CI session |
| PR #229 not merged | Staging missing auth recovery |

## 7. Closure verdict

**NO** — unauthenticated + security + AI live gates pass; full persona journeys pending authenticated E2E.

**Next:** merge #229; run `bun run --cwd apps/web e2e:pilot` with credentials; browser audit dashboard/project flows.

---

*Phase 4 initial pass — 100% Readiness execution.*
