# AISTROYKA — начать здесь

Основной репозиторий: `2qjckdknjf-ctrl/Aistroyka-web`. Актуальный код определяется `origin/main`, а не названием локальной папки.

Рабочая точка на этом Mac: `/Users/alex/Projects/AISTROYKA-main-clean`.

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

3. Найдите идентификатор требования, его PR, текущий удалённый HEAD и локальный остаток. Продолжайте существующую реализацию.
4. Для новой согласованной задачи создайте отдельную ветку от обновлённого `origin/main`; не переключайте занятую или грязную папку.
5. Закрывайте задачу через проверки → защищённое объединение → проверку staging → учёт БД/мобильной сборки → подтверждение публикации.

Customer iOS #375/#382, Graph persistence #376, async Vision #377, Intake #378 и Vision `request_key` #385 уже в main. Открытая очередь: [#386](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/386) (tenant auth для unscoped video). Apply RPC `p_request_key`, таблицы intake и device smoke остаются OWNER_GATE / отдельными проверками. Agentic/старые дизайн- и мобильные ветки остаются в реестре на сверку.

`/Users/alex/Projects/AISTROYKA` хранит общий Git и старую незаписанную работу. Это сохранённый исходник, а не актуальный кабинет. Старые датированные аудиты являются историей.

Архив: `/Users/alex/AISTROYKA-archive/2026-10-04`. Приватные снимки могут содержать секреты; они остаются только локально.

Подробности: [отчёт о наведении порядка](docs/reconciliation/workspace-2026-10-04/RESULT.md), [правила работы](docs/dev-os/ACTIVE_WORK_RULES.md).
