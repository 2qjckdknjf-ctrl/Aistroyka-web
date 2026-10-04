# STATUS — AISTROYKA

Обновлено 2026-10-05. Статусы ниже — датированное наблюдение; перед действием обновите GitHub и health.

| Что | Где проверить |
|---|---|
| Актуальный исходный код | `git fetch --no-prune origin` → `origin/main` (снимок после #382 `ee162ea4`) |
| Рабочая папка Mac | `/Users/alex/Projects/AISTROYKA-main-clean`; [START_HERE](START_HERE.md) |
| Активная очередь и backlog | [единый реестр PR](docs/tasks/ACTIVE_WORK_REGISTRY.csv) — обновить HEAD/state перед продолжением |
| Завершённая сверка папок | [workspace reconciliation](docs/tasks/2026-10-04-workspace-reconciliation.md), объединена через #381/#383/#384 |
| Следующее существующее продолжение | Vision atomic `request_key` [#385](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/385); merge blocked on non-author current-head approval |
| Сохранение/архив/дубликаты | [результат](docs/reconciliation/workspace-2026-10-04/RESULT.md) |
| Публикация | `/api/v1/health` production и staging; 2026-10-05 still `buildStamp.sha7=2c44b53` — #382 not yet proven deployed |

Код #371, #373 (Construction Graph read slice), #374 (Vision lifecycle) уже в базовом main. Во время уборки также объединено основание Customer iOS #372. Не реализовывать заново по старым TODO. #375 (Customer iOS список/детали), #376 (Graph persistence), #377 (async Vision start), #378 (Intake) и #382 (Customer portal estimates/requests) также уже в main. Live DB: Graph overlay tables present; `analysis_jobs.request_key` present; `create_analysis_job` still 3-arg until #385 is applied; `customer_intake_drafts` absent (`OWNER_GATE`). Agentic и остальные незавершённые задачи искать в реестре.

Пилотный scope остаётся `contractor-ops-only`, классификация `production-capable / controlled-pilot candidate`. Первый срез Graph/lifecycle не означает полноту продукта, portal READY или Public GA.

Внешние проверки: применённость новых миграций и отрицательные проверки доступа; portal/finance E2E; физические устройства; юридические тексты; реальные growth cohorts; магазинные и billing cutover gates. Эти статусы не закрываются уборкой репозитория. Исторические сведения о БД и live AI находятся в аудите #371; новая сертификация в этой задаче не выполнялась.

Снимки 100% программы: [аудит](docs/audit/AISTROYKA_100_PERCENT_COMPLETION_AUDIT_2026-10-03.md), [матрица требований](docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv), [план зависимостей](docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md). Это исходные датированные материалы; текущие этапы реализации фиксируются в реестре и handoff.
