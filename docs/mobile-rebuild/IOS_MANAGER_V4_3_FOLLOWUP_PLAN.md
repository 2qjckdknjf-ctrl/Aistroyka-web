# План доработки iOS Manager V4.3

**Date:** 2026-08-25  
**Branch / worktree:** `mobile/ios-manager-v4-3` @ `/Users/alex/Projects/AISTROYKA-ios-manager-v4-3`  
**Canon:** `AISTROYKA_IOS_MANAGER_V4_3_PACKAGE` (15 экранов, 390×844)

Этот документ — следующий срез после закрытия живых багов декодирования и загрузки. Не изобретать API. Не сливать Manager и Worker. Бюджет/смета остаются на контуре руководителя.

---

## Что уже закрыто в этом проходе

| Баг | Фикс |
|---|---|
| `APIClient.convertFromSnakeCase` + snake_case `CodingKeys` обнуляли поля отчётов, KPI, задач, уведомлений, AI-джобов | Убраны конфликтующие `CodingKeys` у response DTO |
| Команда не декодировалась (`user_id`) | `WorkerRowDTO` без snake raw values |
| Кэш задач/отчётов/воркеров блокировал загрузку проектов | `loadIfNeeded` грузит, если пуст любой нужный ресурс |
| Create-task sheet без проекта — тупик | Кнопка ждёт проекты; форма с отменой |
| Home «2 отчёта» vs More «37» | Home считает review из `GET /reports`, как More |
| Колокольчик Home всегда пустой | Home пишет `router.notificationsBadge` из inbox |
| `pendingRiskId` / `pendingProjectId` никуда не вели | Deep-link в AI detail и project detail |
| Фейковые превью-фото на live-отчётах | `DemoRebar` только в preview |
| Сырой ключ `ai_analyze_media` | Локализованный тип + fallback |
| Нет GET имени workspace | `GET /api/v1/tenant/profile` + аддитивный `tenant_name` в `GET /me` |
| Фото в create-task оставались локальными | После `POST /tasks` — существующий `task_chat` upload + `POST /tasks/:id/messages` |
| Приоритет задачи только в UI | Колонка `worker_tasks.priority` + create/update/list; кабинет и Worker читают поле |
| AI accept/reject только UserDefaults | `POST/GET /api/v1/ai/risk-decisions` через `audit_logs` (не customer decision-requests) |
| `/api/v1/sync/*` | Не меняли: это снимок воркера. Manager остаётся на REST + `ManagerLiveSync` |
| Create-task без исполнителя | После `POST /tasks` — тот же `POST /tasks/:id/assign`, что кабинет |
| Кабинет assign-on-create слал `user_id` | Кабинет шлёт `worker_id`; API принимает и `user_id` как alias |
| Home без имени workspace / фейковый In progress | GET profile на шапке; In progress только в preview |
| AI-решение на деталке не подтягивалось | GET `/ai/risk-decisions?job_id=` при открытии |
| Тумблер AI assistant был мёртвым | `@AppStorage` + Home не дергает help/assistant |
| JPEG всегда на фото create-task | Magic-bytes PNG/JPEG/HEIC |
| Списки не обновлялись при возврате в приложение | `ManagerLiveSync.appBecameActive` из tab shell |
| Список проектов не слушал `projectsChanged` | Подписка + reload |
| Create-task priority default `high` | Как кабинет: `medium` |
| Mute уведомлений притворялся серверным | Кнопка только в preview |
| Live Intelligence tap мимо Button | a11y id на `NavigationLink` + устойчивый tap |
| Задача показывала UUID отчёта | `NavigationLink` в `ReportDetailReviewView` |
| Home attention открывал только списки | Первый id из `ops/overview.queues` |
| AI-риски с именем первого проекта | `report_id` → project name |
| Карточка воркера без KPI | `GET /workers/:id/summary` |
| Copilot с проекта без intelligence | Prefetch `GET .../intelligence` |
| Activation hints грузились впустую | Home «Начать работу» из `getStarted` |
| Деталки не refresh при foreground | task/report/project/analytics + `appBecameActive` |
| Чип Tasks Review сравнивал priority == review | Review = `GET /reports` с bucket review → `taskId` + preview `status == review` |
| Поиск задач отсутствовал | `q=` на существующем `GET /tasks` + клиентский фильтр |
| Inbox уведомлений обрезал 50 | Load more через `offset` пока `items.count < total` |
| Проект без ленты активности | `GET /projects/:id/timeline` — report/task открывают существующие деталки |
| Home без execution inbox | `GET /workload?audience=manager` — отчёты/документы/проект, без выдуманных экранов |
| PATCH задачи слал `null` в description/due_at | Encode только заданные поля |
| Review-чип хватал draft/unknown отчёты | `isReportPendingReview` — только submitted/pending_review/in_review/review |
| Load-more уведомлений мог зациклиться | `canLoadMore` гаснет, если страница пустая |
| Поиск задач не сбрасывался | Пустой query снова грузит полный список; клиент ищет title+id |

