# ACTIVE CANONICAL SOURCES

**Audit date:** 2026-04-02  
Use these locations as **primary** references for implementation and release truth.

| Domain | Canonical location | Notes |
|--------|--------------------|-------|
| **Product naming** | `AGENTS.md`, `docs/architecture/CORE_B4_CANONICAL_NAMING.md` | B4 branding |
| **Web app (Next.js)** | `apps/web/` — `app/`, `lib/` | API routes under `app/api/` |
| **API contracts / DTOs** | `packages/contracts/src/` | Zod/schemas + exports |
| **Tenant & authz** | `apps/web/lib/tenant/`, `apps/web/lib/authz/` | Policy tests alongside |
| **Lite client gating** | `apps/web/lib/api/lite-allow-list.ts`, `apps/web/middleware.ts` | `x-client` behavior |
| **iOS shared HTTP** | `ios/Shared/Sources/Shared/` (`APIClient.swift`, `Endpoints.swift`, `Config.swift`) | |
| **iOS Worker** | `ios/AiStroykaWorker/` | |
| **iOS Manager** | `ios/AiStroykaManager/` | |
| **Android shared** | `android/shared/src/main/java/ai/aistroyka/shared/` | `ApiClient.kt`, `AppRuntime` |
| **Android Worker** | `android/AiStroykaWorker/` | |
| **Android Manager** | `android/AiStroykaManager/` | |
| **Environment / secrets governance** | `docs/ENVIRONMENT-VARIABLES.md`, `apps/web/.env.example`, `ios/Config/Secrets.xcconfig.example`, `android/local.properties.example` | Never commit real secrets |
| **Pilot / staged runtime evidence** | `docs/launch/STAGE4_*.md` | Cross-platform matrix |
| **This platform audit (2026-04)** | `docs/audit/PLATFORM_INTEGRATION_TRUTH_MATRIX.md` and companion files in `docs/audit/` | Supersedes ad-hoc deploy snapshots **that were archived** |
| **CI** | `.github/workflows/ci.yml` | |

**Historical (non-canonical for current behavior):** `docs/release-audit/*` (use with caution), contents moved to `archive/v1-pre-release-cleanup/docs/audit/` (preserved, not active).
