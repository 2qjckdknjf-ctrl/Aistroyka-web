# Phase 3 — Worker + iOS pilot flow (отчёт)

**Дата:** 2026-04-27  
**Основание:** `AISTROYKA_TZ.md` §10 Phase 3 — контур  
`login → bootstrap → task → day start → report → media upload → finalize → submit → manager review`.

---

## A. Статус фазы

| Поле | Значение |
|------|----------|
| **Статус** | **PARTIAL** |
| **Следующая фаза разрешена** | **YES** — при условии live/device прогона для закрытия NEEDS_LIVE_VERIFICATION |

---

## B. Backend (`/api/v1`) — соответствие контуру

| Шаг контура | Маршрут v1 | Тесты в репо (пример) |
|-------------|------------|------------------------|
| Конфиг / публичные настройки | `GET …/config` | `config/route.test.ts` |
| Список проектов (worker context) | через общие projects / worker | частично через worker route tests |
| Задачи на день | `GET …/worker/tasks/today` | worker API |
| Старт / конец дня | `POST …/worker/day/start`, `…/end` | Zod-схемы + маршруты |
| Создание отчёта | `POST …/worker/report/create` | + contracts |
| Сессия загрузки | `POST …/media/upload-sessions`, `POST …/finalize` | `upload-sessions/**/*.test.ts` |
| Привязка медиа к отчёту | `POST …/worker/report/add-media` | |
| Submit | `POST …/worker/report/submit` | + idempotency |
| Sync | `GET …/sync/bootstrap`, `GET …/sync/changes`, `POST …/sync/ack` | `sync/*.test.ts` |
| Устройство push | `POST …/devices/register` | `devices/*.test.ts` |
| Manager review | `PATCH …/reports/[id]` | отчёты + домен |

**Итог по коду:** цепочка **представлена** в API и покрыта **частью** автотестов; полное «зелёное» подтверждение без **живой** БД и E2E не заявляется.

---

## C. iOS Worker (`ios/AiStroykaWorker` + `Shared`)

### C.1. База URL

`Config.apiBaseURL` → `{BASE_URL}/api/v1` (`ios/Shared/Sources/Shared/Config.swift`).

### C.2. Заголовки (ТЗ §6.2)

| Заголовок | Реализация |
|-----------|------------|
| `Authorization: Bearer` | `APIClient` |
| `x-device-id` | `DeviceContext.deviceId` |
| `x-idempotency-key` | на mutating-вызовах |
| `x-client` | `ios_lite` (Worker) / `ios_manager` (Manager) |

### C.3. Соответствие `WorkerAPI.swift`

Реализованы вызовы относительно v1:

- `config`, `projects` (через общий контракт списка)
- `devices/register`
- `worker/tasks/today`
- `worker/day/start`, `worker/day/end`
- `worker/report/create`, `add-media`, `submit`
- `media/upload-sessions`, `media/upload-sessions/:id/finalize`
- `sync/bootstrap`, `sync/changes` (обработка **409** и `serverCursor`), `sync/ack`

Загрузка в Storage: прямые URL **`/storage/v1/object/media/...`** (Supabase), согласовано с типичной схемой signed/upload path.

### C.4. Ограничения (известные)

| Тема | Статус |
|------|--------|
| Видео в Worker | **не** в Swift-пайплайне (JPEG/фото) |
| Текстовый комментарий к отчёту | **не** выделен в UI/модели (см. `docs/launch/FIRST_CLIENT_SCOPE_LOCK.md`) |
| `xcodebuild` в CI репо | **нет** workflow на iOS в PR CI; **нет** `.xcodeproj` в снимке workspace — риск воспроизводимости |

---

## D. Manager review (кросс-проверка)

- iOS `ManagerAPI` документирует `GET/PATCH /api/v1/reports/:id` и статусы ревью — см. `ManagerAPI.swift`.
- Семантика **`rejected` vs `reviewed`** — зона **P1** из `docs/tz/00_OPEN_BLOCKERS.md`; требуется сверка с миграцией `report_reject_semantics` и web.

---

## E. Приёмка Phase 3 (по ТЗ)

| Критерий | Статус |
|----------|--------|
| Full worker flow в backend tests | **PARTIAL** — ключевые куски есть, единого E2E «всё дерево» может не быть |
| iOS build/runtime verified | **NEEDS_LIVE_VERIFICATION** |
| Manager видит отчёт и может ревьюить | **PARTIAL** (код + часть тестов); device не гонялся в этом отчёте |
| Нет утечки чужих отчётов | **PARTIAL** — RLS/tenant в коде; нужен security/live pass |

---

## F. Рекомендации

1. Один **обязательный** прогон: iOS симулятор или устройство против **staging** — чеклист из ТЗ, лог `request_id` из ответов.
2. Зафиксировать в Maestro/доке сценарий «full contour» если уже есть `maestro/flows/*`.
3. Закрыть или явно отложить видео/комментарий Worker на уровне продукта.

---

## G. Шаблон ТЗ §12

- **PHASE STATUS:** PARTIAL  
- **NEXT PHASE ALLOWED:** YES  
- **NEXT WORKSTREAM:** Phase 4 (documents) + live iOS прогон вне агента
