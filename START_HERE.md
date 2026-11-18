# AISTROYKA — начать здесь

Основной репозиторий: `2qjckdknjf-ctrl/Aistroyka-web`. Актуальный код определяется `origin/main`, а не названием локальной папки.

Рабочая точка на этом Mac: `/Users/alex/Projects/AISTROYKA-main-clean`.

0. Для выбора работы используйте [единую очередь на 2026-10-23](docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#действующая-очередь--консолидация-2026-10-23): она сохраняет Phase/AIS/V2, различает main/PR/live и заменяет дубли ежедневных рекомендаций.

1. Прочитайте [STATUS](STATUS.md), [панель проекта](PROJECT_DASHBOARD.md) и [реестр незавершённой работы](docs/tasks/ACTIVE_WORK_REGISTRY.csv).
2. Перед началом задачи выполните проверку:

```sh
python3 scripts/ops/workspace_preflight.py --refresh
# Для продолжения: подставьте номер ОТКРЫТОГО PR из актуального реестра.
# Сначала перейдите в его чистую рабочую папку и ветку.
read -r PR_NUMBER
python3 scripts/ops/workspace_preflight.py --refresh --resume-pr "${PR_NUMBER:?Введите номер открытого PR}"
```

`CURRENT_BASELINE` подтверждает актуальность исходной ветки. Это не проверка готовности функций. `RECONCILE_FIRST` требует сверки ветки или сохранения локальных изменений; не начинайте ещё одну реализацию.

3. Найдите идентификатор требования, его PR, текущий удалённый HEAD и локальный остаток. Продолжайте существующую реализацию. Для доработок из аудита используйте [интеграцию V2](docs/roadmap/AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) → existing Phase/AIS → один пакет и его acceptance; все 97 карточек уже включены в основной план.
4. Для новой согласованной задачи создайте отдельную ветку от обновлённого `origin/main`; не переключайте занятую или грязную папку.
5. Закрывайте задачу через проверки → защищённое объединение → проверку staging → учёт БД/мобильной сборки → подтверждение публикации.

Customer iOS, Graph persistence, async Vision/request_key и ручной intake CRUD уже в main. Live intake/RPC/private-helper миграции применены 2026-10-11. Не повторяйте их из-за несовпадающих remote IDs: [receipts и проверка перед миграцией](docs/ops/VERIFIED_DB_MIGRATION_RECEIPTS.md). Состояние разработки: [актуальная сверка плана](docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md), [операционный отчёт](docs/reports/2026-10-11-operational-closure.md). Физическое device smoke, AI scope extraction и оставшиеся semantic-review PR проверяются отдельно. Старые датированные TODO не являются доказательством отсутствия кода.

`/Users/alex/Projects/AISTROYKA` хранит общий Git и старую незаписанную работу. Это сохранённый исходник, а не актуальный кабинет. Старые датированные аудиты являются историей.

Архив: `/Users/alex/AISTROYKA-archive/2026-10-04`. Приватные снимки могут содержать секреты; они остаются только локально.

Подробности: [отчёт о наведении порядка](docs/reconciliation/workspace-2026-10-04/RESULT.md), [правила работы](docs/dev-os/ACTIVE_WORK_RULES.md).

Полный повторный аудит 19 октября включён в план 20 октября: [отчёт/структура/архитектура и backlog](docs/roadmap/product-experience-audit-2026-10-19/README.md), [старт Cursor](docs/roadmap/product-experience-audit-2026-10-19/CURSOR_START_RU.md). Это уточнение исполнения, не новый runtime PASS; старые Phase/AIS и scope пилота сохранены.
