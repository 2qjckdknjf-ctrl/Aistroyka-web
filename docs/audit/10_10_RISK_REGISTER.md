# 10/10 Risk Register

Updated: 2026-05-01

## Open Risks

| ID | Severity | Risk | Evidence | Mitigation | Status |
|---|---|---|---|---|---|
| R-001 | P1 | No live Supabase/Cloudflare verification in this environment | Local-only validation; no production secrets/context in session | Run operator checklist from final report | OPEN (external) |
| R-002 | P2 | Android AGP warning with compileSdk 34 on AGP 7.4.2 | `./gradlew assembleDebug` warning | Upgrade AGP + Gradle wrapper in planned maintenance | OPEN |
| R-003 | P2 | Legacy `/api/*` compatibility surface still present | API inventory shows 27 non-v1 routes | Add deprecation timeline and usage telemetry | OPEN |

## Closed Risks This Cycle

| ID | Severity | Risk | Resolution |
|---|---|---|---|
| C-001 | P1 | Build/type/test instability | Full validation pipeline passed end-to-end |
| C-002 | P1 | Mobile build uncertainty | iOS Worker/Manager and Android debug builds succeeded |
