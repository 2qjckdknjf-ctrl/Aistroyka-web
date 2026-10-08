# AISTROYKA — панель проекта

Обновлено 2026-10-05. Начало работы: [START_HERE](START_HERE.md). Статус: [STATUS](STATUS.md).

| Очередь | Уже в main | Продолжить существующее |
|---|---|---|
| Customer iOS | #372 основание/auth, #375 список/детали, #382 portal estimates/requests | Device smoke + deploy `buildStamp` after #382 |
| Construction Graph | #373 чтение, #376 overlay persistence | Overlay tables present on live DB; live-сценарий still open |
| Vision | #374 lifecycle, #377 async jobs | [#385](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/385) atomic `request_key`; live RPC still 3-arg |
| Intake | #378 draft intake | `customer_intake_drafts` not on live DB (`OWNER_GATE`) |
| Agentic, Site Intelligence, AI Flywheel, старые UI/mobile | Сверять конкретную функцию | [реестр](docs/tasks/ACTIVE_WORK_REGISTRY.csv), без новой параллельной реализации |

Открытые PR и статусы меняются. Перед продолжением проверить текущий HEAD, base, замечания review и обязательные проверки. Закрытие старого PR как заменённого не является подтверждением live-сценария.

Сохранённая локальная работа: основная старая папка, mobile-store-m1, Agentic, TestFlight и семь Cursor worktrees. Есть проверенные локальные резервные копии; эти папки не очищены и не сброшены. Чистые завершённые временные папки перенесены в архив с сохранением содержимого и истории.

Правило завершения: код в ветке → проверка → main → staging → production; отдельно БД и номер мобильной сборки. Подробности: [RESULT](docs/reconciliation/workspace-2026-10-04/RESULT.md).