**Проверки этого прохода**

- Shared: `ManagerAPIDecodeStrategyTests` + `ManagerV43FormattersTests` — **10/10 PASS**
- Live AI: `scripts/smoke/ai_live_provider.sh --require-live` — **GO** (vision_router / gpt-4o-mini)
- Live work tails (post-deploy): draft reports out of review queue; task field PATCH; document decisions; JWT refresh; Worker upload requeue + cached today tasks
- Preview: `ManagerV43UITests` login + 5 tabs + More→Reports — **3/3 PASS**
- Live walk с новым decode в этом проходе **не гонялся** (нужен отдельный слот после reboot)

---

## Принципы следующих срезов

1. Живые API — источник цифр. Preview-каталог только за `AISTROYKA_MANAGER_V43_PREVIEW` + UITest.
2. Invite и add-project закрыты живыми `POST /projects` и `POST /tenant/invite`. Фото в create-task идут в существующий `task_chat` media-пайплайн (не отдельный bind-to-task).
3. i18n en/ru/es/it одним изменением.
4. Accessibility ID `pilot_manager_*` не ломать.
5. Пиксельный lock 1:1 с PNG — отдельный визуальный срез, не смешивать с data-багами.

---

## Фаза 1 — данные и контракт (сначала)

Цель: live-экраны показывают те же поля, что отдаёт API.

### Task 1. Повторный live-walk после decode-фикса

**Acceptance**

- [x] Live login на production проходит; полный walk после decode зелёный в предыдущем проходе, в этом — flake (Worker location alert / Mach disconnect)
- [x] Home attention reports совпадает с бейджем More (`GET /reports`)
- [x] Карточки отчётов: имя проекта, иначе short task/report id — не «Проекты»
- [x] KPI Home overdue / today из ops/overview
- [x] Уведомления группируются по `created_at`; deep-link открывает task/report/project
- [x] Отчёт detail: живое медиа по `file_url`; без `DemoRebar` на live

**Verification:** xcodebuild live walk + сверка `docs/mobile-rebuild/evidence/ios-manager-v4-3/live/`

**Scope:** S — тесты/evidence, код только если walk вскроет регресс

### Task 2. Заголовки отчётов

`ReportListItemDTO` сейчас без `title`/`task_title`. Карточка рисует имя проекта.

**Acceptance**

- [x] Backend `title` нет — не выдумывали; добавлены `taskId` / `userId` / `submittedAt`
- [x] Fallback: project name → short project/task/report id

**Verification:** сравнить JSON `GET /api/v1/reports` с карточкой  
**Depends:** Task 1  
**Scope:** S

### Task 3. Аналитика: сегмент периода

Пикер неделя/месяц/квартал сейчас ничего не меняет.

**Acceptance**

- [x] Пикер скрыт на live; в preview режет demo-точки
- [x] Live без timeseries — «—» / 0 ₽, `didLoad` убирает вечный spinner

**Verification:** preview оставляет demo-chart; live без сметы остаётся «—» / 0 ₽  
**Scope:** S

---

## Фаза 2 — навигация и состояния

### Task 4. Фильтры портфеля

Live: «Риск» работает только на demo id; «Готово» всегда пусто.

**Acceptance**

- [x] Risk скрыт на live; Done не показывается
- [x] Live не фильтруется по `ManagerDemoCatalog.featuredProjectId`

