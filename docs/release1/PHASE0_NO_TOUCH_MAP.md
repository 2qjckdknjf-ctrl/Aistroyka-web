# PHASE 0 — No-touch & preserve map (Release 1 planning)

**Purpose:** Areas to **avoid changing** during Release 1 unless there is a **documented P0** with owner approval. This is **risk management**, not a technical ban.

---

## 1. Do not touch unless P0 (fragile / central)

| Area | Path / artifact | Why |
|------|-----------------|-----|
| **Tenant context resolution** | `apps/web/lib/tenant/**` | Every API route depends on correct `tenantId` / role; regressions are **tenant-wide**. |
| **Supabase server + request client split** | `apps/web/lib/supabase/**`, `createClientFromRequest` usage | Mobile Bearer vs cookie — prior production incidents tied to wrong client choice. |
| **Middleware: lite allow list** | `apps/web/middleware.ts`, `lib/api/lite-allow-list.ts` | Misconfiguration **blocks all mobile** or **opens** wrong paths. |
| **Entry routing / auth redirects** | `apps/web/lib/entry/entry-routing.ts`, middleware protected prefixes | Security-sensitive; open-redirect protections. |
| **Upload session service** | `apps/web/lib/domain/upload-session/upload-session.service.ts` | Storage path + RLS; mobile uploads depend on exact behavior. |
| **Worker report routes** | `apps/web/app/api/v1/worker/**` | Launch-critical contour. |
| **Stripe webhook ingress** | `apps/web/app/api/v1/billing/webhooks/stripe/route.ts` + billing libs | Financial side effects; idempotency tables in migrations. |

---

## 2. Exists but preserve — future / parallel product

| Area | Path | Note |
|------|------|------|
| **paperclip/** | Entire tree | Separate workspace(s); not Aistroyka web app; **do not merge casually**. |
| **AI brain phases D/E** | `apps/web/lib/ai-brain/phase-d`, `phase-e`, … | Experimentation layers; many **tests** exist — preserve until R1 scope explicitly includes/excludes. |
| **Billing pilot / plan-fit** (if not in R1) | `lib/platform/billing-readiness/**`, `lib/platform/plan-fit/**`, `v1/admin/billing/**` | Large; touching without scope risks regressions in onboarding/billing. |

---

## 3. Mobile: change only with device proof

| Area | Note |
|------|------|
| **iOS `APIClient` / `Config.apiBaseURL`** | URL resolution bugs caused **HTML** responses instead of JSON (documented in launch threads). |
| **Android `WorkerApi` / `ApiClient`** | HTTP version + JSON null omission for optional fields — prior bugs. |
| **Debug pilot flags** | `PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO` in `android/AiStroykaWorker/build.gradle.kts` — must not leak to “proof of real launch” without disclosure. |

---

## 4. Configuration & secrets (never commit)

| Item | Example in repo |
|------|-----------------|
| iOS secrets | `ios/Config/Secrets.xcconfig` (gitignored per AGENTS.md); example files if present |
| Android | `android/local.properties` (referenced in `build.gradle.kts`) |
| Web | `apps/web/.env.local` (not audited) |

---

## 5. Documentation sprawl

| Area | Guidance |
|------|----------|
| `docs/**` (1000+ files) | **Do not delete** historical audits; add new Release 1 docs under `docs/release1/` (as this Phase 0 does). |

---

## 6. “Exists but do not touch” — CI

| Item | Note |
|------|------|
| **Root** `.github/workflows/deploy-cloudflare-prod.yml` | Production deploy path — change only with release owner. |
| **Nested** `apps/web/.github/workflows/ci.yml` | Must understand which workflows GitHub activates for this repo layout. |
