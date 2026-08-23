# Release Candidate Manifest — v1.0.0-rc.1

**Tag:** `v1.0.0-rc.1`  
**Immutable Git SHA:** `a7144249ed0cf1f049cfbdaa9e36e722b1bcfcc8` (`a714424`)  
**Freeze date:** 2026-08-23 (Europe/Madrid)  
**Classification:** `production-capable / controlled-pilot candidate` — **not Public GA**

---

## Deploy proof

| Environment | URL | `buildStamp.sha7` | Match RC SHA |
|-------------|-----|-------------------|--------------|
| Staging | `https://staging.aistroyka.ai` | `a714424` | **YES** |
| Production | `https://aistroyka.ai` | `a714424` | **YES** |

Health endpoints: `GET /api/v1/health` — `ok:true`, `db:ok`, `aiConfigured:true`, `openaiConfigured:true`.

---

## Local re-certification (@ `a7144249`, 2026-08-23)

| Gate | Result |
|------|--------|
| `bun run i18n:check` | **PASS** |
| `bun run lint` | **PASS** |
| `bun run test` | **PASS** — 341 files, 1786 tests |
| `bun run build` | **PASS** |
| `bun run cf:build` | **PASS** |
| `bun run release:check` | **PASS_WITH_WARNINGS** (0 FAIL) |
| `bash scripts/smoke/ai_live_provider.sh --require-live` | **GO** |
| `bash scripts/smoke/security_headers.sh` @ staging | **PASS** |
| `bash scripts/smoke/pilot_launch.sh` @ staging | **PASS** |

---

## Known open items (not blocking RC pin)

- Readiness docs PRs #228–#237 **OPEN** (evidence stack; code SHA unchanged).
- PR #229 auth recovery **not merged** — staging forgot-password 404.
- `stakeholder_finance_sanity.sh` — **BLOCKED_EXTERNAL** (no `STAKEHOLDER_SMOKE_*` locally).
- Store uploads — **OWNER_ACTION_REQUIRED** (TestFlight / Play).
- Android first-pilot — **DEFERRED BY DECISION**.

---

## Rollback anchor

**Known-good SHA for rollback:** `a7144249` (this RC).  
Promotion path: GitHub **Deploy Cloudflare (Staging)** → verify staging → **Deploy Cloudflare (Production)** on same immutable SHA.

---

## Phase cross-reference

| Phase | Verdict | Evidence |
|-------|---------|----------|
| 5 iOS | CONDITIONAL YES | PR #232 |
| 6 Android | CONDITIONAL YES | PR #233 |
| 7 AI | CONDITIONAL YES | PR #234 |
| 8 Integrations | CONDITIONAL YES | PR #235 |
| 9 Persona E2E | CONDITIONAL YES | PR #236 |
| 10 Reliability | CONDITIONAL YES | PR #237 |

---

*RC manifest — 100% Readiness Phase 11.*