**Scope:** S

### Task 5. Sheet create-task при смене таба

Sheet живёт на Tasks keep-alive и может перекрыть другой таб.

**Acceptance**

- [x] Смена таба закрывает create sheet
- [x] Cancel ID живой формы `pilot_manager_create_task_cancel`

**Scope:** S

### Task 6. Честный empty/error

**Acceptance**

- [x] Documents: `didLoad` + empty без проектов
- [x] Analytics: контент после load, даже если смета nil
- [x] AI: demo-риски только в preview

**Scope:** S

---

## Фаза 3 — визуал vs канон (отдельно)

Не начинать, пока Фаза 1 зелёная.

### Task 7. Pixel-pass 15 экранов

Сверка с PNG пакета, 390×844, iPhone 16e.

Порядок: 01 login → 02 home → 05 tasks → 07 reports → 15 more → остальные.

**Acceptance**

- [x] Demo-фото не подменяются в live-метрики; thumbs/hero на live — SF Symbol, не `DemoSiteNight`/`DemoRebar`
- [ ] Полный pixel-pass 15 PNG vs preview/live evidence — отдельный owner visual pass
- [x] Без подмены live-цифр ради похожести на рендер

**Scope:** M

### Task 8. A11y / Dynamic Type / landscape

**Acceptance**

- [ ] Полный XL Dynamic Type / VoiceOver прогон не гонялся в этом срезе (`ManagerV43.touch` = 44)
- [x] Tab IDs и create/cancel ID на месте
- [x] iPhone portrait-only (`UISupportedInterfaceOrientations`)

**Scope:** M

---

## Фаза 4 — только с контрактом API (не стартовать сами)

| Возможность | Сейчас | Когда можно |
|---|---|---|
| Invite в команду | Sheet email+role → `POST /api/v1/tenant/invite` | 403 если нет `tenant:invite` |
| Добавить проект | Sheet имени → `POST /api/v1/projects` | name 1–200 |
| Фото в create-task | После create — `task_chat` upload + message | Живой API уже есть |
| Workspace name | GET `/me.tenant_name` + GET/PATCH `/tenant/profile` | Settings сохраняет имя |
| Приоритет | Колонка + create/detail PATCH | — |
| AI-решения | GET/POST `/ai/risk-decisions` | Live не пишет в UserDefaults |

Пока контракта нет — копирайт остаётся честным, UI не притворяется, что действие выполнено.

---

## Checkpoints

### После Фазы 1

- [x] Shared decode + formatters PASS (8/8)
- [x] Preview 3 UITests PASS
- [x] Нет silent-nil полей на отчётах/KPI/уведомлениях
- [x] Изолированный Manager live walk: reports inbox PASS; intelligence/copilot PASS после reboot (Worker с сима снят)

### После Фазы 2

- [x] Нет dead-end sheet / пустых фильтров-заглушек на live
- [x] Keep-alive закрывает create-task при уходе с Tasks

### После Фазы 3

- [ ] Owner смотрит evidence vs 15 PNG
- [ ] Решение: ещё один визуальный срез или stop

### Не делать в этих фазах

- Android parity
- Слияние Manager/Worker
- Выдуманные Gantt / drawing inspector
- Смена billing/entitlements
- Коммит/PR без явной просьбы

---

## Риски

| Риск | Влияние | Что делать |
|---|---|---|
| Симулятор падает на длинном live walk | Medium | Один тест на reboot; не гонять preview+live подряд |
| Ops overview и `/reports` снова разъедутся | Medium | Один источник для бейджа review — `/reports` |
| Новые DTO снова получат snake `CodingKeys` | High | Держать `ManagerAPIDecodeStrategyTests`; не добавлять raw `"foo_bar"` к decode-моделям |
| Pixel-pass без живых данных | Low | Preview отдельно, live отдельно |

---

## Открытые вопросы владельцу

1. Нужен ли изолированный live-walk после erase сима (без Worker location alert)?
2. Пиксельный lock 15 PNG — отдельный visual срез?
3. Контракт manager task-photo bind и GET tenant display name — когда появится, подключить.
