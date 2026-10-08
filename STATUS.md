# STATUS — AISTROYKA

Обновлено 2026-10-08. Статусы ниже — датированное наблюдение; перед действием обновите GitHub и health.

| Что | Где проверить |
|---|---|
| Актуальный исходный код | `git fetch --no-prune origin` → `origin/main` (снимок этой сверки `3adcabfe`) |
| Рабочая папка Mac | `/Users/alex/Projects/AISTROYKA-main-clean`; [START_HERE](START_HERE.md) |
| Активная очередь | [реестр PR](docs/tasks/ACTIVE_WORK_REGISTRY.csv) |
| Открытое продолжение | Stakeholder intake tenant [#411](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/411) — list/submit/withdraw `project_id` parity; нужен non-author APPROVED + `check` SUCCESS на текущий HEAD |
| Публикация | `/api/v1/health` production и staging; SHA в Git не доказывает развёртывание |

Сегодня в main: #406 withdraw intake, #405 submit, #409 STATUS queue, #408 D1 Android audit, #404 PATCH intake, #407 ROMA-VER-009 advisory. #403 viewer-replay ранее. A2–A5, video authz #386, vision #385 уже в main. Очередь intake 005A (PATCH/submit/withdraw) закрыта в коде.

Не реализовывать заново. OWNER_GATE: live apply `create_analysis_job` 4-arg и `customer_intake_drafts`; stores; billing cutover; LEGAL; live AI E1. 005B live intake не начинать. 317/347/348/351/352 — RECONCILE_BACKLOG, не restack. B2 daily-log persist уже в cabinet (`persistThenConfirmFieldDailyLog`). D2 Android не стартовать.

Пилотный scope остаётся `contractor-ops-only`. DAG 100% не закрыт внешними гейтами.
