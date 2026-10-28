# STATUS — AISTROYKA

## Актуальная плановая сверка — 2026-10-28

Локальный conveyor Oct-23 закрыт: [closure](docs/reports/conveyor-closure-2026-10-28/RESULT.md). Merged #446/#447/#457/#448/#449/#458/#453/#455/#459/#454. Hosted SQL applied (grants, `platform_job_id`, human review). Durable result + manager review + accepted Graph lineage + C04 cores в main.

Stage2a A01–A05 storage/API shipped locally through A05 commercial bind (see [A05 RESULT](docs/reports/stage2a-a05-commercial-quantity-bind-2026-10-28/RESULT.md)); AIS-CLIENT-005A extractor + Manager review UI merged. Async video executor (#461) в main; live Gemini fixture отдельно. Live Worker fixture / legal / store / billing 7-day — `BLOCKED_EXTERNAL`/`OWNER_GATE`. [Очередь](docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#действующая-очередь--консолидация-2026-10-23).

## Дополнение 2026-10-20 — полный аудит включён в план

**Текущая задача документации:** `docs/aistroyka-audit-v2-plan-2026-10-20`. [Task](docs/tasks/2026-10-20-audit-v2-plan-integration.md), [handoff](docs/handoff/2026-10-20-audit-v2-plan-integration.md), [интеграция 97 пакетов](docs/roadmap/AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md). Состояние: открыт [PR #453](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/453) (docs-only); текущий HEAD всегда получать из GitHub PR. Ни один V2 implementation/runtime/release gate этим не закрывается. Следующий docs слой — [PR #455](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/455) (Oct-23 evidence/materials queue), stacked on #453.

Факты сверены 2026-10-28 после protected merges: #446/#447/#457/#448/#449/#458. Hosted SQL applied for private-helper grants, `ai_analysis.platform_job_id`, и human-review columns. Durable report-media persist + manager review gate в main; Graph lineage/video/live Worker fixture остаются следующими. Legal/store/billing/time gates сохраняются.

## Исторический операционный снимок 12 октября

Факты сверены 2026-10-12. Последний наблюдённый main: `ec0c2c6f333b21a44684ea944fe90d9f973a158d` (#444). Текущий main при продолжении определяется свежим `origin/main` и GitHub. Исторические доказательства оригиналов: #437, 13 живых HTTP-проверок PASS; следующие изменения очереди имеют отдельные отчёты.

Текущий проверенный runtime: staging/apex/www `ec0c2c6` (#444), staging 38203225218 / production 38203511775 SUCCESS. #444 required CI 38202800356 SUCCESS, final HEAD 3e8338c5, точное независимое одобрение и защищённое объединение. #443: четыре live handler/SDK reconciliation проверки PASS; четыре session rows и два PNG удалены.

Активная задача: `fix/platform-maintenance-lease-recovery-2026-10-12` в архивной рабочей папке runtime verification. 83 job/route теста и четыре native PostgreSQL recovery контракта PASS; [recovery proof](docs/reports/platform-maintenance-recovery-2026-10-12/RESULT.md). Две точные старые блокировки QA возвращены в queued с аудитом; шесть старых maintenance claims других компаний ждут защищённого rollout/restore. Один AI job с существующим report/attachment удерживается до durable-result/idempotency контракта. Recovery helper исключает AI и push. После этого — [сохранение report-media результатов](docs/audit/2026-10-12-report-media-result-hard-audit.md), human review/Graph/video и reviewed preproject extraction. Получить свежие main/PR/registry и preflight перед продолжением.

| Контур | Факт | Следующая работа |
|---|---|---|
| Оригиналы и доступ | #433/#434 вызвали runtime-регрессию; #436 локализовал stream_open; #437 исправил несовместимый redirect:error. Пять реальных SDK/Workerd контрактов и 13 живых PNG/Proof Pack/PDF/revocation проверок PASS | Проверить production и свежий SHA после последующих публикаций |
| Публикация | #432 web/API/unique-source rollout доставлен; #435 native Manager реализован, live simulator 1/1 PASS и независимый readback published=false; три приложения smoke PASS на предыдущем HEAD | CI/review #435 завершены; серверный runtime подтверждён; API flow 12/12 PASS, camera/native Worker UX отдельно |
| Customer | #431 web/iOS gallery и live simulator image decode PASS | iPhone wired/Developer Mode, Debug build PASS; два UI initialization timeout, 0 tests. Ожидается UI Automation readiness. Camera/manual keyboard/OAuth/push/offline/store отдельно |
| Vision | #438 исправил transport; живой job завершён, один результат привязан к media/job/tenant; strict provider gate exit 0, fallback 0 | Durable audit PASS в #439; report-media handler пока отбрасывает результат. Lease/source-safe persistence и human review → video/Graph lineage |
| БД и очистка | 11 источников / 10 remote IDs в receipts, 199 записей истории; в этом срезе новых DDL нет. Свежий тестовый PNG/PDF/share/document, восемь записей и Auth удалены; task sessions закрыты | Historical full-reset/drift отдельно; до каждого apply свежий receipt preflight, применённый SQL неизменен |
| План | Ручной intake, async request_key, Graph persistence и Customer уже существуют | Source-linked Vision/Graph → reviewed preproject extractor; Android D2/live camera после зависимостей. Legal/store/billing 7-day gates требуют реальных внешних/временных доказательств |

[Worker API proof](docs/reports/worker-publication-flow-2026-10-12/RESULT.md), [Async Vision live proof](docs/reports/async-vision-live-2026-10-12/RESULT.md), [Runtime repair](docs/reports/private-original-runtime-2026-10-12/RESULT.md), [native Manager](docs/reports/manager-native-publication-2026-10-12/RESULT.md), [registry](docs/tasks/ACTIVE_WORK_REGISTRY.csv), [plan/fact](docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md), [receipts](docs/ops/VERIFIED_DB_MIGRATION_RECEIPTS.md). 74 старых смешанных PR требуют semantic review; dirty/ahead/release/cursor источники сохранены. Полная готовность проекта остаётся открытой. [Physical gallery](docs/reports/customer-physical-gallery-2026-10-12/RESULT.md).

Отдельный локальный срез 2026-10-13: C04 computational parity — PR #449 на `feat/stage2a-calculation-parity-2026-10-13` после merge #448. Чистое quantity/commercial ядро и синтетические сценарии готовы к review; targeted tests, lint и TypeScript PASS. Хранение, API и Manager/Worker интеграция остаются A01–A05; публикация и independent real-data C05 не подтверждены. [Контракт и ограничения](docs/roadmap/STAGE2A_C04_QUANTITY_ENGINE_2026-10-13.md), [задача](docs/tasks/2026-10-13-stage2a-calculation-parity.md), [handoff](docs/handoff/2026-10-13-stage2a-calculation-parity.md).

Пилотный scope остаётся `contractor-ops-only`. DAG 100% не закрыт внешними гейтами.

PR #350: [планирование Customer / ROMA](docs/handoff/2026-09-23-roadmap-consolidation.md), сверка 2026-10-13 — [product](docs/roadmap/AI_DIGEST_RECONCILIATION_2026-10-13.md) / [ROMA](docs/roma/AI_DIGEST_RECONCILIATION_2026-10-13.md). Planning changes не подтверждают новый runtime/deployment.
