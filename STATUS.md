# STATUS — AISTROYKA

Обновлено 2026-10-11. Статусы ниже — датированное наблюдение; перед действием обновите GitHub и health.

| Что | Где проверить |
|---|---|
| Актуальный исходный код | `git fetch --no-prune origin` → `origin/main` (снимок этой сверки `729126d4`) |
| Рабочая папка Mac | `/Users/alex/Projects/AISTROYKA-main-clean`; [START_HERE](START_HERE.md) |
| Активная очередь | [реестр PR](docs/tasks/ACTIVE_WORK_REGISTRY.csv) |
| Завершённое продолжение | Stakeholder intake tenant [#411](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/411) объединён; list/submit/withdraw передают `project_id` |
| Следующий этап | Изолированная проверка RPC, intake и новой защиты статусов; создание тестовой ветки и live DB apply — отдельные OWNER_GATE |
| Публикация | `/api/v1/health` production и staging; повторная проверка 2026-10-11: оба HTTP 200, `813c6ae` — #411 опубликован; публикация последующих docs-коммитов проверяется отдельно |

В main: #413 защита переходов intake (миграция ещё не применена), #410 актуальный intake runbook/SQL evidence, #411 stakeholder intake tenant, #406 withdraw intake, #405 submit, #409 STATUS queue, #408 D1 Android audit, #404 PATCH intake, #407 ROMA-VER-009 advisory. #403 viewer-replay ранее. A2–A5, video authz #386, vision #385 уже в main. Очередь intake 005A (PATCH/submit/withdraw) закрыта в коде.

Не реализовывать заново. OWNER_GATE: live apply `create_analysis_job` 4-arg и `customer_intake_drafts`; stores; billing cutover; LEGAL; live AI E1. 005B live intake не начинать. 317/348/352 закрыты как заменённые более новой реализацией после сверки и 27 профильных тестов; не restack. #347/#351 закрыты после проверки: все изменённые файлы побайтово совпадают с main; ветки сохранены. B2 daily-log persist уже в cabinet (`persistThenConfirmFieldDailyLog`). D2 Android не стартовать.

Пилотный scope остаётся `contractor-ops-only`. DAG 100% не закрыт внешними гейтами.
