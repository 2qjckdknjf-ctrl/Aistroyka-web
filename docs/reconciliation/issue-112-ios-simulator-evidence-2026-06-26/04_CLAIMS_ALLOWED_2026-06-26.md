# Claims Allowed After This Evidence Run (2026-06-26)

| Claim | Allowed? | Notes |
|-------|----------|-------|
| iOS simulator build evidence | **PASS** | Both Worker + Manager Debug iphonesimulator builds succeeded at SHA `26078425`. |
| iOS UITest smoke evidence (login surface) | **PASS** | Both `*SmokeUITests` login-screen tests passed on iPhone 17 Pro simulator. |
| Full iOS readiness / pilot readiness | **NO** | Login-surface smoke only; no live API/E2E, no device archive, no backend auth/session proof. |
| TestFlight claim | **NO** | No archive/signing/upload performed. |
| App Store claim | **NO** | No archive/signing/upload performed. |
| pilot-live claim | **NO** | No live tenant E2E, no deployment alignment, no store distribution. |
| production GA claim | **NO** | Not applicable; web/mobile GA not evidenced. |
| latest `main` deployed | **NO** | Not checked; requires `buildStamp.sha7` separately. |
