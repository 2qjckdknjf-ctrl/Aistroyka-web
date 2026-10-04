# STATUS — AISTROYKA

Обновлено 2026-10-04. Статусы ниже — датированное наблюдение; перед действием обновите GitHub и health.

| Что | Где проверить |
|---|---|
| Актуальный исходный код | `git fetch --no-prune origin` → `origin/main` (базовый снимок этой сверки `c81e12d8`) |
| Рабочая папка Mac | `/Users/alex/Projects/AISTROYKA-main-clean`; [START_HERE](START_HERE.md) |
| Активная очередь и backlog | [единый реестр PR](docs/tasks/ACTIVE_WORK_REGISTRY.csv) — обновить HEAD/state перед продолжением |
| Завершённая сверка папок | [workspace reconciliation](docs/tasks/2026-10-04-workspace-reconciliation.md), объединена через #381/#383 |
| Следующее существующее продолжение | Customer portal detail [#382](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/382), сверить текущий HEAD/review/CI перед продолжением |
| Сохранение/архив/дубликаты | [результат](docs/reconciliation/workspace-2026-10-04/RESULT.md) |
| Публикация | `/api/v1/health` production и staging; SHA в Git не доказывает развёртывание |

Код #371, #373 (Construction Graph read slice), #374 (Vision lifecycle) уже в базовом main. Во время уборки также объединено основание Customer iOS #372. Не реализовывать заново по старым TODO. При заключительной сверке #375 (Customer iOS список/детали), #376 (Graph persistence), #377 (async Vision start) и #378 (Intake) также уже объединены в main. Проверять публикацию, миграции и устройства; не повторять эти реализации. Agentic и остальные незавершённые задачи искать в реестре.

Пилотный scope остаётся `contractor-ops-only`, классификация `production-capable / controlled-pilot candidate`. Первый срез Graph/lifecycle не означает полноту продукта, portal READY или Public GA.

Внешние проверки: применённость новых миграций и отрицательные проверки доступа; portal/finance E2E; физические устройства; юридические тексты; реальные growth cohorts; магазинные и billing cutover gates. Эти статусы не закрываются уборкой репозитория. Исторические сведения о БД и live AI находятся в аудите #371; новая сертификация в этой задаче не выполнялась.

Снимки 100% программы: [аудит](docs/audit/AISTROYKA_100_PERCENT_COMPLETION_AUDIT_2026-10-03.md), [матрица требований](docs/audit/AISTROYKA_100_PERCENT_COMPLETION_MATRIX_2026-10-03.csv), [план зависимостей](docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md). Это исходные датированные материалы; текущие этапы реализации фиксируются в реестре и handoff.
