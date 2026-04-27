# CONTRADICTION REGISTER

**Audit date:** 2026-04-02

| ID | Source A | Source B | Explanation | Severity | Status | Recommendation |
|----|----------|----------|-------------|----------|--------|------------------|
| C1 | `docs/release-audit/00_EXECUTIVE_RELEASE_READINESS_REPORT.md` (“no Android app in repo”) | Repository tree `android/AiStroykaWorker`, `android/AiStroykaManager` | Older release audit predates or missed current Android apps | High (trust) | **STALE_DOC** | Treat release-audit bundle as **historical**; use this platform audit + code |
| C2 | `docs/architecture/CORE_B5_REPO_TRUTH_VALIDATION.md` (“No `ios/WorkerLite` tree”) | `docs/release-hardening/IOS_RENAME_COMPLETION_PLAN.md` (WorkerLite references) | Architecture doc says tree absent; hardening doc still discusses WorkerLite rename | Medium | **STALE_DOC** (hardening) | Align or archive hardening doc |
| C3 | Public marketing (AI-heavy positioning across site) | `GET /api/health` on production: `"aiConfigured":false` | Health endpoint reports AI not configured while marketing emphasizes AI | Medium | **UNKNOWN** (definition) | Document what `aiConfigured` measures vs product AI features; avoid over-claim |
| C4 | `AGENTS.md` — WorkerLite legacy naming | Code paths: `AiStroykaWorker` product id, `ios_lite` / `android_lite` API profiles | Naming policy vs technical `*_lite` headers — not contradictory but confusing | Low | **ACTIVE** / nuance | Keep B4 naming in prose; headers are technical |
| C5 | STAGE4 matrix: iOS E2E “not proven” | iOS source clearly implements full WorkerAPI | Doc says runtime not proven; code says capability exists | Medium | **PARTIAL** | Run iOS Maestro to close gap |
| C6 | Dual deploy documentation (Vercel vs Cloudflare) | Single health URL | Operators may disagree on “source of truth” deploy path | Medium | **LEGACY_ACTIVE_REFERENCE** | Follow `vercel.json` / `wrangler` docs in repo; one production URL |

---

## Finding format (critical)

### Finding ID
**F-CONTRADICTION-C3**

### Surface
Public claims vs `/api/health`

### Claim
“AI is fully configured in production”

### Evidence
`curl -L https://aistroyka.ai/api/health` returned `"aiConfigured":false` (2026-04-02).

### Status
**UNKNOWN** (flag semantics not fully traced in this audit)

### Risk
Founder/investor expectation mismatch

### Release impact
Marketing and pilot messaging may overstate operational AI readiness.

### Recommendation
Define and document `aiConfigured` in `apps/web` health handler; align public copy.

### Owner
Platform / web
