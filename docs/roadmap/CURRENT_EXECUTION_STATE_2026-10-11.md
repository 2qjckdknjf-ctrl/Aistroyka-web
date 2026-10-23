# AISTROYKA — план/факт,2026-10-11

Сверка 2026-10-12: наблюдённый main #440 `0891b08`; текущий код всегда проверяется свежим origin/main. #429/#431/#432 доставлены. #433/#434 дали регрессию оригиналов в Worker; #437 исправил redirect:error и прошёл 13 реальных staging PNG/Proof Pack/PDF/revocation проверок на `fac7a17` с точной очисткой. Production 38190089187 SUCCESS, apex/www `fac7a17`. #435 native Manager защищённо объединён на 4d3ddf75 после CI/three-app smoke SUCCESS, live UI 1/1 и readback PASS; runtime проверяется отдельно. #438 исправил transport; живой job завершён, один результат связан с media/job/tenant; strict provider gate exit 0, fallback 0. Durable audit #439 подтверждён живым событием на b47742e, staging/production SUCCESS. Worker → Manager → отдельный Customer API flow PASS; #440 fresh fallback 13/13 и assigned manager 15/15 PASS с очисткой. Durable report-media result отсутствует в текущем/сохранённом #244 handler — следующий срез по [hard audit](../audit/2026-10-12-report-media-result-hard-audit.md). Physical gallery: Debug build PASS, два UI initialization timeout, 0 tests; camera/native Worker UX отдельно. Не повторять уже включённые модули из-за старого TODO. [STATUS](../../STATUS.md), [runtime proof](../reports/private-original-runtime-2026-10-12/RESULT.md), [native proof](../reports/manager-native-publication-2026-10-12/RESULT.md). Исторические строки ниже сохраняют собственный объём доказательств.

| Контур | Факт | Следующая работа |
|---|---|---|
| A1 image/video auth | #420/#422:permissions +caller media/project binding; provider deployed smoke без fallback | Full live upload→job→source-linked result и video executor |
| A2/A3/A4/A5 | Stakeholder/daily-log/approvals/summary slices и required DB foundations уже в main | Полный UX/evidence сценарий; не переписывать включённые PR |
| A6 DB |11 source migrations/10 remote IDs, including request_key/intake/lifecycle/private helpers/session/media/Storage | Historical drift audit отдельно; receipt guard до любого apply |
| A7 Owner isolation | #424 portal flag repair + truthful finance smoke; #425 raw storage role/account repair live PASS | Gateway/share/document/revocation live proof delivered in #429; explicit web publication delivered #432; Worker API lifecycle 12/12 PASS; camera/native Worker UX и mobile distribution отдельно, invitation/export/AI-summary |
| B2/B3 | Daily-log persist and manual intake CRUD/submit/withdraw already exist | AI scope extraction этим не реализован |
| C1/C2 Customer iOS | Separate target/auth/list/detail/intake exists; current Debug branch physical positive+save+revocation+logout PASS | QA fixes #426 delivered; gallery #431 delivered, manual keyboard/OAuth/push/offline and store/pilot binary separately |
| E1 AI | Deployed canonical provider live-success/fallback 0; scope boundaries repaired | All capability/eval claims require their own real evidence |
| E2 Vision | Async request_key/lifecycle and service-only live RPC present | Живой image job/result PASS в #438; durable audit, reviewed observations, cancel/video executor далее |
| E3 Graph | Model/repository/overlay persisted and tested | Full lineage/spatial/human-review and intake-ID promotion scenario |
| AIS-CLIENT-005A | Manual drafts, tenant scope and human lifecycle present | Owner-bound preproject workspace + async observations/rooms/zones/work items; [hard audit](../audit/2026-10-11-intake-extraction-hard-audit.md) |
| AIS-CLIENT-005B | Live camera/voice planned | After Owner/Graph +consent/provider/session/budget gates; flag off |
| D/F | AndroidD1 audit and ROMA advisory schema merged | AndroidD2 after iOS readiness; advisory is not enforcement/certification |
| G/H | #420–425 protected delivery; receipts, registry and served-SHA verification | Every later source/runtime observed separately; no directory-name freshness inference |

74 retained older open PRs still require semantic reconciliation. #200 closed as superseded; #195/#196/#206 contain mixed leftovers and are not wholly replaced by these repairs. Saved release/cursor/dirty/ahead work is preserved. An unmerged release flag repair was recovered in #424; #196's proposed storage filter was audited and strengthened rather than blindly merged.

Continue Owner/evidence and source-linked Vision/Graph contracts, then the reviewed preproject extractor. Reuse current modules and inspect current PRs/local salvage before new work. Contractor-ops-only pilot stays in scope. Legal/store/distribution/billing 7-day shadow and growth-rate gates require actual external/time evidence; autonomy does not fabricate it. Security advisors retain prior helper notices; full-project completion remains open.


## Уточнение плана — 2026-10-20

[Полный V2 аудит](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) добавлен как 97 детализаций/приёмочных пакетов существующих требований. Исторические факты и таблица выше не переписаны. Источники 20 октября сверены на `04ec74bf955c29799ab535c043a33c1f9296c309`; новые runtime/device проверки этим не выполнены. Customer/AI/commercial gates отдельны, Android deferred, delivered modules не переоткрываются.
