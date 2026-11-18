# AISTROYKA V2 — полный план доработки структуры, архитектуры и интерфейсов

> Перенос в действующий план: 20 октября 2026. Основной текст ниже — аудит/предложение от **19 октября** на указанном SHA, не новая runtime-проверка. [Текущие правила интеграции](../AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта 97 пакетов](CANONICAL_MAPPING_RU.md) имеют приоритет при выборе Phase, existing requirement и release scope. Относительные ссылки адаптированы; снимки экрана и журналы доступны в [исходном архиве](ARCHIVE_REFERENCES.md).

**19 октября 2026 · 97 пакетов · PROPOSED / NOT_IMPLEMENTED.**

Анализ привязан к `04ec74bf955c29799ab535c043a33c1f9296c309`. Выполнение в Cursor начинается со свежей сверки. [Отчёт](AUDIT_REPORT_RU.md) объясняет выводы и ограничения, [Excel](ARCHIVE_REFERENCES.md#archive-001) позволяет назначить owner и следить за статусами. Этот документ содержит полный текст всех 97 пакетов, включая шаги, критерии и проверки; JSON сохраняет исходные platform details.

## 1. Результат, который должен дать план

Надёжный цикл подрядчика: вход и правильное членство → назначенная задача → сохранённый отчёт с проверяемыми фото → подтверждённая отправка → проверка руководителем → исправление того же отчёта → принятый результат. Customer видит только отдельно опубликованные разрешённые версии. AI приносит сохраняемый проверяемый вывод по источнику; ручной рабочий процесс остаётся доступным.

Текущие продуктовые ограничения сохраняются: iOS основной мобильный контур, Android первый пилот deferred, Customer и широкая коммерческая подписка имеют отдельные gates. План Android готов к активации при изменении владельцем соответствующего scope, но не требует включать Android в ближайший iOS contractor pilot. Переписывание всего приложения, перенос на новый стек, новый Customer Android и полная parity не входят в текущий minimum.

## 2. Как читать и исполнять очередь

| Поле | Смысл |
|---|---|
| `V2-WEB / IOS / AND / ARCH / CON / PUB` | Номера пакетов этого аудита. Не заменяют canonical AIS-* и Phase 0–13 |
| `M00–M08` | Направления выполнения. Не девять новых продуктовых фаз и не обязательные последовательные барьеры |
| `topological_order` | Допустимый порядок обязательных зависимостей. Baseline требуется перед каждым срезом независимо от номера |
| `depends_on` | Обязательные предпосылки реализации; 197 связей, циклов не обнаружено |
| `release_dependencies` | 6 условных связей конкретных release-срезов; читать условие, не блокировать всю задачу автоматически |
| `early_slice` | Часть работы, которую можно закончить раньше полного интеграционного результата |
| `owner` | Конкретный исполнитель; поле оставлено пустым для назначения |
| `suggested_owner` | Предлагаемая компетенция владельца; не назначение реального человека |
| `effort` | Ориентир сложности/локальная предварительная оценка; требует уточнения на текущем коде |
| `PROPOSED / NOT_RUN` | Работа ещё не реализована; перечисленный тест ещё не выполнен |

**В Excel рабочие статусы задач:** PROPOSED, IN_PROGRESS, BLOCKED, DONE, DEFERRED. Результаты проверок записываются отдельно: NOT_RUN, IN_PROGRESS, PASS, FAIL, BLOCKED, SKIP. `DONE` не подтверждает выпуск, а `SKIP` не считается успешной проверкой обязательного сценария.

В handoff дополнительно различать **Implemented → Verified → Released**: наличие кода, доказательства на указанной сборке и контуре, отдельно подтверждённую доставку. Если нужны статусы READY или эти подробные стадии в самом трекере, согласовать расширение его workflow; в текущем Excel такого списка нет. Галочка в плане не заменяет build/test evidence.

Все 73 finding IDs связаны с задачами, но количество findings и задач различается: одна проблема может затрагивать несколько клиентов, а одна задача — закрывать несколько связанных замечаний. В план включены также integration/validation пакеты для существующих возможностей, а не только новые функции.

## 3. Единственный владелец каждого общего контракта

| Область | Где реализуется один раз | Что реализуют платформенные задачи |
|---|---|---|
| Durable operation outcome / business dedup | **CON-01**, owners соответствующих backend writers | Сохранённый intent/key/body/owner, UI стадий, разрешённый retry/readback |
| Worker bootstrap, `/me` allow-list | **CON-02** + policy ARCH-07 | Общие fixtures и платформенные модели auth/role recovery |
| Media identity/revision/correction append | **CON-03** | Собственные local files, preview, upload steps, gallery и review |
| `/api/v1/reports` pagination/filter/count | **CON-04** | Reports inbox consumers. Tasks и прочие bounded collections остаются в своих задачах |
| SYNC-CONTRACT / REPORT-POLICY | **ARCH-04**, отдельные backend sync/reports owners | Swift/Kotlin apply/reconciliation, task/unit/day compatibility |
| Persisted AI completion | **ARCH-05**, один canonical executor/result contract | IOS-22 / WEB-11 и соответствующая result-area WEB-12 |
| Audience/access/projection | **ARCH-07** + существующие API/RLS | Видимые capabilities, явное denied/revoked, безопасный route fallback |
| Read models/cache scope | **ARCH-06** | Ключи environment/app/principal/tenant/resource и truthful stale/count |

Результат report AI не реализуется второй раз в CON-01. CON-01 не обещает общую транзакцию для DB/Storage/AI. CON-03 сохраняет existing purpose `report_before/report_after`; correction после link по умолчанию append. Изменение linked source/supersede требует явного дополнительного решения с audit и invalidation.

**Поправка по существующим PR:** свежий список файлов #446 подтверждает private media resolver/source binding, но не durable AI completion. В ARCH-05 сначала сверить actual diff и найти подходящий срез persistence; не расширять resolver PR молча до другой задачи. #449 построен поверх #448. Все шесть проверенных #446–451 на момент квитанции OPEN/DRAFT, не merged. Подробности: [pr-overlap-recheck.json](ARCHIVE_REFERENCES.md#archive-002). Исходные AC и зависимости от этой поправки не изменяются.

`CON-05` role-aware help — условная идея, **исключена из 97 пакетов и критического пути**. Сначала контекстные локальные подсказки. `WEB-30` — **INTEGRATION_VALIDATION_ONLY** над PUB-01–08: не выполнять public CSS/content исправления повторно и не оценивать их второй раз.

### Уточнённые зависимости

- IOS-19 зависит от CON-04 только для интеграции report inbox/list/count. Проектирование и реализация отдельного review detail не ждут этого endpoint.
- IOS-17 и WEB-12 не имеют обязательной зависимости от reports pagination. WEB-12 AI result area имеет отдельный release gate ARCH-05; ручной evidence viewer можно поставить раньше.
- Без доказанного outcome/dedup автоматический повтор неизвестного write result не разрешается. Допустимо сохранить ввод, показать NeedsReconciliation и реализовать readback без второго эффекта.
- IOS-30 описывает полную программу проверок. Contractor-ops, Customer и AI release slices должны фиксироваться отдельно; весь Customer/AI объём не становится обязательной предпосылкой текущего contractor pilot.

## 4. Рабочие направления

| Волна | Практический результат | Предлагаемые владельцы | Условие выхода |
|---|---|---|---|
| M00 | Воспроизводимый baseline; task create loop; public hero/CTA/pricing/docs; diagnostic exposure | Web, QA, release owner | Точечные изменения доказаны на текущем render; нет ложного whole-product PASS |
| M01 | Общие типы, identity, access, context, 4 server contracts | Backend/domain lead, Web/iOS, Android при включении | Contract fixtures и owner matrix совместимы; legacy поддержка определена |
| M02 | Долговечный Worker draft/media/report/correction/sync | iOS + backend; Android отдельным minimum | Process death/timeout/late callback сохраняют тот же intent и правильный source |
| M03 | Замкнутый менеджерский task/report/review цикл | Web + iOS + backend | Конкретная сущность открывается; scope полный; решение подтверждено |
| M04 | Safe Customer versions/documents/decisions/handover | Portal/iOS + access owner | Customer читает разрешённое содержание; ответ, конфликт и revoke проверены |
| M05 | Достоверный AI job/result/human review | AI/backend + Web/iOS | Сохранённый result доступен по разрешённому source revision |
| M06 | Навигация, помощь, supporting capabilities, локали/a11y/telemetry | Web/mobile/design/QA | По каждому действию есть понятный следующий шаг и recovery |
| M07 | Полные денежные aggregates, честная подписка, public trust | Web + billing/content owners | Продуктовые/коммерческие обещания совпадают с поведением и действующими gates |
| M08 | Current-build сценарная приёмка | QA + соответствующие owners | Приложен manifest, пройден необходимый release slice, отдельное решение о выпуске |

Волны допускают параллельные небольшие PR. Нельзя делить один owner-sensitive operation между несогласованными исполнителями. Одновременная работа над одним файлом/контрактом координируется через владельца среза и текущие PR, а не через конфликтующие «мега PR».

## 5. Первый исполнимый отрезок

**Рабочие дни 1–2.** Сверить HEAD/main/PR/buildStamp и текущий pilot scope. Назначить backend/web/iOS/QA owners. Зафиксировать тестовые роли и минимальные fixtures. Исправить WEB-01 и четыре public visual tasks отдельными маленькими изменениями; source/visual before и after привязать к сборке. Обновить понятный release manifest. Данные и внешние действия не выполнять на production для имитации проверки.

**Дни 3–5.** Принять и проверить identity/outcome/media/sync контрактные решения. Первый вертикальный срез: одна назначенная задача, один draft, смена фотографии A→B, локальное сохранение, submit, Manager read. Включить только необходимые endpoints и устройства; прочие задачи продолжаются независимо.

**Дни 6–8.** Добавить correction того же reportId, ограниченный retry/readback, переключение owner и настоящие entity links. Проверить cold start/offline и недоступный вторичный блок, сохранив основное содержимое. Новые потребители контрактов не обходят имеющиеся права.

**Дни 9–10.** Выполнить сценарии на staging и актуальных iOS-устройствах включённого среза; собрать failed/NOT_RUN без замены историческими PASS. Принять следующий объём: Customer, AI или дополнительный supporting flow согласно каноническим зависимостям. Android включается после отдельного актуального решения product owner о возобновлении, а не автоматически по календарю.

Это организационный старт при наличии backend, web, iOS и QA компетенций. Точная оценка календарного срока всех 97 пакетов требует доступности людей, contract fixtures и первых фактических скоростей выполнения. Допустимо сократить объём, сохранив цель вертикального сценария; недопустимо объявить его проверенным при skip необходимых шагов.

## 6. Программа проверок

Минимальные данные: два principals одной компании, вторая компания, permitted/forbidden project, task с явными требованиями, первый report и correction, отдельный параллельный draft, media A/B и legacy purpose unknown, revoked publication, 205 reports для pagination, mixed currencies и bounded collections. Эти fixtures предлагаются для изолированного тестового окружения; реальные производственные записи не использовались.

| Сценарий | Необходимое наблюдение |
|---|---|
| Entry → first task | Session, membership и роль различаются; новый contractor проходит onboarding, invited/Customer получает своё разрешённое действие |
| Draft persistence | Back/kill/relaunch восстанавливает текст, task/day и файлы с тем же owner |
| Photo replacement | Preview B, queued revision B и Manager source B совпадают; callback A не возвращает A |
| Upload partial success | Продолжение на том же upload/finalize/link шаге; созданная сущность не создаётся повторно |
| Unknown submit | Потерянный ответ, restart и replay24h+ дают тот же result либо явное reconciliation без нового эффекта |
| Conflict | Version409, auth401, rate limit, server5xx и offline имеют разные действия и ограниченную повторяемость |
| Sync consistency | Apply/commit предшествует ACK; partial delta и bounded snapshot не стирают полные данные; watermark race не теряет изменение |
| Shift | Закрывается конкретный server day; yesterday state и смена даты не дают ложный success |
| Review/correction | Manager видит все доступные источники и возвращает замечание; Worker исправляет R1, draft R2 остаётся |
| Publication/Customer | Review не публикует автоматически; Customer читает выбранную разрешённую версию, conflict/revoke и повтор ответа обработаны |
| AI lifecycle | Usable persisted result, current lease/source revision, безопасный повтор, unavailable/unknown и human review |
| A11y/i18n | Keyboard/focus, large text, screen reader, targets, contrast и четыре локали в поддерживаемых состояниях |

Для обычного web-текста WCAG AA contrast проверяется по фактическим цветам, а не названию token. Android Compose предполагает доступные цели взаимодействия и неперекрывающиеся области; [официальная документация](https://developer.android.com/develop/ui/compose/accessibility/api-defaults) описывает minimum 48 dp и автоматическое расширение для некоторых компонентов. Это ориентир приёмки; соблюдение текущим Android-приложением не измерено. iOS accessibility и Dynamic Type проверяются нативно, размеры web-макета не являются таким тестом.

Сначала meaningful source/contract tests, затем изменённый runtime flow и необходимая регрессия. Не умножать snapshot-тесты, копирующие реализацию. Существующий device gate или billing интервал не заменяется большим количеством unit tests.

## 7. Передача каждого пакета в Cursor

В Cursor передаётся один выбранный ticket или небольшой связанный срез, плюс общие invariants и необходимая часть evidence. Cursor обновляет source truth и overlap, уточняет названные пути, реализует минимальную поправку, проверяет критерии, пишет handoff. При blocked endpoint или устройстве фиксирует точную причину и продолжает независимую разрешённую работу. Ни этот документ, ни дизайн-прототип не дают автоматического разрешения на merge/deploy/DB/store.

Текст полного старта: [Cursor Start](CURSOR_START_RU.md). Контекст продолжения: [Context](AUDIT_CONTEXT_RU.md). Дизайн-переходы: [MagicPath Brief](MAGICPATH_DESIGN_BRIEF_RU.md). Приложение C сохраняет исторический crosswalk от 19 октября. Полная уточнённая привязка всех 97 пакетов находится в [CANONICAL_MAPPING_RU.md](CANONICAL_MAPPING_RU.md).

---

## Приложение A. Реестр 97 пакетов

Ниже все пакеты перечислены по направлениям, внутри — в допустимом порядке зависимости. Поле «исходные platform details» указывает на полный нормализованный JSON. После таблицы следуют полные карточки; критерии и будущие тесты не сокращены.

| ID | Волна | Приоритет | Пакет | Обязательные зависимости |
|---|---|---|---|---|
| [V2-ARCH-01](#v2-arch-01) | M01 | P1 | Единый реестр маршрутов, действий и capabilities | — |
| [V2-ARCH-04](#v2-arch-04) | M01 | P1 | Контракты сущностей, источников, units и разрешённых действий | — |
| [V2-ARCH-07](#v2-arch-07) | M01 | P1 | Матрица доступа и projection для каждого actor/source | — |
| [V2-ARCH-09](#v2-arch-09) | M00 | P1 | Релиз по доказательствам критических journeys | V2-ARCH-01, V2-ARCH-04, V2-ARCH-07 |
| [V2-IOS-01](#v2-ios-01) | M00 | P1 | Зафиксировать воспроизводимый native baseline перед изменениями | — |
| [V2-PUB-01](#v2-pub-01) | M00 | P2 | Исправить непересекающийся hero layout | — |
| [V2-PUB-02](#v2-pub-02) | M00 | P2 | Исправить контраст и типографику общих CTA | — |
| [V2-PUB-03](#v2-pub-03) | M00 | P2 | Восстановить читаемую таблицу сравнения тарифов | — |
| [V2-PUB-04](#v2-pub-04) | M00 | P2 | Сделать корректные карточки ссылок справки | — |
| [V2-WEB-01](#v2-web-01) | M00 | P1 | Остановить цикл регистрации Create Task | — |
| [V2-WEB-22](#v2-web-22) | M00 | P2 | Закрыть production smoke/session/RPC консоль | — |
| [V2-AND-01](#v2-and-01) | M01 | P1 | Сессия с refresh и запретом выполнения работы от другого аккаунта | — |
| [V2-CON-02](#v2-con-02) | M01 | P1 | Общий Worker bootstrap и разрешённый identity context | V2-ARCH-04, V2-ARCH-07 |
| [V2-AND-02](#v2-and-02) | M01 | P1 | Проверяемый bootstrap, членство и разрешённые действия | V2-AND-01, V2-CON-02 |
| [V2-ARCH-02](#v2-arch-02) | M01 | P1 | Типизированные ресурсные состояния и recovery commands | — |
| [V2-ARCH-06](#v2-arch-06) | M01 | P2 | Единые read models, полнота и cache invalidation | V2-ARCH-02, V2-ARCH-04 |
| [V2-CON-01](#v2-con-01) | M01 | P1 | Долговечный результат повторяемой операции и защита от дубликатов | V2-ARCH-04, V2-ARCH-07 |
| [V2-CON-03](#v2-con-03) | M01 | P1 | Идентичность вложения, версия и добавление исправлений | V2-ARCH-04, V2-ARCH-07 |
| [V2-CON-04](#v2-con-04) | M01 | P1 | Полные списки отчётов: фильтры до limit, курсор и счётчики | V2-ARCH-04, V2-ARCH-06 |
| [V2-IOS-02](#v2-ios-02) | M01 | P1 | Привязать кэш, drafts и outbox к неизменяемому владельцу | V2-IOS-01, V2-CON-02 |
| [V2-IOS-03](#v2-ios-03) | M01 | P1 | Завершить понятный вход, role recovery и первое использование | V2-IOS-02, V2-CON-02 |
| [V2-WEB-05](#v2-web-05) | M01 | P1 | Связать identity, onboarding и правильное рабочее пространство | — |
| [V2-AND-03](#v2-and-03) | M02 | P1 | Восстанавливаемый черновик и точная связь с задачей/объектом | V2-AND-01, V2-AND-02, V2-CON-01 |
| [V2-AND-04](#v2-and-04) | M02 | P1 | Проверяемые фото до/после и устойчивая очередь загрузки | V2-AND-03, V2-CON-01, V2-CON-03 |
| [V2-AND-05](#v2-and-05) | M02 | P1 | Worker sync: применить данные, затем подтвердить cursor | V2-AND-02, V2-AND-03, V2-ARCH-04 |
| [V2-AND-06](#v2-and-06) | M02 | P1 | Смена с подтверждённым серверным результатом и датой | V2-AND-02, V2-AND-03, V2-CON-01, V2-ARCH-04 |
| [V2-AND-07](#v2-and-07) | M02 | P1 | История решений и полный повторный отчёт с новым evidence | V2-AND-03, V2-AND-04, V2-CON-01, V2-CON-03 |
| [V2-IOS-04](#v2-ios-04) | M02 | P1 | Заменить строительные значения по умолчанию на требования конкретной задачи | V2-IOS-01, V2-ARCH-04 |
| [V2-IOS-05](#v2-ios-05) | M02 | P1 | Сделать один ReportDraft для Form, Review и Submit | V2-IOS-02, V2-IOS-04, V2-CON-01, V2-ARCH-04 |
| [V2-IOS-06](#v2-ios-06) | M02 | P1 | Связать preview с media revision и вынести binary из JSON | V2-IOS-05, V2-CON-01, V2-CON-03 |
| [V2-IOS-07](#v2-ios-07) | M02 | P1 | Разделить конфликты, auth и retry в outbox | V2-IOS-02, V2-IOS-05, V2-IOS-06, V2-CON-01 |
| [V2-IOS-08](#v2-ios-08) | M02 | P1 | Открывать Worker после cold start и применять snapshot до ACK | V2-IOS-02, V2-IOS-07, V2-ARCH-04 |
| [V2-IOS-09](#v2-ios-09) | M02 | P1 | Сделать «доступно офлайн» свойством файла и версии | V2-IOS-02, V2-IOS-08 |
| [V2-IOS-10](#v2-ios-10) | M02 | P1 | Сначала показывать работу, затем вторичные счётчики | V2-IOS-02, V2-IOS-08 |
| [V2-IOS-11](#v2-ios-11) | M02 | P1 | Довести notification и deep link до разрешённой сущности | V2-IOS-03, V2-IOS-10 |
| [V2-IOS-12](#v2-ios-12) | M02 | P2 | Добавить восстановление QR и контекстные permissions | V2-IOS-03 |
| [V2-IOS-13](#v2-ios-13) | M02 | P2 | Сделать camera settings и quality feedback правдивыми | V2-IOS-04, V2-IOS-06, V2-IOS-12 |
| [V2-IOS-14](#v2-ios-14) | M02 | P1 | Восстанавливать исправление отчёта, сохранив существующий queued submit | V2-IOS-05, V2-IOS-06, V2-IOS-07, V2-CON-01, V2-CON-03 |
| [V2-IOS-15](#v2-ios-15) | M02 | P1 | Сохранить identity замечания при частичном успехе | V2-IOS-02, V2-IOS-06, V2-IOS-07, V2-CON-01 |
| [V2-IOS-16](#v2-ios-16) | M02 | P1 | Сохранить chat draft и media при ошибке отправки | V2-IOS-02, V2-IOS-06, V2-IOS-07, V2-CON-01 |
| [V2-AND-08](#v2-and-08) | M03 | P1 | Manager видит полное доказательство и результат проверки | V2-AND-02, V2-CON-03 |
| [V2-AND-09](#v2-and-09) | M03 | P1 | Правдивая Manager очередь: All/A/B/Без привязки, страницы и счётчики | V2-AND-02, V2-AND-08, V2-CON-04 |
| [V2-IOS-17](#v2-ios-17) | M03 | P2 | Сделать Manager Home и проектные входы завершёнными | V2-IOS-02, V2-IOS-03 |
| [V2-IOS-18](#v2-ios-18) | M03 | P2 | Проверить полный Manager task lifecycle и назначение | V2-IOS-17, V2-IOS-04 |
| [V2-IOS-19](#v2-ios-19) | M03 | P1 | Сохранить доказательство в Manager review и отдельной публикации | V2-IOS-06, V2-IOS-07, V2-CON-03 |
| [V2-IOS-20](#v2-ios-20) | M03 | P2 | Уточнить Manager Team и Notifications действия | V2-IOS-03, V2-IOS-17 |
| [V2-IOS-21](#v2-ios-21) | M03 | P1 | Согласовать Manager documents, issue DTO и decision права | V2-IOS-02, V2-IOS-17 |
| [V2-IOS-23](#v2-ios-23) | M03 | P1 | Разделить бюджет и физический прогресс во всех Manager выходах | V2-IOS-01 |
| [V2-WEB-02](#v2-web-02) | M03 | P1 | Открытие задачи из Canon board и восстановление контекста | V2-WEB-01 |
| [V2-WEB-03](#v2-web-03) | M03 | P1 | Полный и видимый scope списка задач | V2-WEB-01 |
| [V2-WEB-04](#v2-web-04) | M03 | P1 | Восстановление task mutations и частичного создания | V2-CON-01 |
| [V2-WEB-06](#v2-web-06) | M03 | P1 | Отделить lifecycle проекта от его риска | — |
| [V2-WEB-07](#v2-web-07) | M03 | P1 | Не превращать отказ загрузки в здоровый проект | V2-ARCH-02 |
| [V2-WEB-08](#v2-web-08) | M03 | P1 | Вернуть входы к существующим project capabilities | V2-ARCH-01 |
| [V2-WEB-12](#v2-web-12) | M03 | P1 | Source-aware просмотр отчёта и доказательств | V2-ARCH-04, V2-CON-03 |
| [V2-WEB-15](#v2-web-15) | M03 | P2 | Сохранение сведений при создании проекта | — |
| [V2-IOS-24](#v2-ios-24) | M04 | P1 | Дать Customer полный разрешённый список и понятный project context | V2-IOS-02, V2-IOS-03 |
| [V2-IOS-25](#v2-ios-25) | M04 | P1 | Показывать Customer содержание версии до ответа | V2-IOS-24 |
| [V2-IOS-26](#v2-ios-26) | M04 | P2 | Сохранить защищённую галерею и добавить полноту просмотра | V2-IOS-24, V2-IOS-19, V2-CON-03 |
| [V2-IOS-27](#v2-ios-27) | M04 | P1 | Доработать существующий Customer intake без лишней обязательности | V2-IOS-24, V2-IOS-06 |
| [V2-WEB-09](#v2-web-09) | M04 | P1 | Замкнуть документное согласование из inbox | V2-ARCH-01 |
| [V2-WEB-10](#v2-web-10) | M04 | P1 | Отдельный разрешённый shell клиентского портала | V2-ARCH-01, V2-ARCH-07 |
| [V2-WEB-16](#v2-web-16) | M04 | P2 | Надёжное создание документа и честная ссылка доступа | V2-CON-01 |
| [V2-WEB-23](#v2-web-23) | M04 | P1 | Проверить полный customer path и опубликованные источники | V2-WEB-09, V2-WEB-10 |
| [V2-WEB-24](#v2-web-24) | M04 | P2 | Межролевые списки и детали без потери сообщения или решения | V2-WEB-08, V2-ARCH-07 |
| [V2-WEB-25](#v2-web-25) | M04 | P1 | Завершить проверку сохранения и подтверждения daily log | — |
| [V2-WEB-26](#v2-web-26) | M04 | P2 | Развести people directory и управление доступом | — |
| [V2-WEB-29](#v2-web-29) | M04 | P2 | Проверить tenant admin и platform admin как разные продукты | V2-ARCH-02, V2-ARCH-07 |
| [V2-WEB-31](#v2-web-31) | M04 | P1 | Handover и public proof share с источниками и отзывом доступа | V2-WEB-08, V2-WEB-10, V2-ARCH-07 |
| [V2-WEB-33](#v2-web-33) | M04 | P2 | Governance case от создания до подтверждённого закрытия | — |
| [V2-ARCH-05](#v2-arch-05) | M05 | P1 | Долговечный AI результат, source lifecycle и human review | V2-ARCH-04, V2-ARCH-07, V2-CON-03 |
| [V2-IOS-22](#v2-ios-22) | M05 | P1 | Развести AI job, insight и решение по источнику | V2-IOS-01, V2-ARCH-05 |
| [V2-WEB-11](#v2-web-11) | M05 | P1 | Разделить строительный риск, AI job status и рекомендации | V2-ARCH-04, V2-ARCH-05 |
| [V2-AND-10](#v2-and-10) | M06 | P2 | Нативная навигация, состояния, текст и доступность существующих экранов | V2-AND-03 |
| [V2-AND-11](#v2-and-11) | M06 | P2 | Контекстная помощь после основной работы, без ложной уверенности ИИ | V2-AND-02, V2-AND-10 |
| [V2-AND-12](#v2-and-12) | M06 | P2 | Worker push: permission, доставка, открытие правильного отчёта, logout | V2-AND-01, V2-AND-07, V2-AND-10 |
| [V2-ARCH-03](#v2-arch-03) | M06 | P2 | Отделить feature behavior от Canon presentation | V2-WEB-01, V2-WEB-02, V2-ARCH-02 |
| [V2-ARCH-08](#v2-arch-08) | M06 | P2 | Telemetry завершения реальных пользовательских задач | V2-ARCH-02 |
| [V2-IOS-28](#v2-ios-28) | M06 | P2 | Сделать настройки, help и диагностику понятными действиями | V2-IOS-03, V2-IOS-07 |
| [V2-IOS-29](#v2-ios-29) | M06 | P2 | Проверить native typography, accessibility и четыре локали | V2-IOS-05, V2-IOS-17, V2-IOS-24 |
| [V2-PUB-05](#v2-pub-05) | M06 | P2 | Сохранить intent обращения и фокус многошаговой формы | — |
| [V2-PUB-06](#v2-pub-06) | M06 | P2 | Дать действующим пользователям отдельный путь поддержки | — |
| [V2-PUB-07](#v2-pub-07) | M06 | P2 | Переписать семь статей как инструкции по реальным ролям | — |
| [V2-WEB-13](#v2-web-13) | M06 | P2 | Правдивые названия меню и область поиска | V2-ARCH-01 |
| [V2-WEB-14](#v2-web-14) | M06 | P2 | Убрать ложные действия в заголовках | — |
| [V2-WEB-18](#v2-web-18) | M06 | P2 | Согласовать период существующего графика работ | — |
| [V2-WEB-19](#v2-web-19) | M06 | P2 | Доступность основных Canon действий | — |
| [V2-WEB-20](#v2-web-20) | M06 | P2 | Локаль, тексты и сохранение навигационного контекста | — |
| [V2-WEB-27](#v2-web-27) | M06 | P2 | Операционные экраны загрузок, устройств и нагрузки | V2-WEB-13 |
| [V2-WEB-28](#v2-web-28) | M06 | P2 | Ролевая помощь, поддержка и security settings | V2-WEB-20 |
| [V2-WEB-17](#v2-web-17) | M07 | P2 | Корректные денежные агрегаты и полнота портфеля | V2-ARCH-06 |
| [V2-WEB-32](#v2-web-32) | M06 | P2 | Один достоверный рабочий день и портфельный action list | V2-WEB-07, V2-WEB-17, V2-ARCH-01 |
| [V2-PUB-08](#v2-pub-08) | M07 | P2 | Подготовить утверждённые публичные условия и правдивые материалы | — |
| [V2-WEB-21](#v2-web-21) | M07 | P2 | Честное ожидание активации подписки без изменения billing gates | — |
| [V2-WEB-30](#v2-web-30) | M07 | P2 | Public acquisition и визуальные регрессии по результатам Product Design | V2-PUB-01, V2-PUB-02, V2-PUB-03, V2-PUB-04, V2-PUB-05, V2-PUB-06, V2-PUB-07, V2-PUB-08 |
| [V2-AND-13](#v2-and-13) | M08 | P1_GATE | Android scope lock и воспроизводимый non-bypass release gate | V2-AND-01, V2-AND-02, V2-AND-03, V2-AND-04, V2-AND-05, V2-AND-06, V2-AND-07, V2-AND-08, V2-AND-09, V2-AND-10, V2-AND-11, V2-AND-12 |
| [V2-IOS-30](#v2-ios-30) | M08 | P1 | Доказать основной цикл на production типах и реальных устройствах | V2-IOS-02, V2-IOS-03, V2-IOS-04, V2-IOS-05, V2-IOS-06, V2-IOS-07, V2-IOS-08, V2-IOS-09, V2-IOS-10, V2-IOS-11, V2-IOS-12, V2-IOS-13, V2-IOS-14, V2-IOS-15, V2-IOS-16, V2-IOS-17, V2-IOS-18, V2-IOS-19, V2-IOS-20, V2-IOS-21, V2-IOS-22, V2-IOS-23, V2-IOS-24, V2-IOS-25, V2-IOS-26, V2-IOS-27, V2-IOS-28, V2-IOS-29 |

# M00 — Baseline и быстрые подтверждённые исправления

## V2-ARCH-09

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001, AIS-OWNER-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-arch-09).

**Релиз по доказательствам критических journeys**

**P1 · ARCH · ARCHITECTURE_AND_RELEASE_VALIDATION · PROPOSED / NOT_RUN**

**Результат:** Каждый slice получает независимый verdict по exact SHA, runtime, contracts, визуальному и ролевому сценарию.

**Предлагаемый владелец:** Architecture/domain owner + web/mobile reviewers. Конкретный исполнитель не назначен.

**Оценка:** M: 2–4 дня на baseline suite + validation каждого slice. **Порядок DAG:** 4.

**Экраны / семейства:** F01; F05; F09; F10; F11; F13; F20; F21; F28; F29; F30; F31; F32.

**Основные действия:** Каждый slice получает независимый verdict по exact SHA, runtime, contracts, визуальному и ролевому сценарию..

**Обязательные зависимости:** [V2-ARCH-01](#v2-arch-01), [V2-ARCH-04](#v2-arch-04), [V2-ARCH-07](#v2-arch-07)

**Шаги реализации:**

1. До начала implementation обновить main/PR/head/deployed buildStamp/schema receipts и current pilot scope; не доверять названиям checkout/старому registry.
2. Каждый ticket Requirement→AC→Test/Observation→source/runtime SHA→independent Verdict; Proposed/Implemented/Verified/Released отдельны.
3. Local minimum: targeted behavioral tests, i18n:check нужного scope, lint; required CI включая cf:build. bun build и cf:build не запускать параллельно.
4. Staging journey smoke с fixture principals; closed cabinet screenshot/keyboard/offline checks перед UX PASS; production read-only proof после отдельного authorized release.
5. DB, billing seven-day shadow/cutover, store/signing/device/legal gates остаются своими отдельными gates. Infrastructure error имеет WAITING/UNKNOWN, не feature PASS.

**Критерии приёмки — ещё не проверены:**

- **V2-ARCH-09-AC-01 · NOT_RUN:** Ни один ticket не считается Verified только по grep/green compile/screenshot макету.
- **V2-ARCH-09-AC-02 · NOT_RUN:** Изменённый SHA/policy/source делает прошлое runtime evidence stale; retry проходит current head.
- **V2-ARCH-09-AC-03 · NOT_RUN:** Critical journeys create/open task, report review/publication, owner decision и revocation имеют соответствующие tested role cases.
- **V2-ARCH-09-AC-04 · NOT_RUN:** Каждый blocked external gate указан с конкретной недостающей evidence; остальные независимые slices продолжаются.

**Будущие проверки — NOT_RUN:**

- **V2-ARCH-09-TEST-01 · NOT_RUN:** Release manifest consistency and CI required checks; one fresh role scenario per affected path.
- **V2-ARCH-09-TEST-02 · NOT_RUN:** Production/staging health/buildStamp comparison, without production seeded mutations.
- **V2-ARCH-09-TEST-03 · NOT_RUN:** Rollback rehearsal scoped to code/flag, never irreversible accepted-data deletion.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [AGENTS.md:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/AGENTS.md#L1)
- [START_HERE.md:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/START_HERE.md#L1)
- [STATUS.md:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/STATUS.md#L1)
- [docs/tasks/ACTIVE_WORK_REGISTRY.csv:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/tasks/ACTIVE_WORK_REGISTRY.csv#L1)
- [docs/ops/VERIFIED_DB_MIGRATION_RECEIPTS.md:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/ops/VERIFIED_DB_MIGRATION_RECEIPTS.md#L1)
- [.github/workflows/ci-check.yml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/.github/workflows/ci-check.yml#L1)
- [.github/workflows/deploy-cloudflare-staging.yml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/.github/workflows/deploy-cloudflare-staging.yml#L1)
- [.github/workflows/deploy-cloudflare-prod.yml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/.github/workflows/deploy-cloudflare-prod.yml#L1)
- [apps/web/tests/e2e/audit-dashboard-navigation.spec.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/tests/e2e/audit-dashboard-navigation.spec.ts#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [ARCH-002](AUDIT_REPORT_RU.md#arch-002).

**Канон:** Phase 0; 13; AIS-PILOT-001; AIS-OWNER-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-ARCH-09`.

## V2-IOS-01

**Интеграция 20.10.2026:** Phase 0; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-01).

**Зафиксировать воспроизводимый native baseline перед изменениями**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Получить конкретную проверяемую сборку и карту сценариев

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** S. **Порядок DAG:** 5.

**Роли:** Worker; Manager; Customer.

**Экраны / семейства:** Три app roots; Login; CI / release manifest.

**Основные действия:** Получить конкретную проверяемую сборку и карту сценариев.

**Ввод и предпосылки:** Current main и выбранный PR HEAD; AGENTS / STATUS / registry; Xcode runner и разрешённые staging fixtures.

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Сверить source SHA с текущим main/PR; сохранить current tree status без переключения грязного checkout.
2. Связать каждую native сборку с app target, version/build, SHA, backend/environment и feature flags; устранить ссылку на отсутствующую release-ветку через текущий release registry.
3. Разделить legacy/unreferenced Views, UITest fixture и активные поверхности; использовать свежий census как стартовую карту.
4. Подготовить сценарный dataset: две сессии, два tenant, task/report с 0/1/2/8 media, changes_requested, Customer sent estimate и отозванное разрешение.

**API и контракты:**

- GET /api/v1/health для stamp; не является проверкой всех endpoints

**Состояния, которые нужно сохранить или реализовать:**

- SOURCE_VERIFIED
- BUILD_AVAILABLE
- DEVICE_BLOCKED
- SCENARIO_NOT_RUN
- SCENARIO_PASS/FAIL/SKIP

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-01-AC-01 · NOT_RUN:** Given build artifact, When его выбирают для проверки, Then manifest однозначно указывает source и backend, а неизвестные значения не заменены main SHA.
- **V2-IOS-01-AC-02 · NOT_RUN:** Given build-only success, Then сценарии остаются NOT_RUN до фактического исполнения.
- **V2-IOS-01-AC-03 · NOT_RUN:** Given source поменялся после этого аудита, Then затронутые findings перечитаны на новом HEAD до реализации.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-01-TEST-01 · NOT_RUN:** Проверка manifest и archive metadata; без установки неизвестного ПО.
- **V2-IOS-01-TEST-02 · NOT_RUN:** Запустить существующий login smoke на доступном runner, записать фактически выполненные тесты; это не полная приёмка.

**Проверенные исходные точки:**

- [AGENTS.md:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/AGENTS.md#L1)
- [STATUS.md:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/STATUS.md#L1)
- [ios/README.md:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/README.md#L1)
- [.github/workflows/ios-ui-smoke.yml:47](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/.github/workflows/ios-ui-smoke.yml#L47)
- [ios/AiStroykaWorker/AiStroykaWorker/AiStroykaWorkerApp.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/AiStroykaWorkerApp.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/AiStroykaManagerApp.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/AiStroykaManagerApp.swift#L1)
- [ios/AiStroykaCustomer/AiStroykaCustomer/AiStroykaCustomerApp.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/AiStroykaCustomerApp.swift#L1)

**Условия остановки зависимого среза:**

- Нет signing/device/staging доступа — остановить соответствующий runtime шаг, продолжить source/fixtures; не подменять результат preview.
- Нет явного разрешения — не выполнять Store upload, live publish, provider billing или миграции.

**Условие выпуска:** G0; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-15](AUDIT_REPORT_RU.md#ios-15), [IOS-19](AUDIT_REPORT_RU.md#ios-19).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-01`.

## V2-PUB-01

**Интеграция 20.10.2026:** Phase 12; AIS-PILOT-001; release scope `PUBLIC_WEB`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-pub-01).

**Исправить непересекающийся hero layout**

**P2 · PUBLIC · PUBLIC_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Разместить текст и иллюстрацию в непересекающихся областях активного desktop layout; сохранить существующее изображение и бренд. Не лечить только z-index.

**Предлагаемый владелец:** Web UI owner + product/content reviewer. Конкретный исполнитель не назначен.

**Оценка:** S/M: оценить после baseline responsive check. **Порядок DAG:** 6.

**Роли:** Посетитель / новый и действующий пользователь.

**Экраны / семейства:** /ru, /en, /es, /it — первый экран.

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Разместить текст и иллюстрацию в непересекающихся областях активного desktop layout; сохранить существующее изображение и бренд. Не лечить только z-index.

**Критерии приёмки — ещё не проверены:**

- **V2-PUB-01-AC-01 · NOT_RUN:** Текст и CTA полностью видны при320/375/768/1100/1363/1440/1920CSSpx, 200% zoom и длинных RU/ES/IT строках.
- **V2-PUB-01-AC-02 · NOT_RUN:** Иллюстрация сохраняет пропорции; порядок чтения и фокус логичны.

**Будущие проверки — NOT_RUN:**

- **V2-PUB-01-TEST-01 · NOT_RUN:** Проверка исправленного состояния в фактической сборке на перечисленных viewport и локалях.

**Проверенные исходные точки:**

- [apps/web/styles/website-v41.css:274](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/styles/website-v41.css#L274)
- [apps/web/styles/website-v41.css:400](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/styles/website-v41.css#L400)
- [apps/web/components/public/v41/HomeHero.tsx:38](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/public/v41/HomeHero.tsx#L38)
- [apps/web/components/public/v41/HomeHero.tsx:83](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/public/v41/HomeHero.tsx#L83)

**Условия остановки зависимого среза:**

- Неподтверждённый контракт или неожиданный scope — остановить зависимый срез и зафиксировать вопрос; продолжить независимые работы.
- Не выполнять merge/deploy/migration/provider/store actions без действующей авторизации и gates.

**Условие выпуска:** Фактический rendered flow, состояния, локали и ссылки подтверждены

**Rollback:** Изолированный код/flag rollback, сохраняя пользовательский ввод, принятую историю и существующие server IDs.

**Находки:** [PUB-006](AUDIT_REPORT_RU.md#pub-006).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-PUB-01`.

## V2-PUB-02

**Интеграция 20.10.2026:** Phase 12; AIS-PILOT-001; release scope `PUBLIC_WEB`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-pub-02).

**Исправить контраст и типографику общих CTA**

**P2 · PUBLIC · PUBLIC_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Исправить specificity public variant. В shared Button использовать существующий именованный font-size utility или явный length type. Сохранить тёмный primary-text token.

**Предлагаемый владелец:** Web UI owner + product/content reviewer. Конкретный исполнитель не назначен.

**Оценка:** S/M: оценить после baseline responsive check. **Порядок DAG:** 7.

**Роли:** Посетитель / новый и действующий пользователь.

**Экраны / семейства:** /ru/features primary link; /ru/login primary Button.

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Исправить specificity public variant. В shared Button использовать существующий именованный font-size utility или явный length type. Сохранить тёмный primary-text token.

**Критерии приёмки — ещё не проверены:**

- **V2-PUB-02-AC-01 · NOT_RUN:** Видимые enabled primary Link/Button имеют контраст обычного текста ≥4.5:1 по фактическим вычисленным цветам.
- **V2-PUB-02-AC-02 · NOT_RUN:** SM/MD размеры действительно задают font-size; hover/focus/pressed/loading/disabled проверены отдельно.
- **V2-PUB-02-AC-03 · NOT_RUN:** Проверить public + login/register/reset + representative cabinet Buttons после сборки CSS.

**Будущие проверки — NOT_RUN:**

- **V2-PUB-02-TEST-01 · NOT_RUN:** Проверка исправленного состояния в фактической сборке на перечисленных viewport и локалях.

**Проверенные исходные точки:**

- [apps/web/styles/website-v41.css:41](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/styles/website-v41.css#L41)
- [apps/web/styles/website-v41.css:209](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/styles/website-v41.css#L209)
- [apps/web/components/ui/Button.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/ui/Button.tsx#L1)
- [apps/web/app/design-tokens.css:167](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/design-tokens.css#L167)

**Условия остановки зависимого среза:**

- Неподтверждённый контракт или неожиданный scope — остановить зависимый срез и зафиксировать вопрос; продолжить независимые работы.
- Не выполнять merge/deploy/migration/provider/store actions без действующей авторизации и gates.

**Условие выпуска:** Фактический rendered flow, состояния, локали и ссылки подтверждены

**Rollback:** Изолированный код/flag rollback, сохраняя пользовательский ввод, принятую историю и существующие server IDs.

**Находки:** [PUB-007](AUDIT_REPORT_RU.md#pub-007).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-PUB-02`.

## V2-PUB-03

**Интеграция 20.10.2026:** Phase 12; AIS-PILOT-001; release scope `PUBLIC_WEB`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-pub-03).

**Восстановить читаемую таблицу сравнения тарифов**

**P2 · PUBLIC · PUBLIC_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Одна вертикальная последовательность строк или семантическая table в горизонтальном scroll wrapper. Отдельно feature column +4plan columns.

**Предлагаемый владелец:** Web UI owner + product/content reviewer. Конкретный исполнитель не назначен.

**Оценка:** S/M: оценить после baseline responsive check. **Порядок DAG:** 8.

**Роли:** Посетитель / новый и действующий пользователь.

**Экраны / семейства:** /ru/pricing — сравнение планов.

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Одна вертикальная последовательность строк или семантическая table в горизонтальном scroll wrapper. Отдельно feature column +4plan columns.

**Критерии приёмки — ещё не проверены:**

- **V2-PUB-03-AC-01 · NOT_RUN:** Все значения однозначно принадлежат заголовкам своего тарифа; строки не пересекаются.
- **V2-PUB-03-AC-02 · NOT_RUN:** На узком экране скролл ограничен таблицей, заголовки/ячейки доступны клавиатуре и assistive technology.
- **V2-PUB-03-AC-03 · NOT_RUN:** Существующие Starter/Pro login next и Enterprise route сохраняются; checkout не меняется.

**Будущие проверки — NOT_RUN:**

- **V2-PUB-03-TEST-01 · NOT_RUN:** Проверка исправленного состояния в фактической сборке на перечисленных viewport и локалях.

**Проверенные исходные точки:**

- [apps/web/styles/website-v41.css:1553](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/styles/website-v41.css#L1553)
- [apps/web/styles/website-v41.css:1609](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/styles/website-v41.css#L1609)
- [apps/web/components/public/v43/PricingCard.tsx:81](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/public/v43/PricingCard.tsx#L81)

**Условия остановки зависимого среза:**

- Неподтверждённый контракт или неожиданный scope — остановить зависимый срез и зафиксировать вопрос; продолжить независимые работы.
- Не выполнять merge/deploy/migration/provider/store actions без действующей авторизации и gates.

**Условие выпуска:** Фактический rendered flow, состояния, локали и ссылки подтверждены

**Rollback:** Изолированный код/flag rollback, сохраняя пользовательский ввод, принятую историю и существующие server IDs.

**Находки:** [PUB-008](AUDIT_REPORT_RU.md#pub-008).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-PUB-03`.

## V2-PUB-04

**Интеграция 20.10.2026:** Phase 12; AIS-PILOT-001; release scope `PUBLIC_WEB`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-pub-04).

**Сделать корректные карточки ссылок справки**

**P2 · PUBLIC · PUBLIC_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Scoped CardLink display:block/flex с полноценной высотой; проверить focus и многострочные названия.

**Предлагаемый владелец:** Web UI owner + product/content reviewer. Конкретный исполнитель не назначен.

**Оценка:** S/M: оценить после baseline responsive check. **Порядок DAG:** 9.

**Роли:** Посетитель / новый и действующий пользователь.

**Экраны / семейства:** /ru/docs.

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Scoped CardLink display:block/flex с полноценной высотой; проверить focus и многострочные названия.

**Критерии приёмки — ещё не проверены:**

- **V2-PUB-04-AC-01 · NOT_RUN:** Ни одна из7карточек не пересекается с соседней на320–1920CSSpx и200%zoom.
- **V2-PUB-04-AC-02 · NOT_RUN:** Вся карточка кликабельна; focus не обрезан; все7ссылок открывают свою статью.

**Будущие проверки — NOT_RUN:**

- **V2-PUB-04-TEST-01 · NOT_RUN:** Проверка исправленного состояния в фактической сборке на перечисленных viewport и локалях.

**Проверенные исходные точки:**

- [apps/web/app/[locale]/(public)/docs/page.tsx:44](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28public%29/docs/page.tsx#L44)
- [apps/web/styles/website-v41.css:1398](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/styles/website-v41.css#L1398)
- [apps/web/styles/website-v41.css:1571](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/styles/website-v41.css#L1571)

**Условия остановки зависимого среза:**

- Неподтверждённый контракт или неожиданный scope — остановить зависимый срез и зафиксировать вопрос; продолжить независимые работы.
- Не выполнять merge/deploy/migration/provider/store actions без действующей авторизации и gates.

**Условие выпуска:** Фактический rendered flow, состояния, локали и ссылки подтверждены

**Rollback:** Изолированный код/flag rollback, сохраняя пользовательский ввод, принятую историю и существующие server IDs.

**Находки:** [PUB-009](AUDIT_REPORT_RU.md#pub-009).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-PUB-04`.

## V2-WEB-01

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-01).

**Остановить цикл регистрации Create Task**

**P1 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Tasks стабилизируется после первого render и открывает форму с актуальным контекстом.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** S: 0.5–1.5 инженерных дня. **Порядок DAG:** 10.

**Экраны / семейства:** F10.

**Основные действия:** Tasks стабилизируется после первого render и открывает форму с актуальным контекстом..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Заменить inline registration callback на стабильный useCallback или явный controlled createOpen. Не переписывать create API.
2. Устранить effect→parent state feedback; сохранить primary CTA и empty-state CTA как один command.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-01-AC-01 · NOT_RUN:** На пустом и заполненном экране commits стабилизируются; Maximum update depth отсутствует.
- **V2-WEB-01-AC-02 · NOT_RUN:** Create→close→Create доступно повторно; focus возвращается к инициатору.
- **V2-WEB-01-AC-03 · NOT_RUN:** После смены project/scope submit отправляет один актуальный payload.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-01-TEST-01 · NOT_RUN:** Actual-source React regression для callback identity; route render smoke без сети.
- **V2-WEB-01-TEST-02 · NOT_RUN:** После implementation authenticated staging task page: empty/data, desktop/phone, create/cancel.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/canon/DashboardTasksCanonPage.tsx:150](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/DashboardTasksCanonPage.tsx#L150)
- [apps/web/app/[locale]/(dashboard)/dashboard/tasks/DashboardTasksClient.tsx:118](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/tasks/DashboardTasksClient.tsx#L118)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-01](AUDIT_REPORT_RU.md#web-01).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-01`.

## V2-WEB-22

**Интеграция 20.10.2026:** Phase 0; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-22).

**Закрыть production smoke/session/RPC консоль**

**P2 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Публичная production страница больше не предлагает session dump и произвольные RPC.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** S: 0.5–1 день. **Порядок DAG:** 11.

**Экраны / семейства:** F32.

**Основные действия:** Публичная production страница больше не предлагает session dump и произвольные RPC..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Выбрать явный build/env guard или удалить production route с сохранением необходимых local diagnostics.
2. Session diagnostics показывают только разрешённые sanitized признаки, никогда full session/token.
3. Проверять защиту серверно/маршрутом; robots/noindex не является ограничением доступа.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-22-AC-01 · NOT_RUN:** Production anon и ordinary authenticated user получают404/403 вместо dev console.
- **V2-WEB-22-AC-02 · NOT_RUN:** В diagnostic output нет access/refresh tokens; RPC input отсутствует на public surface.
- **V2-WEB-22-AC-03 · NOT_RUN:** Existing RLS/RPC grants остаются без ослабления; dev smoke документирован отдельно.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-22-TEST-01 · NOT_RUN:** Production-mode route gate test; build artifact/static UI assertion.
- **V2-WEB-22-TEST-02 · NOT_RUN:** Read-only live route check после authorized deployment; не выполнять произвольные RPC для доказательства закрытия.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/app/[locale]/smoke/page.tsx:3](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/smoke/page.tsx#L3)
- [apps/web/middleware.ts:20](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/middleware.ts#L20)
- [apps/web/lib/rpc.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/rpc.ts#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-22](AUDIT_REPORT_RU.md#web-22).

**Канон:** Phase 0; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-22`.


# M01 — Контракты, идентичность и полномочия

## V2-ARCH-01

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001, AIS-OWNER-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-arch-01).

**Единый реестр маршрутов, действий и capabilities**

**P1 · ARCH · ARCHITECTURE · PROPOSED / NOT_RUN**

**Результат:** Продуктовые producers и UI consumers используют проверяемые типизированные маршруты без рассогласованных labels/roles.

**Предлагаемый владелец:** Architecture/domain owner + web/mobile reviewers. Конкретный исполнитель не назначен.

**Оценка:** M: 3–5 дней. **Порядок DAG:** 1.

**Экраны / семейства:** F09; F10; F13; F16; F20; F28; F29; F33.

**Основные действия:** Продуктовые producers и UI consumers используют проверяемые типизированные маршруты без рассогласованных labels/roles..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Дополнить существующие navigation/entry modules, а не создать новый всезнающий router: route builder, entity reference, supported query/alias, label key, capability и surface.
2. Capability определяет UI affordance; API/RLS по-прежнему проверяет действие независимо. Registry не хранит токены/пользовательские гранты.
3. Генерировать/проверять sidebar, project sections, notification/attention/review-pack links из одной semantic contract.
4. Мигрировать сначала tasks/docs/issues/commercial/portal; оставить compatibility parsers для сохранённых URLs.

**Критерии приёмки — ещё не проверены:**

- **V2-ARCH-01-AC-01 · NOT_RUN:** Каждый current producer route resolves в поддерживаемый consumer и сохраняет entityId/locale/filter.
- **V2-ARCH-01-AC-02 · NOT_RUN:** Unknown/deleted/blocked targets дают deliberate fallback, не unrelated overview.
- **V2-ARCH-01-AC-03 · NOT_RUN:** Tenant owner, project owner, stakeholder и platform owner не становятся одной role-string категорией.
- **V2-ARCH-01-AC-04 · NOT_RUN:** 114 current page files и embedded capabilities покрыты registry contract test/explicit exception.

**Будущие проверки — NOT_RUN:**

- **V2-ARCH-01-TEST-01 · NOT_RUN:** Pure route roundtrip and producer-consumer contract tests.
- **V2-ARCH-01-TEST-02 · NOT_RUN:** Role fixture snapshot of visible actions + direct API denied tests; no blanket route crawl with mutations.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/lib/entry/entry-routing.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/entry/entry-routing.ts#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/project-detail-tabs.ts:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/project-detail-tabs.ts#L25)
- [apps/web/app/[locale]/(dashboard)/dashboard/notifications/notifications-workspace.utils.ts:77](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/notifications/notifications-workspace.utils.ts#L77)
- [apps/web/app/[locale]/(dashboard)/dashboard/approvals/approvals-workspace.utils.ts:54](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/approvals/approvals-workspace.utils.ts#L54)
- [apps/web/components/canon/CanonSidebarNav.tsx:37](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/CanonSidebarNav.tsx#L37)
- [apps/web/components/dashboard-nav.utils.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/dashboard-nav.utils.ts#L1)
- [apps/web/lib/tenant/stakeholder-dashboard-paths.ts:47](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/tenant/stakeholder-dashboard-paths.ts#L47)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-02](AUDIT_REPORT_RU.md#web-02), [WEB-08](AUDIT_REPORT_RU.md#web-08), [WEB-09](AUDIT_REPORT_RU.md#web-09), [WEB-10](AUDIT_REPORT_RU.md#web-10), [WEB-13](AUDIT_REPORT_RU.md#web-13).

**Канон:** Phase 1; 2; 13; AIS-PILOT-001; AIS-OWNER-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-ARCH-01`.

## V2-ARCH-04

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001, AIS-EVID-002, AIS-VISION-003, AIS-GRAPH-004; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-arch-04).

**Контракты сущностей, источников, units и разрешённых действий**

**P1 · ARCH · ARCHITECTURE · PROPOSED / NOT_RUN**

**Результат:** Web/iOS/Android читают одинаковые поля и значения, а unknown и source identity не теряются.

**Предлагаемый владелец:** Architecture/domain owner + web/mobile reviewers. Конкретный исполнитель не назначен.

**Оценка:** M: 3–5 дней. **Порядок DAG:** 2.

**Экраны / семейства:** F08; F10; F11; F21; F34; F37; F38; F40.

**Основные действия:** Web/iOS/Android читают одинаковые поля и значения, а unknown и source identity не теряются..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Сверить текущие DTO и PR #446/#448/#449: identifier casing, quantities/unit/method, nullable status, source id/version/timestamp, human review and capabilities.
2. Устранить manual divergent DTO только для критической task→report→publication→customer chain; не заменять работающий contract package.
3. Изменения additive и versioned; old native clients получают допустимый subset или явную unsupported capability.
4. Manager REST и Worker sync scoped snapshot остаются разными transport contracts; server projections отделены до UI/AI.
5. Именованный срез SYNC-CONTRACT: supported resource/change types, partial invalidations/refetch, bounded snapshot coverage, applied/ack cursor и согласованность snapshot/watermark. Deterministic race fixture между entity-read и cursor-read обязателен; риск пока INFERRED.
6. Именованный срез REPORT-POLICY: initial-vs-correction proof, task-specific quantity/unit/requirements, omission/null/blank create-body compatibility. Proposed current_day и адресный day/end явно versioned; не считать существующим API.
7. V2-CON-01/02/03/04 — отдельные владельцы backend реализации общих контрактов. ARCH04 утверждает schema/fixtures, не дублирует их реализацию/оценку.
8. Backend owner ARCH04 реализует отдельно SYNC-CONTRACT и REPORT-POLICY: snapshot/watermark, partial change projection, proposed current_day/addressed day-end и строгий create-body contract. Эти серверные срезы не перекладываются на независимые реализации iOS и Android; мобильные owners реализуют consumers и общие fixtures.

**Критерии приёмки — ещё не проверены:**

- **V2-ARCH-04-AC-01 · NOT_RUN:** Contract fixtures одинаково декодируются всеми поддерживаемыми клиентами, включая snake/camel правила iOS.
- **V2-ARCH-04-AC-02 · NOT_RUN:** Произвольный image quantity не становится measured m³; unavailable unit/confidence/method остаётся null/unknown.
- **V2-ARCH-04-AC-03 · NOT_RUN:** Lifecycle и risk — разные поля; action capability не заменяет server authorization.
- **V2-ARCH-04-AC-04 · NOT_RUN:** No field stripping silently turns a supplied source quantity into legacy volume.
- **V2-ARCH-04-AC-05 · NOT_RUN:** Изменение между чтением snapshot entity и cursor не теряется в следующем changes; partial payload не заменяет полный resource пустыми полями.
- **V2-ARCH-04-AC-06 · NOT_RUN:** Одинаковые production DTO fixtures проходят Web/Swift/Kotlin: absent/null/blank, task/day, purpose и revision; старый поддерживаемый клиент сохраняет compatibility.
- **V2-ARCH-04-AC-07 · NOT_RUN:** Первичный отчёт и correction имеют явно разные допустимые proof policies, подтверждённые product owner и существующим pilot scope.

**Будущие проверки — NOT_RUN:**

- **V2-ARCH-04-TEST-01 · NOT_RUN:** Shared schema fixtures, web contract tests and peer mobile decoder tests.
- **V2-ARCH-04-TEST-02 · NOT_RUN:** Backward compatibility matrix deployed clients↔proposed API; 409/unsupported/error variants.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [packages/contracts/src/api/v1/types.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/packages/contracts/src/api/v1/types.ts#L1)
- [packages/contracts/src/schemas/projects.schema.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/packages/contracts/src/schemas/projects.schema.ts#L1)
- [packages/contracts/src/schemas/worker.schema.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/packages/contracts/src/schemas/worker.schema.ts#L1)
- [packages/contracts/src/schemas/ai.schema.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/packages/contracts/src/schemas/ai.schema.ts#L1)
- [packages/contracts/src/schemas/sync.schema.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/packages/contracts/src/schemas/sync.schema.ts#L1)
- [apps/web/lib/domain/customer-estimates/customer-estimates.types.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/customer-estimates/customer-estimates.types.ts#L1)
- [apps/web/lib/domain/projects/project-access.types.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/projects/project-access.types.ts#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-06](AUDIT_REPORT_RU.md#web-06), [WEB-11](AUDIT_REPORT_RU.md#web-11), [WEB-12](AUDIT_REPORT_RU.md#web-12), [WEB-15](AUDIT_REPORT_RU.md#web-15), [WEB-17](AUDIT_REPORT_RU.md#web-17).

**Канон:** Phase 1; 2; 6; 7; 13; AIS-PILOT-001; AIS-EVID-002; AIS-VISION-003; AIS-GRAPH-004.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-ARCH-04`.

## V2-ARCH-07

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001, AIS-OWNER-001, AIS-EVID-002; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-arch-07).

**Матрица доступа и projection для каждого actor/source**

**P1 · ARCH · ARCHITECTURE · PROPOSED / NOT_RUN**

**Результат:** UI делает доступными нужные действия, а сервер сохраняет tenant/project/platform/source isolation.

**Предлагаемый владелец:** Architecture/domain owner + web/mobile reviewers. Конкретный исполнитель не назначен.

**Оценка:** M/L: 4–7 дней. **Порядок DAG:** 3.

**Экраны / семейства:** F06; F09; F13; F20; F21; F27; F28; F29; F31; F40.

**Основные действия:** UI делает доступными нужные действия, а сервер сохраняет tenant/project/platform/source isolation..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Зафиксировать principal matrix: anonymous/token viewer, worker assignment, project manager/internal member, tenant owner/admin, project owner, stakeholder, platform grant.
2. Current requireProjectOwner и platform_owner_grants сохранить; capability responses формировать серверно для конкретной projection, не по имени «owner».
3. Перед AI/retrieval/export/media original применять audience projection; post-filter после LLM недостаточен.
4. Связать revoke/delete/version с private media, share, notification preview, caches, graph derived results; current migration receipts использовать до любого будущего apply.

**Критерии приёмки — ещё не проверены:**

- **V2-ARCH-07-AC-01 · NOT_RUN:** Одна роль не наследует несвязанные privileges из другого namespace.
- **V2-ARCH-07-AC-02 · NOT_RUN:** Tenant/project/assignment negatives и revoked membership применяются к reads, writes, originals, exports, AI context.
- **V2-ARCH-07-AC-03 · NOT_RUN:** Customer видит только approved commercial totals; internal cost/margin/inferred sensitive relations отсутствуют.
- **V2-ARCH-07-AC-04 · NOT_RUN:** Опубликованная ссылка имеет собственные scope/expiry/revoke, не просто copied internal URL.

**Будущие проверки — NOT_RUN:**

- **V2-ARCH-07-TEST-01 · NOT_RUN:** Existing policy/RLS/route contract suites plus direct negative fixtures per principal.
- **V2-ARCH-07-TEST-02 · NOT_RUN:** Source/readback audit of payload fields before UI and LLM; original/share revoke tests.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/lib/tenant/tenant.policy.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/tenant/tenant.policy.ts#L1)
- [apps/web/lib/tenant/stakeholder-dashboard-paths.ts:47](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/tenant/stakeholder-dashboard-paths.ts#L47)
- [apps/web/lib/domain/projects/project-access.ts:54](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/projects/project-access.ts#L54)
- [apps/web/lib/platform-owner/require-platform-owner-page.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/platform-owner/require-platform-owner-page.ts#L1)
- [apps/web/lib/platform-owner/require-platform-owner-api.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/platform-owner/require-platform-owner-api.ts#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-09](AUDIT_REPORT_RU.md#web-09), [WEB-10](AUDIT_REPORT_RU.md#web-10).

**Канон:** Phase 0; 2; 13; AIS-PILOT-001; AIS-OWNER-001; AIS-EVID-002.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-ARCH-07`.

## V2-AND-01

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001; release scope `ANDROID_DEFERRED`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-and-01).

**Сессия с refresh и запретом выполнения работы от другого аккаунта**

**P1 · ANDROID · CURRENT_MINIMUM · PROPOSED / NOT_RUN**

**Результат:** Выделить SessionRepository вокруг существующих AuthService/SessionStore, сохранив EncryptedSharedPreferences. Хранить access/refresh/expiry/userId, environmentId и sessionGeneration; tenantId связывается только после подтверждённого bootstrap.

**Предлагаемый владелец:** Android owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M; требует auth fixtures и Android testability extraction. **Порядок DAG:** 12.

**Роли:** Worker; Manager.

**Экраны / семейства:** Login; Bootstrap; любое незавершённое действие.

**Основные действия:** Войти; Продолжить после восстановления сессии; Выйти.

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Выделить SessionRepository вокруг существующих AuthService/SessionStore, сохранив EncryptedSharedPreferences. Хранить access/refresh/expiry/userId, environmentId и sessionGeneration; tenantId связывается только после подтверждённого bootstrap.
2. Добавить single-flight refresh и максимум один повтор исходного запроса после 401; запретить auth retry loop. При rotation refresh token атомарно заменить пару.
3. Каждый request/operation захватывает OwnerKey(environmentId,appProfile,userId,tenantId) и generation; поздний ответ прежней generation не обновляет новый UI/cache/outbox.
4. Expired session переводит собственные операции в NeedsAuthentication, сохраняет draft/photos; re-login того же owner возобновляет, другого — оставляет старую очередь недоступной и без отправки новым bearer.
5. Logout сначала останавливает scheduling/generation, выполняет best-effort unregister отдельного owner, очищает credentials/экранные данные. Старый cursor мигрировать как invalid/unscoped и заново bootstrap; пользовательские drafts хранить только в owner partition согласно согласованному retention policy.
6. Не сохранять пароль. Не расширять social/OTP/QR auth в этом ticket.
7. Однократный replay после подтверждённого refresh вслед за401 сохраняет того же owner, body и idempotency key. Это правило не разрешает автоматический повтор timeout/5xx с неизвестным outcome; такой результат обрабатывается по CON01.

**API и контракты:**

- Supabase /auth/v1/token?grant_type=password
- Supabase /auth/v1/token?grant_type=refresh_token — proposed Android use, fixture against pinned auth contract
- existing /api/v1/* ApiClient requests
- POST /api/v1/devices/unregister

**Состояния, которые нужно сохранить или реализовать:**

- SignedOut
- SigningIn
- Refreshing
- AuthenticatedNeedsTenant
- Ready(owner)
- NeedsAuthentication(owner)
- ForbiddenMembership
- SigningOut
- Offline

**Критерии приёмки — ещё не проверены:**

- **V2-AND-01-AC-01 · NOT_RUN:** AC01 Одновременные три 401 вызывают один refresh; после успеха каждый исходный запрос повторяется не более одного раза.
- **V2-AND-01-AC-02 · NOT_RUN:** AC02 Failed/invalid refresh показывает re-login, без циклических запросов, без удаления собственного draft/media.
- **V2-AND-01-AC-03 · NOT_RUN:** AC03 A→logout→B не показывает draft/media/cursor A и не выполняет A operation с bearer B; late response A игнорируется.
- **V2-AND-01-AC-04 · NOT_RUN:** AC04 Re-login A в той же environment/tenant восстанавливает только A queue; смена tenant/environment делает отдельный namespace.
- **V2-AND-01-AC-05 · NOT_RUN:** AC05 Upgrade с текущих access-only prefs требует controlled re-login, без crash и без чтения legacy unscoped cursor как valid.
- **V2-AND-01-AC-06 · NOT_RUN:** AC06 401 из loadTasks/feedback больше не маскируется empty state; session failure централизован.
- **V2-AND-01-AC-07 · NOT_RUN:** AC07 Refresh token, bearer, signed URL и push token отсутствуют в логах/analytics/screenshots.

**Будущие проверки — NOT_RUN:**

- **V2-AND-01-TEST-01 · NOT_RUN:** Fake clock + concurrent refresh + rotation + invalid refresh; exact request counts.
- **V2-AND-01-TEST-02 · NOT_RUN:** Password/refresh success and 400/401 body fixtures; unknown JSON fields tolerated.
- **V2-AND-01-TEST-03 · NOT_RUN:** Deferred responses A/B and owner generation fence on cache/outbox/register.
- **V2-AND-01-TEST-04 · NOT_RUN:** Token expiry во время note/photo processing; re-login same/different account after process restart.

**Предлагаемое деление PR:**

- Session model/migration + tests
- ApiClient refresh/generation integration + device proof

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `android/shared/src/main/java/ai/aistroyka/shared/auth/SessionRepository.kt`
- `android/shared/src/main/java/ai/aistroyka/shared/auth/OwnerKey.kt`

**Проверенные исходные точки:**

- [android/shared/src/main/java/ai/aistroyka/shared/SessionStore.kt:11](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/SessionStore.kt#L11)
- [android/shared/src/main/java/ai/aistroyka/shared/AuthService.kt:26](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/AuthService.kt#L26)
- [android/shared/src/main/java/ai/aistroyka/shared/ApiClient.kt:33](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/ApiClient.kt#L33)
- [android/shared/src/main/java/ai/aistroyka/shared/PushRegistrationService.kt:15](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/PushRegistrationService.kt#L15)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerViewModel.kt:592](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerViewModel.kt#L592)
- [android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ManagerViewModel.kt:362](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ManagerViewModel.kt#L362)

**Условия остановки зависимого среза:**



**Условие выпуска:** Session recovery, A/B/tenant fence и migration fixtures PASS; device expiry run на конкретном build. Не выдавать network retry как замену durable draft.

**Rollback:** Откатить новый scheduler/refresh через controlled migration; не удалять owner-partitioned pending work и не включать legacy unscoped replay.

**Находки:** [AND-003](AUDIT_REPORT_RU.md#and-003), [AND-004](AUDIT_REPORT_RU.md#and-004), [AND-011](AUDIT_REPORT_RU.md#and-011), [AND-014](AUDIT_REPORT_RU.md#and-014).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-AND-01`.

## V2-CON-02

**Интеграция 20.10.2026:** Phase 0; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-con-02).

**Общий Worker bootstrap и разрешённый identity context**

**P1 · CONTRACT · CONTRACT · PROPOSED / NOT_RUN**

**Результат:** Согласовать Worker bootstrap для ios_lite/android_lite/ios_worker/android_worker с authoritative principal, tenant, memberships и capabilities.

**Предлагаемый владелец:** Backend domain owner + web/native reviewers. Конкретный исполнитель не назначен.

**Оценка:** M/L: уточнить после contract fixture. **Порядок DAG:** 13.

**Роли:** Worker / Manager / Customer.

**Экраны / семейства:** См. source trace; См. source trace; login/home/detail; home/sync.

**Обязательные зависимости:** [V2-ARCH-04](#v2-arch-04), [V2-ARCH-07](#v2-arch-07)

**Шаги реализации:**

1. Согласовать Worker bootstrap для ios_lite/android_lite/ios_worker/android_worker с authoritative principal, tenant, memberships и capabilities.
2. Если используется GET /api/v1/me — добавить только нужный method/path в общий allow-list, сохранить route/RLS запреты. Не подменять x-client на Manager.
3. Сохранить существующий auth; отличать no-membership, forbidden, offline, expired session и recoverable bootstrap. Proposed current_day согласуется отдельным именованным срезом ARCH04.

**Критерии приёмки — ещё не проверены:**

- **V2-CON-02-AC-01 · NOT_RUN:** Четыре Worker profiles получают разрешённый own context; negative method/path/tenant/role fixtures закрыты.
- **V2-CON-02-AC-02 · NOT_RUN:** iOS/Android используют один fixture contract, без tenantId из недоверенного UI.
- **V2-CON-02-AC-03 · NOT_RUN:** Смена user/tenant/environment не применяет прежние callbacks и cache.

**Будущие проверки — NOT_RUN:**

- **V2-CON-02-TEST-01 · NOT_RUN:** Header/method/path allow-list positive и negative contract tests.
- **V2-CON-02-TEST-02 · NOT_RUN:** Два principals, две организации, revoked membership, session expired, offline bootstrap.

**Проверенные исходные точки:**

- [apps/web/lib/api/lite-allow-list.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/api/lite-allow-list.ts#L1)
- [apps/web/app/api/v1/me/route.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/me/route.ts#L1)

**Условия остановки зависимого среза:**

- Неподтверждённый контракт или неожиданный scope — остановить зависимый срез и зафиксировать вопрос; продолжить независимые работы.
- Не выполнять merge/deploy/migration/provider/store actions без действующей авторизации и gates.

**Условие выпуска:** Общий контракт и затронутые клиентские journeys подтверждены на staging

**Rollback:** Изолированный код/flag rollback, сохраняя пользовательский ввод, принятую историю и существующие server IDs.

**Находки:** [IOS-01](AUDIT_REPORT_RU.md#ios-01), [IOS-16](AUDIT_REPORT_RU.md#ios-16), [AND-014](AUDIT_REPORT_RU.md#and-014), [AND-004](AUDIT_REPORT_RU.md#and-004).

**Канон:** Phase 0; 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-CON-02`.

## V2-AND-02

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001; release scope `ANDROID_DEFERRED`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-and-02).

**Проверяемый bootstrap, членство и разрешённые действия**

**P1 · ANDROID · CURRENT_MINIMUM · PROPOSED / NOT_RUN**

**Результат:** Выделить BootstrapState вместо немедленного home после password grant: authentication, identity, membership, role/capability, essential data; помощь грузится независимо.

**Предлагаемый владелец:** Android owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M; Android + небольшой coordinated backend contract. **Порядок DAG:** 14.

**Роли:** Worker; Manager; owner/admin reviewer; project manager; viewer/no membership.

**Экраны / семейства:** Login→Bootstrap; Worker Home; Manager Home; Manager Detail.

**Основные действия:** Продолжить работу; Повторить загрузку; Выбрать другой аккаунт; Открыть разрешённую очередь.

**Обязательные зависимости:** [V2-AND-01](#v2-and-01), [V2-CON-02](#v2-con-02)

**Шаги реализации:**

1. Выделить BootstrapState вместо немедленного home после password grant: authentication, identity, membership, role/capability, essential data; помощь грузится независимо.
2. Переиспользовать /me. Worker вызов требует точечного GET allow-list test; не менять profile на manager для обхода.
3. Разделить appProfile, tenantRole и project membership. Отобразить название tenant из текущего /me вместо обрезанного UUID, если оно есть; null tenant имеет отдельный screen state.
4. Согласовать readonly capability на report detail на основе того же canReview policy helper, что PATCH. Unknown/denied UI не предлагает review; сервер остаётся авторитетом при race.
5. Для task-linked report явно показывать подтверждённый объект/задачу; случай «нет задач» и «нет доступа» имеют разные действия.
6. Не создавать multi-tenant switcher, invitations или новые screens social onboarding в рамках данного исправления.

**API и контракты:**

- GET /api/v1/me
- GET /api/v1/projects
- GET /api/v1/worker/tasks/today?project_id=
- GET /api/v1/reports/:id
- PATCH /api/v1/reports/:id (authoritative permissions)

**Состояния, которые нужно сохранить или реализовать:**

- LoadingIdentity
- NoMembership
- WrongSurface/ReadOnly
- LoadingEssentialData
- EmptyAssignedWork
- Ready
- Forbidden
- OfflineCached
- RetryableError

**Исходные platform contract references:**

- ANDROID-IDENTITY

Сопоставить с общим ownership CON/ARCH из раздела 3; не создавать параллельный серверный контракт.

**Критерии приёмки — ещё не проверены:**

- **V2-AND-02-AC-01 · NOT_RUN:** AC01 До identity/membership результата основное protected действие недоступно; help latency не удерживает основной экран в loading.
- **V2-AND-02-AC-02 · NOT_RUN:** AC02 /me null tenant показывает «Нет доступа к организации» + понятное действие; не пустой список проектов и не бесконечный spinner.
- **V2-AND-02-AC-03 · NOT_RUN:** AC03 android_worker и android_lite GET /me разрешены точечно; forbidden routes/peer report tests остаются зелёными.
- **V2-AND-02-AC-04 · NOT_RUN:** AC04 Reviewer owner/admin, project manager A, non-member B, viewer и worker profile получают правильный canReview по server policy; UI не вычисляет permission из названия app.
- **V2-AND-02-AC-05 · NOT_RUN:** AC05 403 после уже отображённого canReview сохраняет note, обновляет capability, объясняет изменение доступа без ложного success.
- **V2-AND-02-AC-06 · NOT_RUN:** AC06 Название объекта/задачи в draft совпадает с подтверждённым task.project_id, а не только с последним tap фильтра.
- **V2-AND-02-AC-07 · NOT_RUN:** AC07 Essential bootstrap ошибки 401/403/offline/500 различимы и retry не дублирует операции.

**Будущие проверки — NOT_RUN:**

- **V2-AND-02-TEST-01 · NOT_RUN:** /me identity/nulls/tenant_name + additive can_review fixtures; worker allow-list positive/negative.
- **V2-AND-02-TEST-02 · NOT_RUN:** State transition login→membership→ready; stale identity after A/B ignored; helper errors nonblocking.
- **V2-AND-02-TEST-03 · NOT_RUN:** No membership, viewer, project manager without project access, expired token and retry.

**Предлагаемое деление PR:**

- Identity allow-list/capability fixture
- Native bootstrap state integration

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `android/shared/src/main/java/ai/aistroyka/shared/bootstrap/BootstrapState.kt`
- `apps/web/lib/domain/reports/report-review-capability.ts`

**Проверенные исходные точки:**

- [android/shared/src/main/java/ai/aistroyka/shared/ManagerDtos.kt:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/ManagerDtos.kt#L1)
- [android/shared/src/main/java/ai/aistroyka/shared/ManagerApi.kt:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/ManagerApi.kt#L1)
- [android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ManagerViewModel.kt:101](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ManagerViewModel.kt#L101)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerViewModel.kt:154](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerViewModel.kt#L154)
- [android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ui/ManagerApp.kt:564](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ui/ManagerApp.kt#L564)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerApp.kt:81](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerApp.kt#L81)
- [apps/web/lib/api/lite-allow-list.ts:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/api/lite-allow-list.ts#L12)
- [apps/web/lib/api/lite-allow-list.test.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/api/lite-allow-list.test.ts#L1)
- [apps/web/app/api/v1/me/route.ts:13](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/me/route.ts#L13)
- [apps/web/app/api/v1/reports/[id]/route.ts:193](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/reports/%5Bid%5D/route.ts#L193)

**Условия остановки зависимого среза:**



**Условие выпуска:** Role/membership fixture matrix и native no-membership/forbidden screens проверены; server policy parity tests обязательны при helper extraction.

**Rollback:** Скрывать capability-dependent mutation при unavailable contract; не переключать x-client и не расширять роли.

**Находки:** [AND-014](AUDIT_REPORT_RU.md#and-014), [AND-009](AUDIT_REPORT_RU.md#and-009), [AND-016](AUDIT_REPORT_RU.md#and-016).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-AND-02`.

## V2-ARCH-02

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-arch-02).

**Типизированные ресурсные состояния и recovery commands**

**P1 · ARCH · ARCHITECTURE · PROPOSED / NOT_RUN**

**Результат:** Общий UI контракт различает loading/empty/error/partial/stale/forbidden и частичный mutation success.

**Предлагаемый владелец:** Architecture/domain owner + web/mobile reviewers. Конкретный исполнитель не назначен.

**Оценка:** M: 3–5 дней. **Порядок DAG:** 15.

**Экраны / семейства:** F07; F09; F10; F11; F18; F28; F29.

**Основные действия:** Общий UI контракт различает loading/empty/error/partial/stale/forbidden и частичный mutation success..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. В existing query layer ввести discriminated Result/ResourceState и typed ApiError (code/status/requestId/retryability); source metadata optional и backward compatible.
2. Различить first-load failure, background refresh failure со stale data, empty result и forbidden; убрать catch→[] в защищённых read adapters после согласования privacy semantics.
3. Command state включает pending/confirmed/failed/partially_confirmed и persisted entity id; retry повторяет только незавершённый шаг.
4. Reuse current ErrorState/EmptyState/Modal and robust publication expected_version mechanics; не заменять все компоненты одновременно.

**Критерии приёмки — ещё не проверены:**

- **V2-ARCH-02-AC-01 · NOT_RUN:** HTTP500 нельзя скомпилировать в Success<[]> без explicit intended empty policy.
- **V2-ARCH-02-AC-02 · NOT_RUN:** Ошибки не раскрывают SQL/secrets, но содержат понятный recovery и correlation id.
- **V2-ARCH-02-AC-03 · NOT_RUN:** No infinite retry/duplicate mutation; Abort/race не перезаписывает новый entity.
- **V2-ARCH-02-AC-04 · NOT_RUN:** Offline read показывает freshness, запись требует подтверждения сервера или existing outbox receipt.

**Будущие проверки — NOT_RUN:**

- **V2-ARCH-02-TEST-01 · NOT_RUN:** Fault-injection contract table 401/403/404/409/422/429/5xx/network.
- **V2-ARCH-02-TEST-02 · NOT_RUN:** Representative dashboard/tasks/docs/publication integration tests, then adopt incrementally.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/lib/query/queryClient.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/query/queryClient.ts#L1)
- [apps/web/lib/query/render.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/query/render.tsx#L1)
- [apps/web/components/canon/canon-live-data.ts:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/canon-live-data.ts#L8)
- [apps/web/components/canon/ProjectDocumentsCanonPanel.tsx:228](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/ProjectDocumentsCanonPanel.tsx#L228)
- [apps/web/components/canon/ReportPublicationControls.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/ReportPublicationControls.tsx#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-04](AUDIT_REPORT_RU.md#web-04), [WEB-07](AUDIT_REPORT_RU.md#web-07), [WEB-16](AUDIT_REPORT_RU.md#web-16), [WEB-20](AUDIT_REPORT_RU.md#web-20).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-ARCH-02`.

## V2-ARCH-06

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001, AIS-OWNER-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-arch-06).

**Единые read models, полнота и cache invalidation**

**P2 · ARCH · ARCHITECTURE · PROPOSED / NOT_RUN**

**Результат:** Dashboard/inbox/portal считают один и тот же scope и обновляются после подтверждённой команды.

**Предлагаемый владелец:** Architecture/domain owner + web/mobile reviewers. Конкретный исполнитель не назначен.

**Оценка:** M: 3–5 дней. **Порядок DAG:** 16.

**Экраны / семейства:** F07; F08; F13; F16; F21; F37.

**Основные действия:** Dashboard/inbox/portal считают один и тот же scope и обновляются после подтверждённой команды..

**Обязательные зависимости:** [V2-ARCH-02](#v2-arch-02), [V2-ARCH-04](#v2-arch-04)

**Шаги реализации:**

1. Согласовать filters/pagination/aggregation denominator и completeness metadata в existing service read models.
2. Portfolio aggregation выполняется по объявленному scope, currency grouped; UI не делает hidden first6 cross-project total.
3. Central query keys include tenant/project/role/projection; mutation invalidation обновляет task/report/approval/project summary только по нужным keys.
4. Revoke/logout/role change удаляют недопустимый cache; не использовать один shared internal/customer cache.
5. Query/cache key включает environment + app/audience namespace + authenticated subject + tenant + resource/filter scope. Session generation защищает callback, но не заменяет стабильную identity хранимого draft.
6. Report pagination реализуется один раз в V2-CON-04; остальные bounded collections имеют собственные полноту/count semantics.

**Критерии приёмки — ещё не проверены:**

- **V2-ARCH-06-AC-01 · NOT_RUN:** List counts и detail/portfolio totals согласованы при одинаковом filter.
- **V2-ARCH-06-AC-02 · NOT_RUN:** Partial failure имеет coverage и не выглядит как zero.
- **V2-ARCH-06-AC-03 · NOT_RUN:** После approve/publish/change order нужные inbox/card/customer views обновляются без hard reload.
- **V2-ARCH-06-AC-04 · NOT_RUN:** Cross-tenant role switch не оставляет старые protected records.

**Будущие проверки — NOT_RUN:**

- **V2-ARCH-06-TEST-01 · NOT_RUN:** Aggregation fixtures complete/partial/mixed currency/page2.
- **V2-ARCH-06-TEST-02 · NOT_RUN:** Mutation→query invalidation integration; role/logout cache negative checks.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/lib/domain/portfolio/portfolio-control.service.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/portfolio/portfolio-control.service.ts#L1)
- [apps/web/lib/domain/projects/project-summary.repository.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/projects/project-summary.repository.ts#L1)
- [apps/web/lib/domain/approvals/pending-approvals.service.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/approvals/pending-approvals.service.ts#L1)
- [apps/web/components/canon/canon-live-data.ts:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/canon-live-data.ts#L8)
- [apps/web/lib/query/queryClient.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/query/queryClient.ts#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-07](AUDIT_REPORT_RU.md#web-07), [WEB-17](AUDIT_REPORT_RU.md#web-17).

**Канон:** Phase 1; 4; 7; 13; AIS-PILOT-001; AIS-OWNER-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-ARCH-06`.

## V2-CON-01

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001, AIS-EVID-002; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-con-01).

**Долговечный результат повторяемой операции и защита от дубликатов**

**P1 · CONTRACT · CONTRACT · PROPOSED / NOT_RUN**

**Результат:** Для каждого writer установить доказуемый outcome после lost response: использовать существующие CAS/unique constraints/readback; закрыть оставшиеся окна отдельным backend срезом.

**Предлагаемый владелец:** Backend domain owner + web/native reviewers. Конкретный исполнитель не назначен.

**Оценка:** M/L: уточнить после contract fixture. **Порядок DAG:** 17.

**Роли:** Worker / Manager / Customer.

**Экраны / семейства:** См. source trace; См. source trace; report/evidence; /dashboard/tasks / /dashboard/tasks/[id]; /dashboard/projects/[id]?tab=documents.

**Обязательные зависимости:** [V2-ARCH-04](#v2-arch-04), [V2-ARCH-07](#v2-arch-07)

**Шаги реализации:**

1. Для каждого writer установить доказуемый outcome после lost response: использовать существующие CAS/unique constraints/readback; закрыть оставшиеся окна отдельным backend срезом.
2. Зафиксировать owner+operationId+payloadHash+resultId/version; одинаковый ключ с иным payload не переиспользует чужой ответ. Не обещать exactly-once транспорта.
3. Проверить crash между business write и receipt, TTL24h и недоступное receipt storage. Для недоказуемого результата возвращать NeedsReconciliation, сохранять draft; автоматический повтор новой mutation не разрешать.
4. Upload/finalize/link — отдельные восстанавливаемые шаги. Не создавать фиктивную распределённую транзакцию с Storage или AI provider. Existing AI completion остаётся у ARCH05.

**Критерии приёмки — ещё не проверены:**

- **V2-CON-01-AC-01 · NOT_RUN:** Один logical intent после timeout/restart/replay за пределами24h создаёт один подтверждённый результат либо явный NeedsReconciliation без второго эффекта.
- **V2-CON-01-AC-02 · NOT_RUN:** Конкурентный повтор возвращает тот же resultId/version; иной owner или payload отвергается.
- **V2-CON-01-AC-03 · NOT_RUN:** Каждый клиент знает, какие endpoint можно повторять автоматически и как читать итог.

**Будущие проверки — NOT_RUN:**

- **V2-CON-01-TEST-01 · NOT_RUN:** Контрактная матрица same/different payload, concurrency, stale owner,24h+, unavailable store.
- **V2-CON-01-TEST-02 · NOT_RUN:** Fault injection после DB commit до receipt/response; readback проверяет именно intended result/version.

**Проверенные исходные точки:**

- [apps/web/lib/api/lite-idempotency.ts:49](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/api/lite-idempotency.ts#L49)
- [apps/web/lib/platform/idempotency/idempotency.types.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/platform/idempotency/idempotency.types.ts#L1)
- [apps/web/lib/platform/idempotency/idempotency.repository.ts:10](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/platform/idempotency/idempotency.repository.ts#L10)

**Условия остановки зависимого среза:**

- Неподтверждённый контракт или неожиданный scope — остановить зависимый срез и зафиксировать вопрос; продолжить независимые работы.
- Не выполнять merge/deploy/migration/provider/store actions без действующей авторизации и gates.

**Условие выпуска:** Общий контракт и затронутые клиентские journeys подтверждены на staging

**Rollback:** Изолированный код/flag rollback, сохраняя пользовательский ввод, принятую историю и существующие server IDs.

**Находки:** [IOS-04](AUDIT_REPORT_RU.md#ios-04), [IOS-05](AUDIT_REPORT_RU.md#ios-05), [AND-012](AUDIT_REPORT_RU.md#and-012), [WEB-04](AUDIT_REPORT_RU.md#web-04), [WEB-16](AUDIT_REPORT_RU.md#web-16).

**Канон:** Phase 0; 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-CON-01`.

## V2-CON-03

**Интеграция 20.10.2026:** Phase 6; AIS-EVID-002, AIS-OWNER-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-con-03).

**Идентичность вложения, версия и добавление исправлений**

**P1 · CONTRACT · CONTRACT · PROPOSED / NOT_RUN**

**Результат:** Определить source/association identity отдельно от file_url; разрешать media_id и upload_session_id сервером и возвращать достаточную projection всем читателям.

**Предлагаемый владелец:** Backend domain owner + web/native reviewers. Конкретный исполнитель не назначен.

**Оценка:** M/L: уточнить после contract fixture. **Порядок DAG:** 18.

**Роли:** Worker / Manager / Customer.

**Экраны / семейства:** См. source trace; detail; resubmit; /dashboard/reports/[id]; Submit report → AI result.

**Обязательные зависимости:** [V2-ARCH-04](#v2-arch-04), [V2-ARCH-07](#v2-arch-07)

**Шаги реализации:**

1. Определить source/association identity отдельно от file_url; разрешать media_id и upload_session_id сервером и возвращать достаточную projection всем читателям.
2. До link замена A→B создаёт новую локальную revision. После link сохранять исходное доказательство; correction по умолчанию append к прежнему reportId.
3. Переиспользовать existing report_before/report_after purpose. Legacy unknown показывать как Фото; первые2элемента массива не доказывают пару.
4. Истинное supersede после link — отдельное additive решение с audit и invalidation. Отзыв публикации/права влияет на URL/cache/AI source.

**Критерии приёмки — ещё не проверены:**

- **V2-CON-03-AC-01 · NOT_RUN:** Worker preview, uploaded item, Manager detail, Web viewer и AI source указывают на ту же подтверждённую identity/revision.
- **V2-CON-03-AC-02 · NOT_RUN:** Late callbackA не восстанавливает A после выбораB.
- **V2-CON-03-AC-03 · NOT_RUN:** Correction сохраняет original и reportId; независимый draftR2 не очищается после correctionR1.

**Будущие проверки — NOT_RUN:**

- **V2-CON-03-TEST-01 · NOT_RUN:** A→upload→B replacement, late callback, process kill на каждом шаге.
- **V2-CON-03-TEST-02 · NOT_RUN:** 0/1/2/7+media, session-only, legacy purpose unknown, URL renewal/revoke.

**Проверенные исходные точки:**

- [apps/web/lib/domain/reports/report.repository.ts:218](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/reports/report.repository.ts#L218)

**Условия остановки зависимого среза:**

- Неподтверждённый контракт или неожиданный scope — остановить зависимый срез и зафиксировать вопрос; продолжить независимые работы.
- Не выполнять merge/deploy/migration/provider/store actions без действующей авторизации и gates.

**Условие выпуска:** Общий контракт и затронутые клиентские journeys подтверждены на staging

**Rollback:** Изолированный код/flag rollback, сохраняя пользовательский ввод, принятую историю и существующие server IDs.

**Находки:** [IOS-04](AUDIT_REPORT_RU.md#ios-04), [AND-001](AUDIT_REPORT_RU.md#and-001), [AND-005](AUDIT_REPORT_RU.md#and-005), [WEB-12](AUDIT_REPORT_RU.md#web-12), [ARCH-001](AUDIT_REPORT_RU.md#arch-001).

**Канон:** Phase 0; 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-CON-03`.

## V2-CON-04

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001D; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-con-04).

**Полные списки отчётов: фильтры до limit, курсор и счётчики**

**P1 · CONTRACT · CONTRACT · PROPOSED / NOT_RUN**

**Результат:** Добавить обратно совместимый server pagination contract для /api/v1/reports; status/project/q фильтруются до ограничения выборки.

**Предлагаемый владелец:** Backend domain owner + web/native reviewers. Конкретный исполнитель не назначен.

**Оценка:** M/L: уточнить после contract fixture. **Порядок DAG:** 19.

**Роли:** Worker / Manager / Customer.

**Экраны / семейства:** reports/detail.

**Обязательные зависимости:** [V2-ARCH-04](#v2-arch-04), [V2-ARCH-06](#v2-arch-06)

**Шаги реализации:**

1. Добавить обратно совместимый server pagination contract для /api/v1/reports; status/project/q фильтруются до ограничения выборки.
2. Стабильный порядок с tie-breaker, opaque next cursor/hasMore и определённая семантика count. Точный total возвращать только когда реально вычислен для текущего scope.
3. Новые клиенты используют общий contract; существующие клиенты получают допустимую старую projection. Повышение limit не является исправлением полноты.

**Критерии приёмки — ещё не проверены:**

- **V2-CON-04-AC-01 · NOT_RUN:** Fixture205смешанных отчётов: All/A/B/Без привязки и status дают весь ожидаемый набор без пропусков/дублей.
- **V2-CON-04-AC-02 · NOT_RUN:** После review list/count invalidation отражает подтверждённый новый state.
- **V2-CON-04-AC-03 · NOT_RUN:** При неизвестном total UI не выдаёт размер текущей страницы за общее количество.

**Будущие проверки — NOT_RUN:**

- **V2-CON-04-TEST-01 · NOT_RUN:** Contract fixtures205, одинаковые timestamps, вставка/обновление между страницами, tenant/role negatives.
- **V2-CON-04-TEST-02 · NOT_RUN:** Consumer fixtures Web/iOS/Android и восстановление filters после Back.

**Проверенные исходные точки:**

- [apps/web/app/api/v1/reports/route.ts:17](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/reports/route.ts#L17)

**Условия остановки зависимого среза:**

- Неподтверждённый контракт или неожиданный scope — остановить зависимый срез и зафиксировать вопрос; продолжить независимые работы.
- Не выполнять merge/deploy/migration/provider/store actions без действующей авторизации и gates.

**Условие выпуска:** Общий контракт и затронутые клиентские journeys подтверждены на staging

**Rollback:** Изолированный код/flag rollback, сохраняя пользовательский ввод, принятую историю и существующие server IDs.

**Находки:** [AND-017](AUDIT_REPORT_RU.md#and-017).

**Канон:** Phase 0; 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-CON-04`.

## V2-IOS-02

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001, AIS-OWNER-002; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-02).

**Привязать кэш, drafts и outbox к неизменяемому владельцу**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Продолжить только свою работу после входа или смены компании

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** L. **Порядок DAG:** 20.

**Роли:** Worker; Manager; Customer.

**Экраны / семейства:** Root / logout; Все cached списки; Очередь и фоновые upload callbacks.

**Основные действия:** Продолжить только свою работу после входа или смены компании.

**Ввод и предпосылки:** environment + userId + tenantId; session epoch; неизменяемый owner у draft и operation; политика retained drafts.

**Обязательные зависимости:** [V2-IOS-01](#v2-ios-01), [V2-CON-02](#v2-con-02)

**Шаги реализации:**

1. Описать SessionScope и приёмочную политику logout: pause/retain/clear для каждого store; использовать существующий session epoch guard.
2. Ввести scoped keys/каталоги и owner fields с версионированной миграцией operations.json; неизвестного владельца старой записи не угадывать из новой сессии.
3. Перед replay, после await и в background delegate проверять scope/epoch; результат старой сессии сохранять в её namespace или изолировать согласно политике.
4. Атомарно переключать активные repositories; очищать видимые caches без уничтожения единственной копии неотправленного отчёта.

**API и контракты:**

- AuthService currentSession/getAccessToken; GET /api/v1/me
- Существующие REST writers: проверять тот же owner до запроса и перед локальным commit

**Состояния, которые нужно сохранить или реализовать:**

- signedOut
- checkingRole
- scopeReady
- scopeChanging
- retainedInactiveDraft
- replayPaused
- accessRevoked

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-02-AC-01 · NOT_RUN:** Given A с draft, When logout→B login, Then B не видит A preview, task cache, cursor или очередь и executor не отправляет A intent токеном B.
- **V2-IOS-02-AC-02 · NOT_RUN:** Given upload callback A пришёл после смены сессии, Then он не изменяет draft B.
- **V2-IOS-02-AC-03 · NOT_RUN:** Given retained policy и повторный вход A, Then его draft восстанавливается по той же identity.
- **V2-IOS-02-AC-04 · NOT_RUN:** Given server403 после revoke, Then replay остановлен и права не обходятся.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-02-TEST-01 · NOT_RUN:** Production repository migration fixture: старый формат, новый scope, повреждённый/частично записанный файл.
- **V2-IOS-02-TEST-02 · NOT_RUN:** Actor/state race test с управляемым token provider и delayed callback; не копировать guard в тест.
- **V2-IOS-02-TEST-03 · NOT_RUN:** Device: A/B в одном и разных tenant, offline restart и logout во время upload.

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `ios/AiStroykaWorker/AiStroykaWorker/Persistence/SessionScope.swift`
- `ios/AiStroykaManager/AiStroykaManager/Services/ManagerRepositoryScope.swift`

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/AppState.swift:45](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/AppState.swift#L45)
- [ios/AiStroykaWorker/AiStroykaWorker/Persistence/AppStateStore.swift:223](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Persistence/AppStateStore.swift#L223)
- [ios/AiStroykaWorker/AiStroykaWorker/Persistence/Operation.swift:92](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Persistence/Operation.swift#L92)
- [ios/AiStroykaWorker/AiStroykaWorker/Persistence/OperationQueueStore.swift:26](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Persistence/OperationQueueStore.swift#L26)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/OperationQueueExecutor.swift:144](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/OperationQueueExecutor.swift#L144)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/BackgroundUploadService.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/BackgroundUploadService.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/ManagerSessionState.swift:259](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/ManagerSessionState.swift#L259)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerV43Models.swift:186](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerV43Models.swift#L186)
- [ios/AiStroykaCustomer/AiStroykaCustomer/CustomerSessionState.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/CustomerSessionState.swift#L1)
- [ios/Shared/Sources/Shared/AuthService.swift:173](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/AuthService.swift#L173)

**Условия остановки зависимого среза:**

- Неизвестная принадлежность исторического draft — quarantine/recovery, не присвоение текущему user.
- Изменение RLS/tenant semantics требует отдельного backend review; UI скрытие недостаточно.

**Условие выпуска:** G1; G2; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-01](AUDIT_REPORT_RU.md#ios-01).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-02`.

## V2-IOS-03

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001, AIS-OWNER-002; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-03).

**Завершить понятный вход, role recovery и первое использование**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Войти существующим способом и попасть в правильное приложение/проект

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M. **Порядок DAG:** 21.

**Роли:** Worker; Manager; Customer.

**Экраны / семейства:** Worker Onboarding/Login/Root; Manager Onboarding/Login/Unauthorized; Customer Login/Root.

**Основные действия:** Войти существующим способом и попасть в правильное приложение/проект.

**Ввод и предпосылки:** email/password или Apple/Google; invite context; profile worker/manager/customer; роль из server response; phone OTP только при включённом флаге.

**Обязательные зависимости:** [V2-IOS-02](#v2-ios-02), [V2-CON-02](#v2-con-02)

**Шаги реализации:**

1. Сохранить существующие Apple nonce, Google PKCE, refresh token и session epoch; не переписывать auth SDK ради этой задачи.
2. Сделать один наблюдаемый auth/role state; игнорировать ответ проверки роли после logout/смены аккаунта.
3. Сохранить invite/deep-link context до успешного разрешения; wrong-app экран объясняет нужную роль и даёт выход/повтор.
4. Проверить путь восстановления пароля через действующий Auth/web contract; добавить явную точку входа только после проверки callback и возврата.

**API и контракты:**

- Supabase Auth password/id_token/pkce/refresh_token существующие методы
- GET /api/v1/me
- Worker project list как разрешённая область, без искусственного повышения роли

**Состояния, которые нужно сохранить или реализовать:**

- empty
- validating
- authenticating
- oauthCanceled
- roleChecking
- wrongApp
- noMembership
- retryableError
- sessionExpired

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-03-AC-01 · NOT_RUN:** Given OAuth cancel, Then форма снова доступна и нет ложной ошибки/успеха.
- **V2-IOS-03-AC-02 · NOT_RUN:** Given stakeholder, Then Customer допускает его по существующему gate; contractor получает объяснение нужного приложения.
- **V2-IOS-03-AC-03 · NOT_RUN:** Given токен истёк во время draft, Then auth recovery сохраняет draft, но не открывает чужую область.
- **V2-IOS-03-AC-04 · NOT_RUN:** Given phone feature off, Then приложение не требует OTP/provider как release prerequisite.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-03-TEST-01 · NOT_RUN:** Unit: production CustomerAuthGate и auth epoch; existing Shared tests расширять по реальной дельте.
- **V2-IOS-03-TEST-02 · NOT_RUN:** UI: empty/invalid credentials, keyboard Next/Go, social cancel, role500→retry.
- **V2-IOS-03-TEST-03 · NOT_RUN:** Staging: Apple/Google callback для каждого bundle и вход по приглашению.

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/RootView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/RootView.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/LoginView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/LoginView.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/WorkerOnboardingView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/WorkerOnboardingView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/ManagerRootView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/ManagerRootView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/ManagerSessionState.swift:259](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/ManagerSessionState.swift#L259)
- [ios/AiStroykaManager/AiStroykaManager/Views/ManagerLoginView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ManagerLoginView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Views/ManagerUnauthorizedView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ManagerUnauthorizedView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Views/ManagerOnboardingView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ManagerOnboardingView.swift#L1)
- [ios/AiStroykaCustomer/AiStroykaCustomer/CustomerRootView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/CustomerRootView.swift#L1)
- [ios/AiStroykaCustomer/AiStroykaCustomer/CustomerSessionState.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/CustomerSessionState.swift#L1)
- [ios/AiStroykaCustomer/AiStroykaCustomer/Views/CustomerLoginView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/Views/CustomerLoginView.swift#L1)
- [ios/Shared/Sources/Shared/AuthService.swift:173](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/AuthService.swift#L173)
- [ios/Shared/Sources/Shared/AuthOAuthSession.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/AuthOAuthSession.swift#L1)
- [ios/Shared/Sources/Shared/CustomerAuthGate.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/CustomerAuthGate.swift#L1)
- [ios/Shared/Sources/Shared/AppRuntime.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/AppRuntime.swift#L1)

**Условия остановки зависимого среза:**

- Нет проверенного recovery callback — оставить конкретный blocked integration шаг, не вести на выдуманный deep link.
- Не добавлять публичную регистрацию/создание tenant в полевой app без принятого продукта и existing contract.

**Условие выпуска:** G1; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-01](AUDIT_REPORT_RU.md#ios-01), [IOS-15](AUDIT_REPORT_RU.md#ios-15).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-03`.

## V2-WEB-05

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001, AIS-OWNER-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-05).

**Связать identity, onboarding и правильное рабочее пространство**

**P1 · WEB · INTEGRATION · PROPOSED / NOT_RUN**

**Результат:** Новый contractor проходит существующий onboarding и получает workspace; invited/customer попадает в свой правильный путь.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 3–5 дней. **Порядок DAG:** 22.

**Экраны / семейства:** F05; F06; F07.

**Основные действия:** Новый contractor проходит существующий onboarding и получает workspace; invited/customer попадает в свой правильный путь..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Восстановить существующий OnboardingGate/flow в dashboard entry или его текущий orchestration equivalent; сначала проверить имеющийся PR и состояние persona.
2. Различить session missing, membership missing, pending invitation, contractor onboarding incomplete, customer intake, existing tenant.
3. Сохранить safe next/locale и existing optional plan-fit поведение; не вводить forced subscribe.
4. Создание workspace выполнить через существующий onboarding/complete idempotent path; без tenant auto-create в read helpers.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-05-AC-01 · NOT_RUN:** Fresh email и OAuth user без membership видит понятный onboarding и достигает первого проекта.
- **V2-WEB-05-AC-02 · NOT_RUN:** Reload/duplicate confirm не создаёт второй tenant; existing member не начинает onboarding заново.
- **V2-WEB-05-AC-03 · NOT_RUN:** Customer/invited не получают contractor tenant автоматически; wrong account invite предлагает переключить identity.
- **V2-WEB-05-AC-04 · NOT_RUN:** Expired recovery/provider cancel сохраняют понятный следующий шаг и локаль.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-05-TEST-01 · NOT_RUN:** Entry state machine unit tests и integration tests current auth callback/onboarding complete.
- **V2-WEB-05-TEST-02 · NOT_RUN:** Staging synthetic role matrix; запись ID очищается только согласно approved test cleanup.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/app/[locale]/(auth)/register/page.tsx:55](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28auth%29/register/page.tsx#L55)
- [apps/web/app/[locale]/(dashboard)/dashboard/page.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/page.tsx#L1)
- [apps/web/lib/api/engine.ts:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/api/engine.ts#L18)
- [apps/web/app/api/v1/onboarding/complete/route.ts:103](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/onboarding/complete/route.ts#L103)
- [apps/web/app/api/auth/callback/route.ts:116](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/auth/callback/route.ts#L116)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-05](AUDIT_REPORT_RU.md#web-05).

**Канон:** Phase 0; 1; 2; 13; AIS-PILOT-001; AIS-OWNER-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-05`.


# M02 — Полевой отчёт, медиа и восстановление

## V2-AND-03

**Интеграция 20.10.2026:** Phase 6; AIS-EVID-002; release scope `ANDROID_DEFERRED`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-and-03).

**Восстанавливаемый черновик и точная связь с задачей/объектом**

**P1 · ANDROID · CURRENT_MINIMUM · PROPOSED / NOT_RUN**

**Результат:** Добавить durable local store в shared (предлагается Room с owner-scoped entities) и repository. Сначала записать localDraftId/owner/revision/note/task/project/day intent, затем разрешать network create.

**Предлагаемый владелец:** Android owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** L; split into two bounded PRs, not one giant ViewModel rewrite. **Порядок DAG:** 23.

**Роли:** Worker.

**Экраны / семейства:** Home / мои черновики; Report.

**Основные действия:** Создать отчёт по задаче; Продолжить черновик; Сохранить и выйти; Удалить локальный незавершённый черновик.

**Обязательные зависимости:** [V2-AND-01](#v2-and-01), [V2-AND-02](#v2-and-02), [V2-CON-01](#v2-con-01)

**Шаги реализации:**

1. Добавить durable local store в shared (предлагается Room с owner-scoped entities) и repository. Сначала записать localDraftId/owner/revision/note/task/project/day intent, затем разрешать network create.
2. Стабильный create idempotency key принадлежит draft, сохраняется до первого send; serverReportId записывается атомарно в этот draft. Reopen не вызывает новый create.
3. UI выбирает подтверждённую assigned task для основного объекта; legacy taskless report явно помечен «Без привязки», не приписывается выбранному проекту. Для собственного object-only flow требуется отдельный contract decision, не тихий project_id параметр.
4. Вынести buildCreateReportJson с omission null/blank optional fields; contract test against Zod. Backend failed parse должен давать 400 без row, rollout совместимости согласовать.
5. Back сохраняет draft и возвращает Home; destructive local discard отдельный явный action. Не объявлять удалённым server draft, если server delete contract отсутствует.
6. Операции используют immutable draft revision. Late upload/create completion старой revision не меняет новый report или другой owner.
7. Черновик доступен после process death/offline; хранение signed URLs не заменяет идентичность/локальный photo файл.
8. Проверить окно/атомарность backend idempotency: сейчас TTL24h и receipt после mutation. Stable key не считать exactly-once. При unknown result вне доказанного replay window — NeedsReconciliation; для автоматического восстановления согласовать durable operation receipt/business uniqueness.

**API и контракты:**

- POST /api/v1/worker/report/create
- GET /api/v1/tasks/:id
- GET /api/v1/reports/:id
- POST /api/v1/worker/report/submit

**Состояния, которые нужно сохранить или реализовать:**

- LocalDraft
- WaitingForSession
- WaitingForValidDay
- CreatePending
- ServerDraft
- Editing
- MediaPending
- ReadyToSubmit
- SubmissionPending
- Submitted
- Conflict
- ArchivedLocal

**Исходные platform contract references:**

- ANDROID-REPORT-CREATE
- ANDROID-OPERATION-RECEIPT

Сопоставить с общим ownership CON/ARCH из раздела 3; не создавать параллельный серверный контракт.

**Критерии приёмки — ещё не проверены:**

- **V2-AND-03-AC-01 · NOT_RUN:** AC01 Note/task/project/day intent и local media references переживают Back, activity recreation и kill/relaunch; Home показывает «Продолжить».
- **V2-AND-03-AC-02 · NOT_RUN:** AC02 Двойной tap/create response lost/restart приводят к одному logical draft/serverReportId с одним stable create key.
- **V2-AND-03-AC-03 · NOT_RUN:** AC03 Day only/task only/both/neither/null/blank create fixtures не теряют валидный sibling; malformed body server 400 без создания отчёта.
- **V2-AND-03-AC-04 · NOT_RUN:** AC04 Выбор A затем B не перепривязывает открытый draft; draft header и server relation согласованы.
- **V2-AND-03-AC-05 · NOT_RUN:** AC05 Assigned task→project A сохраняет A; taskless legacy отчёт явно unassigned и остаётся видим в Manager All/Unassigned.
- **V2-AND-03-AC-06 · NOT_RUN:** AC06 Back не вызывает destructive reset. Discard локальных неотправленных файлов явный и не обещает server deletion.
- **V2-AND-03-AC-07 · NOT_RUN:** AC07 Late response draft r1 не изменяет r2; операций owner A не видно owner B.
- **V2-AND-03-AC-08 · NOT_RUN:** AC08 SubmissionPending восстанавливается после kill и сперва reconciles server state, не создаёт новый report.
- **V2-AND-03-AC-09 · NOT_RUN:** AC-RECEIPT Concurrent same intent, crash между business write и receipt, replay спустя 24h и тот же key с иным payload не создают второй business effect. При недоступной гарантии UI остаётся NeedsReconciliation и не делает blind resend.

**Будущие проверки — NOT_RUN:**

- **V2-AND-03-TEST-01 · NOT_RUN:** Draft repository transitions/serialization/owner keys/revision fence; DB migration old version→new.
- **V2-AND-03-TEST-02 · NOT_RUN:** Kotlin create JSON actual output parsed by canonical Zod: day/task combinations; invalid payload creates0rows.
- **V2-AND-03-TEST-03 · NOT_RUN:** Crash points before request/after server create before local commit; same idempotency key replay.
- **V2-AND-03-TEST-04 · NOT_RUN:** Offline note draft, process kill, Back/reopen, account switch; exact server report count.
- **V2-AND-03-TEST-05 · NOT_RUN:** Same-key concurrency, missing cache/admin, mutation-before-receipt crash, expiry24h, payload-hash mismatch; isolated test rows, no production mutations.

**Предлагаемое деление PR:**

- Persistent entities/migration/repository + contract JSON
- Compose adapter/resume/back + crash proof

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `android/shared/src/main/java/ai/aistroyka/shared/reports/ReportRepository.kt`
- `android/shared/src/main/java/ai/aistroyka/shared/reports/ReportDraft.kt`
- `android/shared/src/main/java/ai/aistroyka/shared/persistence/WorkerDatabase.kt`
- `android/shared/src/main/java/ai/aistroyka/shared/ReportCreateBody.kt`

**Проверенные исходные точки:**

- [android/shared/build.gradle.kts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/build.gradle.kts#L1)
- [android/shared/src/main/java/ai/aistroyka/shared/WorkerApi.kt:64](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/WorkerApi.kt#L64)
- [android/shared/src/main/java/ai/aistroyka/shared/WorkerDtos.kt:105](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/WorkerDtos.kt#L105)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerViewModel.kt:29](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerViewModel.kt#L29)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerApp.kt:314](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerApp.kt#L314)
- [packages/contracts/src/schemas/worker.schema.ts:41](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/packages/contracts/src/schemas/worker.schema.ts#L41)
- [apps/web/app/api/v1/worker/report/create/route.ts:30](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/worker/report/create/route.ts#L30)

**Условия остановки зависимого среза:**



**Условие выпуска:** No-loss/no-duplicate draft test matrix плюс task/project relation end-to-end; Room migration fallback не destructive. Автоматический retry unknown outcome не готов до operation-receipt/dedup gate; stable UUID alone is insufficient.

**Rollback:** Отключить новый create scheduling при regression, оставить resume/read/export собственных drafts; не drop tables и не удалять pending files.

**Находки:** [AND-002](AUDIT_REPORT_RU.md#and-002), [AND-009](AUDIT_REPORT_RU.md#and-009), [AND-012](AUDIT_REPORT_RU.md#and-012), [AND-007](AUDIT_REPORT_RU.md#and-007), [AND-004](AUDIT_REPORT_RU.md#and-004), [AND-015](AUDIT_REPORT_RU.md#and-015).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-AND-03`.

## V2-AND-04

**Интеграция 20.10.2026:** Phase 6; AIS-EVID-002; release scope `ANDROID_DEFERRED`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-and-04).

**Проверяемые фото до/после и устойчивая очередь загрузки**

**P1 · ANDROID · CURRENT_MINIMUM · PROPOSED / NOT_RUN**

**Результат:** GetContent result сначала копировать в app-private owner directory с устойчивым localMediaId/hash; отмена picker — спокойный return, permission/read failure — отдельное retryable состояние.

**Предлагаемый владелец:** Android owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** L; highest-risk implementation, incremental durable steps. **Порядок DAG:** 24.

**Роли:** Worker.

**Экраны / семейства:** Report; Resubmit; Home upload status.

**Основные действия:** Добавить фото до; Добавить фото после; Просмотреть; Заменить локальное фото; Повторить загрузку; Добавить фото исправления.

**Обязательные зависимости:** [V2-AND-03](#v2-and-03), [V2-CON-01](#v2-con-01), [V2-CON-03](#v2-con-03)

**Шаги реализации:**

1. GetContent result сначала копировать в app-private owner directory с устойчивым localMediaId/hash; отмена picker — спокойный return, permission/read failure — отдельное retryable состояние.
2. ImageProcessor вне Main: bounds/sample decode, EXIF orientation, bounded target dimensions/bytes, cancellation; сохранить нынешний 2048/JPEG85 baseline до измерений, не ухудшая evidence quality.
3. Показать thumbnails и before/after slots, preview и отдельную retry action для failed photo. Local replacement создаёт новую revision и отменяет неподтверждённую старую, без мнимого server DELETE.
4. Добавить OutboxOperation и worker runner (предлагается WorkManager) на уровнях create-session→upload-object→finalize→link. Persist stable idempotency key per step + uploadSessionId/objectPath/contentHash до отправки/перехода.
5. Submit зависит от durable confirmed link всех требуемых текущей policy proof; network accepted/pending различимы. Никакого «Отправлено» только от local enqueue.
6. Unknown timeout outcome reconciles same operation/session; не создавать новую session слепо. Storage duplicate object conflict требует проверить identity/hash/доступный receipt, не считать arbitrary409 успехом.
7. Существующий before/after rule сохраняется для initial report. Correction добавляет к исходному report; старые linked attachments сохраняются как evidence.
8. Foreground/background runner single-flight per owner/draft, respects session generation; cancel/retry/backoff/low storage в UI.
9. Проверить окно/атомарность backend idempotency: сейчас TTL24h и receipt после mutation. Stable key не считать exactly-once. При unknown result вне доказанного replay window — NeedsReconciliation; для автоматического восстановления согласовать durable operation receipt/business uniqueness.

**API и контракты:**

- POST /api/v1/media/upload-sessions
- Supabase Storage object upload media/<tenant>/<session>
- POST /api/v1/media/upload-sessions/:id/finalize
- POST /api/v1/worker/report/add-media
- GET /api/v1/reports/:id
- GET /api/v1/sync/bootstrap (limited upload status snapshot)

**Состояния, которые нужно сохранить или реализовать:**

- Picking
- LocalReady
- Preparing
- WaitingNetwork
- CreatingSession
- Uploading
- Finalizing
- Linking
- Attached
- RetryableFailure
- PermanentFailure
- Cancelled
- NeedsAuthentication
- Conflict

**Исходные platform contract references:**

- ANDROID-MEDIA-IDENTITY
- ANDROID-OPERATION-RECEIPT

Сопоставить с общим ownership CON/ARCH из раздела 3; не создавать параллельный серверный контракт.

**Критерии приёмки — ещё не проверены:**

- **V2-AND-04-AC-01 · NOT_RUN:** AC01 На экране видно реальные выбранные before/after thumbnails; picker cancel не очищает прежнее фото и не показывает false failure.
- **V2-AND-04-AC-02 · NOT_RUN:** AC02 Большая/повёрнутая/повреждённая фотография: processing offMain, правильная orientation или понятная ошибка; профиль памяти/frames приложен на выбранном low-memory устройстве.
- **V2-AND-04-AC-03 · NOT_RUN:** AC03 Crash/relaunch на каждом шаге восстанавливает ту же session/key; ambiguous timeout не создаёт второй logical attachment.
- **V2-AND-04-AC-04 · NOT_RUN:** AC04 User A/logout/B + background callback не загружает/не показывает файлы A от B. Local owner directory не читается из чужой session.
- **V2-AND-04-AC-05 · NOT_RUN:** AC05 До link-confirmed нет зелёного attached; до submit server success нет «Отправлено». Queued/offline состояние имеет счётчик операций и retry.
- **V2-AND-04-AC-06 · NOT_RUN:** AC06 Замена до link даёт новую revision; поздний upload старого фото не возвращает его в текущий slot. Linked original сохраняется и correction добавляется явно.
- **V2-AND-04-AC-07 · NOT_RUN:** AC07 Initial report требует оба proof slots при PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO=false; ошибки не предлагают пользователю включить flag.
- **V2-AND-04-AC-08 · NOT_RUN:** AC08 401/403/storage full/read denied/retry exhausted не удаляют исходное локальное фото; retry доступен только для валидных этапов.
- **V2-AND-04-AC-09 · NOT_RUN:** AC09 Pause/back/process restart не блокируют редактирование note; submit блокируется по зависимостям операций, не по общему бессрочному busy.
- **V2-AND-04-AC-10 · NOT_RUN:** AC10 Нет придуманного DELETE /report/media или GET upload-session/:id: recovery использует реальные receipt/response/contracts, недостающий контракт фиксируется как зависимость.
- **V2-AND-04-AC-11 · NOT_RUN:** AC-RECEIPT Concurrent same intent, crash между business write и receipt, replay спустя 24h и тот же key с иным payload не создают второй business effect. При недоступной гарантии UI остаётся NeedsReconciliation и не делает blind resend.

**Будущие проверки — NOT_RUN:**

- **V2-AND-04-TEST-01 · NOT_RUN:** Image orientation/bounds/corrupt stream with small synthetic fixtures; photo revision/cancel logic.
- **V2-AND-04-TEST-02 · NOT_RUN:** Fault injection на границе каждого durable step, same keys, outbox DAG dependencies, scheduler concurrency.
- **V2-AND-04-TEST-03 · NOT_RUN:** create/finalize/add-media replies + storage denied/duplicate/timeout receipts; ownership and association count.
- **V2-AND-04-TEST-04 · NOT_RUN:** Airplane mode, background/kill, repeated submit, picker denial/cancel, large photo profile; capture actual report/media counts.
- **V2-AND-04-TEST-05 · NOT_RUN:** Same-key concurrency, missing cache/admin, mutation-before-receipt crash, expiry24h, payload-hash mismatch; isolated test rows, no production mutations.

**Предлагаемое деление PR:**

- Private file/image processing + slots
- Outbox step journal + worker
- UI retry/reconciliation + device evidence

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `android/shared/src/main/java/ai/aistroyka/shared/media/LocalMediaStore.kt`
- `android/shared/src/main/java/ai/aistroyka/shared/media/ImageProcessor.kt`
- `android/shared/src/main/java/ai/aistroyka/shared/outbox/OutboxOperation.kt`
- `android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/upload/UploadWorker.kt`

**Проверенные исходные точки:**

- [android/shared/build.gradle.kts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/build.gradle.kts#L1)
- [android/AiStroykaWorker/build.gradle.kts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/build.gradle.kts#L1)
- [android/shared/src/main/java/ai/aistroyka/shared/WorkerApi.kt:103](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/WorkerApi.kt#L103)
- [android/shared/src/main/java/ai/aistroyka/shared/DeviceContext.kt:31](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/DeviceContext.kt#L31)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerViewModel.kt:29](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerViewModel.kt#L29)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerApp.kt:314](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerApp.kt#L314)
- [android/AiStroykaWorker/src/main/AndroidManifest.xml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/AndroidManifest.xml#L1)

**Условия остановки зависимого среза:**



**Условие выпуска:** Два фото → submit и kill/retry на каждом шаге без потери/логического дубликата; privacy/owner fence PASS. Direct camera capture — отдельная later parity, если владелец явно расширит scope. Автоматический retry unknown outcome не готов до operation-receipt/dedup gate; stable UUID alone is insufficient.

**Rollback:** Остановить execution новых операций, сохранить outbox journal и локальные файлы; обеспечить совместимое чтение схемы, не включать old volatile pipeline для pending drafts.

**Находки:** [AND-012](AUDIT_REPORT_RU.md#and-012), [AND-021](AUDIT_REPORT_RU.md#and-021), [AND-002](AUDIT_REPORT_RU.md#and-002), [AND-005](AUDIT_REPORT_RU.md#and-005), [AND-004](AUDIT_REPORT_RU.md#and-004), [AND-018](AUDIT_REPORT_RU.md#and-018).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-AND-04`.

## V2-AND-05

**Интеграция 20.10.2026:** Phase 13; AIS-EVID-002; release scope `ANDROID_DEFERRED`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-and-05).

**Worker sync: применить данные, затем подтвердить cursor**

**P1 · ANDROID · CURRENT_MINIMUM_WORKER_ONLY · PROPOSED / NOT_RUN**

**Результат:** Вынести WorkerSyncRepository; DAO transaction применяет snapshot/delta и local appliedCursor одним commit. ACK только после commit; acknowledgedCursor хранится отдельно.

**Предлагаемый владелец:** Android owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** L; model/apply/recovery should be separate reviewable commits. **Порядок DAG:** 25.

**Роли:** Worker.

**Экраны / семейства:** Home; History; Report recovery.

**Основные действия:** Обновить данные; Повторить синхронизацию; Восстановить после конфликта.

**Обязательные зависимости:** [V2-AND-02](#v2-and-02), [V2-AND-03](#v2-and-03), [V2-ARCH-04](#v2-arch-04)

**Шаги реализации:**

1. Вынести WorkerSyncRepository; DAO transaction применяет snapshot/delta и local appliedCursor одним commit. ACK только после commit; acknowledgedCursor хранится отдельно.
2. DTO привести к фактическому contract: snapshot task/title/status/project; change id/payload, next_cursor. Cursor выбрать тип без ненужного Int truncation по фактической server sequence.
3. Changes — invalidations/partial payload, не полные rows: для разрешённых ресурсов получить canonical details или mark stale; не считать частичный payload полным объектом. Validate caller scope before materializing local data.
4. Bootstrap user-scoped и bounded100; cache помечен coverage recent/current, не обещать all-time archive. Bootstrap не удаляет owner local drafts/outbox.
5. Shared typed SyncConflictResult для changes и ACK, включая must_bootstrap/hint/server_cursor; aliases не ломать. Bootstrap recovery ограничить attempts/backoff, expose Retry.
6. Single-flight mutex/job per owner; refresh/sync button coalesce; automatic retries только по валидной session/network policy.
7. Logout/new tenant делает другой cursor namespace. Upgrade legacy cursor требует fresh bootstrap, не перенос старого unscoped position.
8. Manager остаётся на ManagerApi REST; никакого reuse WorkerSyncRepository в Manager Home/inbox.

**API и контракты:**

- GET /api/v1/sync/bootstrap
- GET /api/v1/sync/changes?cursor=&limit=
- POST /api/v1/sync/ack
- GET /api/v1/tasks/:id
- GET /api/v1/reports/:id

**Состояния, которые нужно сохранить или реализовать:**

- NotLoaded
- CachedStale
- Bootstrapping
- Applying
- Acknowledging
- UpToDate
- WaitingNetwork
- NeedsBootstrap
- NeedsAuthentication
- RetryableFailure
- UnsupportedChange

**Критерии приёмки — ещё не проверены:**

- **V2-AND-05-AC-01 · NOT_RUN:** AC01 Bootstrap tasks/reports/uploads доступны из local store offline; cursor обновлён вместе с успешным apply.
- **V2-AND-05-AC-02 · NOT_RUN:** AC02 Crash до commit → ACK не отправлен; crash после commit до ACK → повтор не теряет/не дублирует data, ACK восстанавливается.
- **V2-AND-05-AC-03 · NOT_RUN:** AC03 GET409 и ACK409 выполняют один одинаковый bounded recovery; повторяющийся conflict не создаёт hot loop.
- **V2-AND-05-AC-04 · NOT_RUN:** AC04 Rapid Sync/Refresh/re-entry создаёт один sync runner; состояние/кнопка отражают running.
- **V2-AND-05-AC-05 · NOT_RUN:** AC05 Partial/unknown resource change не создаёт фиктивно полный row; transient detail403/404 приводит к безопасной invalidation/reconciliation без чужих данных.
- **V2-AND-05-AC-06 · NOT_RUN:** AC06 Recent snapshot не объявляется полной историей; отсутствие draft в bounded response не удаляет локальный pending draft.
- **V2-AND-05-AC-07 · NOT_RUN:** AC07 A→B и tenant switch не используют старые cursor/data; deleted/revoked membership очищает доступный cache по scope policy.
- **V2-AND-05-AC-08 · NOT_RUN:** AC08 Manager module не импортирует WorkerSyncRepository и не делает /sync/* requests.
- **V2-AND-05-AC-09 · NOT_RUN:** AC09 Слово «Обновлено» относится к подтверждённо применённым данным, а не лишь к сохранённому cursor.

**Будущие проверки — NOT_RUN:**

- **V2-AND-05-TEST-01 · NOT_RUN:** Delta apply/replay/delete/unknown payload; cursor transaction and 64-bit boundary if server type requires.
- **V2-AND-05-TEST-02 · NOT_RUN:** DB failure before apply/after apply/ACK loss;409 variants; repeated bootstrap backoff and cancellation.
- **V2-AND-05-TEST-03 · NOT_RUN:** Actual canonical sync fixtures include id,payload,next_cursor and aliases; own-scoped hydration.
- **V2-AND-05-TEST-04 · NOT_RUN:** Offline cached tasks, kill during sync, rapid refresh, expired session; API trace confirms Manager REST only.

**Предлагаемое деление PR:**

- DTO + local apply transaction
- Conflict/single-flight orchestration
- Offline display and device trace

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `android/shared/src/main/java/ai/aistroyka/shared/sync/WorkerSyncRepository.kt`
- `android/shared/src/main/java/ai/aistroyka/shared/sync/SyncCursorState.kt`

**Проверенные исходные точки:**

- [android/shared/src/main/java/ai/aistroyka/shared/WorkerApi.kt:178](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/WorkerApi.kt#L178)
- [android/shared/src/main/java/ai/aistroyka/shared/WorkerDtos.kt:105](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/WorkerDtos.kt#L105)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerViewModel.kt:62](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerViewModel.kt#L62)
- [packages/contracts/src/schemas/sync.schema.ts:3](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/packages/contracts/src/schemas/sync.schema.ts#L3)
- [apps/web/lib/sync/sync-conflict.ts:3](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/sync/sync-conflict.ts#L3)
- [apps/web/app/api/v1/sync/changes/route.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/sync/changes/route.ts#L1)
- [apps/web/app/api/v1/sync/ack/route.ts:65](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/sync/ack/route.ts#L65)

**Условия остановки зависимого среза:**



**Условие выпуска:** Apply-before-ACK invariant + crash/replay +409 matrix PASS; нельзя закрывать ticket только исчезновением error banner.

**Rollback:** Остановить ACK при regression, сохранить last applied transaction; no destructive rebootstrap of local drafts.

**Находки:** [AND-004](AUDIT_REPORT_RU.md#and-004), [AND-008](AUDIT_REPORT_RU.md#and-008).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-AND-05`.

## V2-AND-06

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001; release scope `ANDROID_DEFERRED`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-and-06).

**Смена с подтверждённым серверным результатом и датой**

**P1 · ANDROID · CURRENT_MINIMUM · PROPOSED / NOT_RUN**

**Результат:** ShiftRepository хранит owner/dayId/serverDayDate/status/intent и stable start/end keys. UI показывает state вместо nullable shiftDayId.

**Предлагаемый владелец:** Android owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M; coordinated additive backend dependency. **Порядок DAG:** 26.

**Роли:** Worker.

**Экраны / семейства:** Home shift card; Report prerequisites.

**Основные действия:** Начать смену; Завершить смену; Повторить; Сверить состояние.

**Обязательные зависимости:** [V2-AND-02](#v2-and-02), [V2-AND-03](#v2-and-03), [V2-CON-01](#v2-con-01), [V2-ARCH-04](#v2-arch-04)

**Шаги реализации:**

1. ShiftRepository хранит owner/dayId/serverDayDate/status/intent и stable start/end keys. UI показывает state вместо nullable shiftDayId.
2. Убрать clear из unconditional finally; end success только по accepted server response/reconciliation. Ошибки сохраняют Active или EndPending и действие Retry.
3. Start без server day UUID считается contract error/unknown, YYYYMMDD не выдаётся за id.
4. Согласовать current_day в existing Worker bootstrap; foreground/login/restart и смена server date сверяют текущую смену.
5. Адресный optional day_id для existing end contract предотвращает replay вчерашнего intent как сегодняшнего. До внедрения запрещён автоматический cross-date retry.
6. Повторный end/start не создаёт новую смену из-за нового key; user intent уникален для owner/date/day.
7. Нельзя «исправлять» stale day вызовом startDay как read: это существующая mutation.

**API и контракты:**

- POST /api/v1/worker/day/start
- POST /api/v1/worker/day/end
- GET /api/v1/sync/bootstrap proposed additive current_day

**Состояния, которые нужно сохранить или реализовать:**

- Unknown
- NotStarted
- StartPending
- Active
- EndPending
- Ended
- NeedsReconciliation
- Offline
- Forbidden

**Исходные platform contract references:**

- ANDROID-SHIFT-IDENTITY

Сопоставить с общим ownership CON/ARCH из раздела 3; не создавать параллельный серверный контракт.

**Критерии приёмки — ещё не проверены:**

- **V2-AND-06-AC-01 · NOT_RUN:** AC01 Server403/500/offline при end не показывает «Смена завершена» и не удаляет активный dayId.
- **V2-AND-06-AC-02 · NOT_RUN:** AC02 Kill после server acceptance до response восстанавливает то же действие/день и не создаёт новую смену.
- **V2-AND-06-AC-03 · NOT_RUN:** AC03 Midnight UTC, другое device timezone и возвращение на следующий день показывают корректную дату; вчерашний end не адресует сегодняшний day.
- **V2-AND-06-AC-04 · NOT_RUN:** AC04 Start response без id не разрешает report creation с fake day identity; ясно предлагается retry/reconcile.
- **V2-AND-06-AC-05 · NOT_RUN:** AC05 Stable keys повторяются для одного intent, новый намеренный start/date получает другой key по согласованной policy.
- **V2-AND-06-AC-06 · NOT_RUN:** AC06 Owner/tenant scoping проверен для current_day и адресного end; чужой dayId отказан сервером.
- **V2-AND-06-AC-07 · NOT_RUN:** AC07 Пока current_day/body extension недоступны, UI honest Unknown/NeedsReconciliation, release gate помечен BLOCKED, не silent fallback.

**Будущие проверки — NOT_RUN:**

- **V2-AND-06-TEST-01 · NOT_RUN:** Clock/day transitions, active/endpending/failure, persisted state restoration.
- **V2-AND-06-TEST-02 · NOT_RUN:** Old empty body compatibility + new day_id scoping + bootstrap current_day/null.
- **V2-AND-06-TEST-03 · NOT_RUN:** Lost end response/replay/cross-midnight; idempotent result.
- **V2-AND-06-TEST-04 · NOT_RUN:** Start→report→offline end→reconnect; restart following day.

**Предлагаемое деление PR:**

- Contract fixtures/current_day/end targeting
- Native state machine and device proof

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `android/shared/src/main/java/ai/aistroyka/shared/shift/ShiftRepository.kt`

**Проверенные исходные точки:**

- [android/shared/src/main/java/ai/aistroyka/shared/WorkerApi.kt:64](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/WorkerApi.kt#L64)
- [android/shared/src/main/java/ai/aistroyka/shared/WorkerDtos.kt:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/WorkerDtos.kt#L1)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerViewModel.kt:65](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerViewModel.kt#L65)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerApp.kt:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerApp.kt#L1)
- [packages/contracts/src/schemas/worker.schema.ts:41](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/packages/contracts/src/schemas/worker.schema.ts#L41)
- [packages/contracts/src/schemas/sync.schema.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/packages/contracts/src/schemas/sync.schema.ts#L1)
- [apps/web/lib/domain/worker-day/worker-day.service.ts:7](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/worker-day/worker-day.service.ts#L7)
- [apps/web/lib/domain/worker-day/worker-day.repository.ts:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/worker-day/worker-day.repository.ts#L18)
- [apps/web/app/api/v1/worker/day/end/route.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/worker/day/end/route.ts#L1)
- [apps/web/lib/sync/sync.service.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/sync/sync.service.ts#L1)

**Условия остановки зависимого среза:**



**Условие выпуска:** Truthful end state и cross-date reconciliation доказаны на synthetic tenant. End network success не заменяет проверку правильного day row.

**Rollback:** Отключить cross-date automatic retry; сохранить pending intent для reconciliation. Не возвращать finally-clear поведение.

**Находки:** [AND-007](AUDIT_REPORT_RU.md#and-007), [AND-009](AUDIT_REPORT_RU.md#and-009).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-AND-06`.

## V2-AND-07

**Интеграция 20.10.2026:** Phase 6; AIS-EVID-002; release scope `ANDROID_DEFERRED`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-and-07).

**История решений и полный повторный отчёт с новым evidence**

**P1 · ANDROID · CURRENT_MINIMUM · PROPOSED / NOT_RUN**

**Результат:** Все feedback rows маршрутизировать к own report detail; approved/rejected read-only, changes_requested → editor. Не оставлять визуально интерактивные no-op rows.

**Предлагаемый владелец:** Android owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M after durable report/media. **Порядок DAG:** 27.

**Роли:** Worker.

**Экраны / семейства:** Home feedback; Read-only Report Detail; Resubmit.

**Основные действия:** Открыть решение; Посмотреть фото; Прочитать комментарий руководителя; Добавить исправление; Отправить снова.

**Обязательные зависимости:** [V2-AND-03](#v2-and-03), [V2-AND-04](#v2-and-04), [V2-CON-01](#v2-con-01), [V2-CON-03](#v2-con-03)

**Шаги реализации:**

1. Все feedback rows маршрутизировать к own report detail; approved/rejected read-only, changes_requested → editor. Не оставлять визуально интерактивные no-op rows.
2. Переиспользовать GET reports/:id и WorkerReportDetailData media.fileUrl/managerNote/workerNote. История содержит статус, доступные timestamps и обе заметки; не обещать audit history, которой current DTO не содержит.
3. Resubmit использует тот же ReportRepository/media outbox с существующим serverReportId и mode=Correction; отдельный activeReportId hack устранить.
4. Разрешить preview старых фото и append correction. Note-only correction допустима, если достаточно существующего proof; если требуется новое evidence, пользователь может его приложить.
5. После submit обновить status/feedback локально и reconcile server. Approved/rejected не редактируются, stale changes_requested после чужого review превращается в readonly с сохранённым unsent note.
6. Не пытаться через limited worker/sync50 обещать бесконечный архив: label recent history; полный архив later либо отдельный контракт.

**API и контракты:**

- GET /api/v1/worker/sync (recent50)
- GET /api/v1/reports/:id
- POST /api/v1/worker/report/add-media
- POST /api/v1/worker/report/submit

**Состояния, которые нужно сохранить или реализовать:**

- Loading
- ReadyReadonly
- ReadyCorrection
- EmptyEvidence
- UploadingCorrection
- SubmissionPending
- Submitted
- NotFound
- Forbidden
- OfflineCached
- RetryableError

**Критерии приёмки — ещё не проверены:**

- **V2-AND-07-AC-01 · NOT_RUN:** AC01 approved и rejected tap открывает реальный readonly detail с manager note; changes_requested открывает correction CTA.
- **V2-AND-07-AC-02 · NOT_RUN:** AC02 Original media preview и worker note доступны при корректном file_url; URL renewal/retry при expiry без изменения media identity.
- **V2-AND-07-AC-03 · NOT_RUN:** AC03 New correction photo прикрепляется к исходному reportId, старые attachments сохраняются; note+evidence видны Manager после resubmit.
- **V2-AND-07-AC-04 · NOT_RUN:** AC04 Note-only valid correction не блокируется искусственным требованием всегда нового фото; отсутствие любого proof даёт ясное validation.
- **V2-AND-07-AC-05 · NOT_RUN:** AC05 401/403/404/500/offline на detail видны в этом экране; null data не оставляет бесконечное «Загрузка». Retry/Back доступны.
- **V2-AND-07-AC-06 · NOT_RUN:** AC06 Kill/Back во время correction не теряет note/local photos; rapid submit не создаёт duplicate action.
- **V2-AND-07-AC-07 · NOT_RUN:** AC07 Status changed elsewhere → reconcile readonly/conflict, не false success и не уничтожение unsent correction.
- **V2-AND-07-AC-08 · NOT_RUN:** AC08 Recent feed limit не выдаётся за полную историю; old owned report по valid deep link всё равно читается через detail.

**Будущие проверки — NOT_RUN:**

- **V2-AND-07-TEST-01 · NOT_RUN:** Status→route/CTA mapping including unknown status; correction owner/revision.
- **V2-AND-07-TEST-02 · NOT_RUN:** Existing media with file_url, empty evidence, manager note,413/403/status race.
- **V2-AND-07-TEST-03 · NOT_RUN:** Manager changes_requested→Worker note+newphoto→Manager sees it→approve→Worker readonly history.

**Предлагаемое деление PR:**

- Readonly detail/history routing
- Correction editor/outbox integration and round trip

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerReportDetail.kt`

**Проверенные исходные точки:**

- [android/shared/src/main/java/ai/aistroyka/shared/WorkerApi.kt:165](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/WorkerApi.kt#L165)
- [android/shared/src/main/java/ai/aistroyka/shared/WorkerDtos.kt:76](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/WorkerDtos.kt#L76)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerViewModel.kt:250](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerViewModel.kt#L250)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerApp.kt:373](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerApp.kt#L373)
- [apps/web/lib/domain/reports/report.service.ts:54](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/reports/report.service.ts#L54)

**Условия остановки зависимого среза:**



**Условие выпуска:** Полный inter-role correction round trip с одним исходным reportId и доказанными фото/notes/status; no-op row regression test.

**Rollback:** Fallback read-only history остаётся; при отключении correction execution сохранять локальные drafts/attachments.

**Находки:** [AND-005](AUDIT_REPORT_RU.md#and-005), [AND-010](AUDIT_REPORT_RU.md#and-010), [AND-013](AUDIT_REPORT_RU.md#and-013).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-AND-07`.

## V2-IOS-04

**Интеграция 20.10.2026:** Phase 6; AIS-EVID-002; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-04).

**Заменить строительные значения по умолчанию на требования конкретной задачи**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Зафиксировать действительный план, выполненный объём и проверенные условия

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** L. **Порядок DAG:** 28.

**Роли:** Worker; Manager.

**Экраны / семейства:** TaskDetailV43; WorkInProgress; ShiftStartSafety; Report summary.

**Основные действия:** Зафиксировать действительный план, выполненный объём и проверенные условия.

**Ввод и предпосылки:** taskId/projectId; task requirements/template revision; quantity unit; actual input с provenance; location authorization и фактический sample.

**Обязательные зависимости:** [V2-IOS-01](#v2-ios-01), [V2-ARCH-04](#v2-arch-04)

**Шаги реализации:**

1. Задать typed TaskRequirements: checklist, required evidence, quantity/unit и источник плана; согласовать с действующим task contract.
2. Убрать live default48 и fallback measurement26; unknown хранить отдельно от фактического нуля.
3. Рендерить checklist по типу задачи; не устанавливать шаг приёмки материалов из факта сохранения фотографии.
4. Показывать «на объекте» только по определённому location/shift contract; denied/нет фиксации не становится положительным фактом.

**API и контракты:**

- WorkerAPI.tasksToday / WorkerAPI.task существующие DTO
- POST /api/v1/worker/report/submit actual_volume/planned_volume
- Manager task create/patch: проверить существующие requirements поля до additive изменения

**Состояния, которые нужно сохранить или реализовать:**

- requirementsLoading
- requirementsUnknown
- notRequired
- requiredMissing
- actualEntered
- locationDenied
- locationUnavailable
- readyForReview

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-04-AC-01 · NOT_RUN:** Given задача без quantity, Then submit не отправляет план48 и UI показывает отсутствие плана.
- **V2-IOS-04-AC-02 · NOT_RUN:** Given электромонтаж вместо армирования, Then нет чужих пяти rebar шагов.
- **V2-IOS-04-AC-03 · NOT_RUN:** Given measurement отсутствует, Then нет26 мм и «В норме».
- **V2-IOS-04-AC-04 · NOT_RUN:** Given actual=0 введён осознанно, Then он отличим от unknown и имеет верную unit.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-04-TEST-01 · NOT_RUN:** Production mapping fixture: разные task types, no requirements, null/zero/negative/decimal quantity.
- **V2-IOS-04-TEST-02 · NOT_RUN:** Wire fixture Swift↔TS: значения и nullable semantics в submit.
- **V2-IOS-04-TEST-03 · NOT_RUN:** UI проверка трёх task templates и denied location.

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `ios/AiStroykaWorker/AiStroykaWorker/Services/TaskRequirements.swift`

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43Models.swift:577](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43Models.swift#L577)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/TaskDetailV43View.swift:69](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/TaskDetailV43View.swift#L69)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/WorkInProgressView.swift:112](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/WorkInProgressView.swift#L112)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/ShiftStartSafetyView.swift:49](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/ShiftStartSafetyView.swift#L49)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/ReportCreateView.swift:376](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/ReportCreateView.swift#L376)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift:145](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift#L145)
- [ios/AiStroykaManager/AiStroykaManager/Views/TasksListView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/TasksListView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift#L1)

**Условия остановки зависимого среза:**

- Нет authority для checklist/плана — показывать unknown; не генерировать строительные нормы из UI.
- Не менять старые submitted отчёты автоматической перезаписью; correction/audit по отдельной политике.

**Условие выпуска:** G3; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-02](AUDIT_REPORT_RU.md#ios-02).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-04`.

## V2-IOS-05

**Интеграция 20.10.2026:** Phase 6; AIS-EVID-002; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-05).

**Сделать один ReportDraft для Form, Review и Submit**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Сохранить, проверить и отправить один и тот же отчёт

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** L. **Порядок DAG:** 29.

**Роли:** Worker.

**Экраны / семейства:** ReportCreate; DailyReportForm; ReportReviewSubmit; CameraContextSheet.

**Основные действия:** Сохранить, проверить и отправить один и тот же отчёт.

**Ввод и предпосылки:** draftId; owner scope; projectId/taskId/dayId; worker note; photo slot references; server reportId; draft revision.

**Обязательные зависимости:** [V2-IOS-02](#v2-ios-02), [V2-IOS-04](#v2-ios-04), [V2-CON-01](#v2-con-01), [V2-ARCH-04](#v2-arch-04)

**Шаги реализации:**

1. Ввести один draft aggregate/repository с revision и локально сохранённой заметкой; сначала durable write, затем network command.
2. Передавать draftId через Form/Review/camera; подписывать один view model вместо двух независимых ReportCreateView.
3. Заменить глобальное notification submit без identity на typed draft command; повтор submit использует тот же intent.
4. Описать свободный report без task отдельно: разрешённый project context либо объяснение ограничения до ввода.

**API и контракты:**

- WorkerAPI.createReport
- POST /api/v1/worker/report/add-media
- POST /api/v1/worker/report/submit

**Состояния, которые нужно сохранить или реализовать:**

- editing
- savedLocally
- preparingMedia
- readyForReview
- queued
- sending
- blocked
- submitted
- changesRequested

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-05-AC-01 · NOT_RUN:** Given два task drafts, When пользователь переключается между ними, Then заметки/фото не смешиваются.
- **V2-IOS-05-AC-02 · NOT_RUN:** Given Back из Review или process restart, Then открывается тот же draft/revision с тем же server ID.
- **V2-IOS-05-AC-03 · NOT_RUN:** Given повторное нажатие Send, Then не создаётся второй logical report.
- **V2-IOS-05-AC-04 · NOT_RUN:** Given сервер подтвердил submit, Then UI показывает submitted для того же report и не держит вечное queued.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-05-TEST-01 · NOT_RUN:** Repository round-trip/process-restoration fixture с двумя drafts и partial media.
- **V2-IOS-05-TEST-02 · NOT_RUN:** Integration fake transport: create success + timeout до получения ответа, readback/retry по idempotency.
- **V2-IOS-05-TEST-03 · NOT_RUN:** Device Form→Review→Back→Send, kill до/после local save и server acknowledgement.

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `ios/AiStroykaWorker/AiStroykaWorker/Persistence/ReportDraft.swift`
- `ios/AiStroykaWorker/AiStroykaWorker/Persistence/ReportDraftRepository.swift`

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/Views/ReportCreateView.swift:376](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/ReportCreateView.swift#L376)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/DailyReportFormView.swift:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/DailyReportFormView.swift#L27)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/WorkerTabShell.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/WorkerTabShell.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Persistence/AppStateStore.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Persistence/AppStateStore.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Persistence/Operation.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Persistence/Operation.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43Models.swift:577](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43Models.swift#L577)

**Условия остановки зависимого среза:**

- Не удалять legacy draft до успешной миграции и восстановления его media references.
- Не считать сохранением в JSON запись, ошибка которой проглочена; пользователь должен знать, если durable save не выполнен.

**Условие выпуска:** G1; G2; G3; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-04](AUDIT_REPORT_RU.md#ios-04), [IOS-02](AUDIT_REPORT_RU.md#ios-02).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-05`.

## V2-IOS-06

**Интеграция 20.10.2026:** Phase 6; AIS-EVID-002; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-06).

**Связать preview с media revision и вынести binary из JSON**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Заменить фото и отправить именно отображаемую версию

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** L. **Порядок DAG:** 30.

**Роли:** Worker.

**Экраны / семейства:** CameraEvidence; Before/After picker; ReportCreate; Upload progress.

**Основные действия:** Заменить фото и отправить именно отображаемую версию.

**Ввод и предпосылки:** draftId/slotId/mediaRevision; private local file URL; checksum/mime/bytes; upload session ID; replacement policy.

**Обязательные зависимости:** [V2-IOS-05](#v2-ios-05), [V2-CON-01](#v2-con-01), [V2-CON-03](#v2-con-03)

**Шаги реализации:**

1. Сохранить camera/library bytes в закрытый файл до preview success; queue хранит ссылку и checksum, не base64 history.
2. При замене создать новую slot revision, отменить/пометить superseded старую цепочку; callback старой версии не перезаписывает новую.
3. Hydration ищет media по owner+draft+slot, а не последнее purpose по всему store.
4. Добавить retention завершённых операций и orphan cleanup после доказанного server linkage; сохранить существующее удаление временных .bin.

**API и контракты:**

- WorkerAPI.createUploadSession/finalizeUploadSession/addMedia
- Existing uploadBinary background session; не менять storage authority

**Состояния, которые нужно сохранить или реализовать:**

- selected
- saved
- uploading
- replaced
- superseded
- uploaded
- attached
- retryableError
- storageFull

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-06-AC-01 · NOT_RUN:** Given A выбран и загружается, When заменён B, Then Form/Review/Manager показывают B; callback A не возвращает старый preview.
- **V2-IOS-06-AC-02 · NOT_RUN:** Given A уже attached, When разрешена замена B, Then серверный контракт явно supersedes/заменяет A либо UI объясняет ограничение до замены.
- **V2-IOS-06-AC-03 · NOT_RUN:** Given insufficient storage, Then нет ложного saved/queued и исходный выбор не уничтожен.
- **V2-IOS-06-AC-04 · NOT_RUN:** Given завершённые100operations в fixture, Then pruning не удаляет pending dependency и binary history ограничена принятой retention policy.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-06-TEST-01 · NOT_RUN:** Production media-slot state tests с reorder callbacks и checksums.
- **V2-IOS-06-TEST-02 · NOT_RUN:** Disk fixture: crash между write/rename/metadata commit; verify one recoverable file.
- **V2-IOS-06-TEST-03 · NOT_RUN:** Device JPEG/HEIC/large image replacement до, во время и после upload; без произвольных новых quality thresholds.

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `ios/AiStroykaWorker/AiStroykaWorker/Persistence/DraftMediaStore.swift`

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/Views/ReportCreateView.swift:127](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/ReportCreateView.swift#L127)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/CameraEvidenceView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/CameraEvidenceView.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43Models.swift:643](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43Models.swift#L643)
- [ios/AiStroykaWorker/AiStroykaWorker/Persistence/Operation.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Persistence/Operation.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Persistence/OperationQueueStore.swift:82](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Persistence/OperationQueueStore.swift#L82)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/BackgroundUploadService.swift:137](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/BackgroundUploadService.swift#L137)
- [ios/AiStroykaWorker/AiStroykaWorker/Persistence/AppStateStore.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Persistence/AppStateStore.swift#L1)

**Условия остановки зависимого среза:**

- Если API не умеет безопасно replace attached media, сначала согласовать additive revision contract; не удалять серверный оригинал автоматически.
- Не переносить blob в публичный storage и не строить URL из клиентского projectId.

**Условие выпуска:** G1; G2; G3; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-04](AUDIT_REPORT_RU.md#ios-04), [IOS-14](AUDIT_REPORT_RU.md#ios-14).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-06`.

## V2-IOS-07

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001, AIS-EVID-002; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-07).

**Разделить конфликты, auth и retry в outbox**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Восстановить тот же intent после ошибки без бесконечного повтора

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** L. **Порядок DAG:** 31.

**Роли:** Worker.

**Экраны / семейства:** Queue status; Report send/retry; Diagnostics.

**Основные действия:** Восстановить тот же intent после ошибки без бесконечного повтора.

**Ввод и предпосылки:** operationId/idempotencyKey; attempt count; typed API error/status; server cursor/revision; dependency state.

**Обязательные зависимости:** [V2-IOS-02](#v2-ios-02), [V2-IOS-05](#v2-ios-05), [V2-IOS-06](#v2-ios-06), [V2-CON-01](#v2-con-01)

**Шаги реализации:**

1. Выделить typed conflict resolver; исполнитель приостанавливает затронутый intent до конкретной reconciliation, а не ставит флаг без consumer.
2. Failed submit Retry обновляет существующую operation с тем же logical identity; новая нажатая кнопка не игнорируется add duplicate guard.
3. Ограничить attempts/backoff с jitter и видимым next action; разрешить независимые операции, если их ordering/permissions это допускают.
4. Сохранить dependency ordering, idempotency и single-running-upload; добавить чтение результата после ambiguous timeout.

**API и контракты:**

- Существующие Worker writes + 401/403/409/429/5xx contract
- Worker sync conflict содержит cursor; не все409 требуют bootstrap

**Состояния, которые нужно сохранить или реализовать:**

- queued
- running
- waitingNetwork
- retryAt
- authRequired
- conflict
- permanentFailure
- succeeded
- canceledByReplacement

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-07-AC-01 · NOT_RUN:** Given persistent409, Then число запросов ограничено policy, conflict виден, hot loop отсутствует.
- **V2-IOS-07-AC-02 · NOT_RUN:** Given failed permanent после исправляемого условия, When Retry разрешён, Then intent действительно меняет состояние и повторяет правильный шаг.
- **V2-IOS-07-AC-03 · NOT_RUN:** Given 401, Then queue ждёт auth recovery без утраты draft; given403, Then не пытается обходить запрет.
- **V2-IOS-07-AC-04 · NOT_RUN:** Given server write success + timeout, Then retry не создаёт дубликат logical effect.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-07-TEST-01 · NOT_RUN:** Executor tests с fake clock/transport:409 variants,429 Retry-After,500,401,403; проверять настоящий executor.
- **V2-IOS-07-TEST-02 · NOT_RUN:** Dependency graph fixture с независимой и зависимой операцией после conflict.
- **V2-IOS-07-TEST-03 · NOT_RUN:** Device offline→online, pause→resume и interrupted background upload.

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/Services/OperationQueueExecutor.swift:37](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/OperationQueueExecutor.swift#L37)
- [ios/AiStroykaWorker/AiStroykaWorker/Persistence/OperationQueueStore.swift:61](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Persistence/OperationQueueStore.swift#L61)
- [ios/AiStroykaWorker/AiStroykaWorker/Persistence/Operation.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Persistence/Operation.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/ReportCreateView.swift:98](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/ReportCreateView.swift#L98)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/ProfileOfflineSettingsView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/ProfileOfflineSettingsView.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/SyncService.swift:65](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/SyncService.swift#L65)

**Условия остановки зависимого среза:**

- Не интерпретировать неизвестный409 как безопасный повтор; сохранить объяснимое blocked состояние.
- Не добавлять Manager в worker sync allow-list.

**Условие выпуска:** G1; G2; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-05](AUDIT_REPORT_RU.md#ios-05), [IOS-14](AUDIT_REPORT_RU.md#ios-14).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-07`.

## V2-IOS-08

**Интеграция 20.10.2026:** Phase 13; AIS-EVID-002, AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-08).

**Открывать Worker после cold start и применять snapshot до ACK**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Продолжить разрешённую сохранённую работу без сети

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** L. **Порядок DAG:** 32.

**Роли:** Worker.

**Экраны / семейства:** HomeContainer; ProjectPicker; Today/MyTasks; Sync status.

**Основные действия:** Продолжить разрешённую сохранённую работу без сети.

**Ввод и предпосылки:** scoped selected project summary; worker snapshot/delta; cursor; local transaction status; revocation/revalidation policy.

**Обязательные зависимости:** [V2-IOS-02](#v2-ios-02), [V2-IOS-07](#v2-ios-07), [V2-ARCH-04](#v2-arch-04)

**Шаги реализации:**

1. Сохранить минимальный owner-scoped project snapshot и открывать shell из него до сетевого обновления.
2. Определить Worker local read model для реально используемых snapshot entities; применить delta и cursor атомарно.
3. Отправлять ACK только после durable apply; corruption/interrupted apply требует replay/bootstrap, не ложный synced.
4. Показывать offline scope и свежесть; отсутствие cached project имеет отдельный recovery экран.

**API и контракты:**

- WorkerAPI.projects
- GET /api/v1/sync/bootstrap
- GET /api/v1/sync/changes
- POST /api/v1/sync/ack; actual route methods verify at implementation HEAD

**Состояния, которые нужно сохранить или реализовать:**

- cachedReady
- staleOffline
- bootstrapRequired
- applyingDelta
- synced
- permissionUnknown
- revoked
- noCachedProject

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-08-AC-01 · NOT_RUN:** Given ранее разрешённый проект и airplane mode после restart, Then доступен его сохранённый draft и локальные задачи.
- **V2-IOS-08-AC-02 · NOT_RUN:** Given delta transaction fails, Then cursor не продвигается и ACK не отправляется.
- **V2-IOS-08-AC-03 · NOT_RUN:** Given revoked membership обнаружено онлайн, Then последующие protected actions blocked и кэш обработан по scope policy.
- **V2-IOS-08-AC-04 · NOT_RUN:** Given новый пользователь без cache, Then нет чужого fallback project.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-08-TEST-01 · NOT_RUN:** Local store fixture: snapshot→delta→crash→replay и tombstone/revoke.
- **V2-IOS-08-TEST-02 · NOT_RUN:** Contract fixture sync payload с отсутствующими/новыми полями.
- **V2-IOS-08-TEST-03 · NOT_RUN:** Device cold start offline/limited network с одним и несколькими проектами.

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/Views/HomeContainerView.swift:22](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/HomeContainerView.swift#L22)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/ProjectPickerView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/ProjectPickerView.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/SyncService.swift:75](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/SyncService.swift#L75)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Persistence/AppStateStore.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Persistence/AppStateStore.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/TodayHomeView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/TodayHomeView.swift#L1)

**Условия остановки зависимого среза:**

- Нельзя объявлять offline право вечным: согласовать время revalidation и допустимые cached действия.
- Не превращать Worker snapshot в manager portfolio repository.

**Условие выпуска:** G1; G2; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-06](AUDIT_REPORT_RU.md#ios-06).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-08`.

## V2-IOS-09

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-09).

**Сделать «доступно офлайн» свойством файла и версии**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Открыть сохранённый документ или понять, почему он недоступен

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M. **Порядок DAG:** 33.

**Роли:** Worker.

**Экраны / семейства:** DocumentsDrawings; DocumentPreview; QuickLook.

**Основные действия:** Открыть сохранённый документ или понять, почему он недоступен.

**Ввод и предпосылки:** documentId/projectId/owner; authorized remote reference; version/checksum; local file state; available disk.

**Обязательные зависимости:** [V2-IOS-02](#v2-ios-02), [V2-IOS-08](#v2-ios-08)

**Шаги реализации:**

1. Ввести DocumentFileCache с manifest document/version/file; label/count берёт только существующие валидные файлы.
2. Проверять локальную версию до URLSession request и сохранить remote download вне temporary-only жизненного цикла.
3. Добавить явные download/remove local copy/retry состояния и storage limit; удаление только локальной копии не удаляет серверный документ.
4. При обновлении/revoke инвалидировать управляемый cache по policy; QuickLook закрывает утративший доступ контекст.

**API и контракты:**

- WorkerV43API.documents: GET worker/documents
- Existing document previewURL/private read contract; сохранить fileURL branch

**Состояния, которые нужно сохранить или реализовать:**

- metadataOnly
- downloading
- savedVersion
- staleVersion
- offlineUnavailable
- downloadFailed
- accessRevoked

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-09-AC-01 · NOT_RUN:** Given badge «доступно офлайн», When приложение перезапущено без сети, Then нужная сохранённая версия открывается.
- **V2-IOS-09-AC-02 · NOT_RUN:** Given только metadata, Then label не обещает наличие файла.
- **V2-IOS-09-AC-03 · NOT_RUN:** Given новый document revision, Then старая версия помечена и не выдается за актуальную.
- **V2-IOS-09-AC-04 · NOT_RUN:** Given remote request failure, Then сохранённая разрешённая версия не удалена.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-09-TEST-01 · NOT_RUN:** Cache manifest/file integrity unit tests, interrupted download и cleanup.
- **V2-IOS-09-TEST-02 · NOT_RUN:** UI fixture metadata-only/saved/stale/no-space.
- **V2-IOS-09-TEST-03 · NOT_RUN:** Device QuickLook cold restart, large PDF и возврат после denial.

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/Views/DocumentsDrawingsView.swift:94](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/DocumentsDrawingsView.swift#L94)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/DocumentPreviewView.swift:53](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/DocumentPreviewView.swift#L53)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43API.swift:121](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43API.swift#L121)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43Models.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43Models.swift#L1)

**Условия остановки зависимого среза:**

- Не гарантировать отзыв уже экспортированной внешней копии; scope — app cache и последующие reads.
- Не кэшировать raw signed URL как постоянную identity документа.

**Условие выпуска:** G1; G2; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-06](AUDIT_REPORT_RU.md#ios-06).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-09`.

## V2-IOS-10

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-10).

**Сначала показывать работу, затем вторичные счётчики**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Найти нужную задачу и открыть её без ожидания всех чатов

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M. **Порядок DAG:** 34.

**Роли:** Worker.

**Экраны / семейства:** TodayHome; MyTasks; Day strip / filters; Task detail entry.

**Основные действия:** Найти нужную задачу и открыть её без ожидания всех чатов.

**Ввод и предпосылки:** tasksToday/task scope; selected day/filter; cached owner; task status enum; pending taskId; request generation.

**Обязательные зависимости:** [V2-IOS-02](#v2-ios-02), [V2-IOS-08](#v2-ios-08)

**Шаги реализации:**

1. Публиковать tasks сразу после получения; счётчики чатов/feedback/help обновлять независимо с cancel/generation guard.
2. Нормализовать реальные backend statuses и добавить завершённую секцию; неизвестный status показывать явно.
3. Сохранять pending ID до успешного открывания/понятного отказа; использовать имеющийся loader by ID вместо lookup только в загруженной today странице.
4. Установить честный scope today/week/done и empty message; не создавать ложную полную историю из ограниченного endpoint.

**API и контракты:**

- WorkerAPI.tasksToday
- TaskMessagesAPI.listAll
- workerSync/unreadNotificationCount/helpAssistant как независимые secondary reads

**Состояния, которые нужно сохранить или реализовать:**

- initialLoading
- cachedStale
- tasksReady
- secondaryLoading
- emptyByFilter
- completedList
- targetLoading
- targetNotFound
- retry

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-10-AC-01 · NOT_RUN:** Given 20 медленных chat responses, Then новая task list уже доступна и secondary badge показывает loading/unknown.
- **V2-IOS-10-AC-02 · NOT_RUN:** Given обычный completed/done, When выбран Done, Then задача видна либо server scope объяснён, не пустая неподписанная область.
- **V2-IOS-10-AC-03 · NOT_RUN:** Given push taskId до окончания load, Then ID не теряется и открывает правильный объект.
- **V2-IOS-10-AC-04 · NOT_RUN:** Given старый load завершился после нового filter, Then он не перезаписывает актуальную выдачу.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-10-TEST-01 · NOT_RUN:** Controlled async repository tests: publish ordering, cancellation и stale response.
- **V2-IOS-10-TEST-02 · NOT_RUN:** Production task classification table: real enums + unknown.
- **V2-IOS-10-TEST-03 · NOT_RUN:** UI tests cold/warm cache, day filters, deep link outside first loaded list.

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/Views/TodayHomeView.swift:65](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/TodayHomeView.swift#L65)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/MyTasksView.swift:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/MyTasksView.swift#L63)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43Models.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43Models.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/MessagesHubView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/MessagesHubView.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift#L1)

**Условия остановки зависимого среза:**

- Если history API отсутствует, сначала согласовать current endpoint query; не имитировать историю из today.
- Время ускорения не обещать до device baseline.

**Условие выпуска:** G2; G3; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-10](AUDIT_REPORT_RU.md#ios-10), [IOS-17](AUDIT_REPORT_RU.md#ios-17).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-10`.

## V2-IOS-11

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-11).

**Довести notification и deep link до разрешённой сущности**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Открыть нужную задачу, отчёт, замечание или документ из события

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M. **Порядок DAG:** 35.

**Роли:** Worker; Manager.

**Экраны / семейства:** App delegates; WorkerTabShell; ManagerTabShell; Notifications / MessagesHub; Cold-start routing.

**Основные действия:** Открыть нужную задачу, отчёт, замечание или документ из события.

**Ввод и предпосылки:** typed targetType/targetId/projectId; auth state; selected project; pending route identity; server access result.

**Обязательные зависимости:** [V2-IOS-03](#v2-ios-03), [V2-IOS-10](#v2-ios-10)

**Шаги реализации:**

1. Свести payload parsing к typed route intent; id держится до результата, а не до первого lookup.
2. Дополнить Worker tap/cold-start delivery lifecycle там, где он отсутствует; сохранить существующие Manager UNUserNotificationCenterDelegate и background handlers.
3. Проверять роль, project context и актуальный доступ после login; корректно обрабатывать удалённый/отозванный объект.
4. Разделить notification delivered/opened/read и визуальный badge; Customer push оставить отдельным proposal gate, если канал не входит в доступный release slice.

**API и контракты:**

- Existing devices/register/unregister
- Existing notifications list/read/opened
- Target REST reads по app profile; route payload не выдаёт право доступа

**Состояния, которые нужно сохранить или реализовать:**

- received
- waitingForAuth
- waitingForProject
- loadingTarget
- opened
- notFound
- forbidden
- canceled

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-11-AC-01 · NOT_RUN:** Given приложение terminated, When нажато реальное разрешённое уведомление, Then после login открывается именно его target.
- **V2-IOS-11-AC-02 · NOT_RUN:** Given target другого проекта, Then shell согласованно меняет контекст или объясняет отказ.
- **V2-IOS-11-AC-03 · NOT_RUN:** Given повтор одного delivery, Then нет дубликата navigation stack или mutation.
- **V2-IOS-11-AC-04 · NOT_RUN:** Given notification read API fails, Then состояние не маскирует failure как успешную синхронизацию.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-11-TEST-01 · NOT_RUN:** Payload parser fixtures flat/nested data/unknown keys, production router resolve tests.
- **V2-IOS-11-TEST-02 · NOT_RUN:** UI injected route до auth/bootstrap/после проектного switch.
- **V2-IOS-11-TEST-03 · NOT_RUN:** Physical device APNs: foreground/background/terminated и permission deny→enable.

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/AiStroykaWorkerAppDelegate.swift:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/AiStroykaWorkerAppDelegate.swift#L18)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/WorkerTabShell.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/WorkerTabShell.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/MessagesHubView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/MessagesHubView.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/MyTasksView.swift:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/MyTasksView.swift#L63)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/PushRegistrationService.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/PushRegistrationService.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/AiStroykaManagerAppDelegate.swift:12](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/AiStroykaManagerAppDelegate.swift#L12)
- [ios/AiStroykaManager/AiStroykaManager/Views/ManagerTabShell.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ManagerTabShell.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Views/NotificationsView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/NotificationsView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerV43Models.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerV43Models.swift#L1)

**Условия остановки зависимого среза:**

- Нет реального APNs proof — статус DEVICE_BLOCKED/NOT_RUN, не PASS от injected notification.
- Не добавлять отсутствующий Customer channel без существующего server profile/contract и разрешённого release scope.

**Условие выпуска:** G1; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-10](AUDIT_REPORT_RU.md#ios-10).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-11`.

## V2-IOS-12

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-12).

**Добавить восстановление QR и контекстные permissions**

**P2 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Повторить сканирование и присоединиться по действительному приглашению

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** S/M. **Порядок DAG:** 36.

**Роли:** Worker.

**Экраны / семейства:** QRScanner; Worker Login QR; Project join; Camera permission recovery.

**Основные действия:** Повторить сканирование и присоединиться по действительному приглашению.

**Ввод и предпосылки:** invite token; camera authorization; scanner session state; existing project context.

**Обязательные зависимости:** [V2-IOS-03](#v2-ios-03)

**Шаги реализации:**

1. Отделить capture от validation: invalid code переводит scanner в rescan-ready и сбрасывает handled/session.
2. Показать ошибку на самом scanner, добавить Repeat и Cancel; закрытие возвращает в прежний контекст.
3. Запрашивать camera при необходимости; denied/restricted имеет объяснение и допустимый переход в Settings.
4. Сохранить sanitization/expiry/revoke server проверку; не расширять допустимые QR до произвольного project URL.

**API и контракты:**

- WorkerV43API.joinFromInviteToken / WorkerV43API.joinSite → POST worker/site-join
- Camera system permission; raw projectId не равен invite

**Состояния, которые нужно сохранить или реализовать:**

- requestingPermission
- scanning
- invalidCode
- validatingInvite
- expired/revoked
- joined
- denied
- rescanReady

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-12-AC-01 · NOT_RUN:** Given invalid QR, When Repeat, Then новый валидный QR распознаётся без закрытия всего приложения.
- **V2-IOS-12-AC-02 · NOT_RUN:** Given revoked invite, Then состояние понятно, текущий рабочий проект не потерян.
- **V2-IOS-12-AC-03 · NOT_RUN:** Given camera denied, Then нет бесконечного loading и пользователь может отменить/восстановить доступ.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-12-TEST-01 · NOT_RUN:** Production invite parser fixtures, не Self copy.
- **V2-IOS-12-TEST-02 · NOT_RUN:** UI scanner coordinator tests invalid→rescan→valid.
- **V2-IOS-12-TEST-03 · NOT_RUN:** Device camera permission deny/Settings return; VoiceOver focus на ошибке и Retry.

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/Views/QRScannerView.swift:18](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/QRScannerView.swift#L18)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/LoginView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/LoginView.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/HomeContainerView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/HomeContainerView.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/ProfileOfflineSettingsView.swift:249](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/ProfileOfflineSettingsView.swift#L249)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43Models.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43Models.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43API.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43API.swift#L1)

**Условия остановки зависимого среза:**

- Не отправлять настоящие приглашения для проверки parser; использовать разрешённый staging token.
- Не менять allow-list или membership grants ради QR success.

**Условие выпуска:** G1; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-16](AUDIT_REPORT_RU.md#ios-16).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-12`.

## V2-IOS-13

**Интеграция 20.10.2026:** Phase 6; AIS-EVID-002; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-13).

**Сделать camera settings и quality feedback правдивыми**

**P2 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Сохранить подходящую фотографию с понятным качеством и расходом трафика

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M. **Порядок DAG:** 37.

**Роли:** Worker.

**Экраны / семейства:** CameraEvidence; CameraPicker / ImagePicker; Profile camera/data-saver settings.

**Основные действия:** Сохранить подходящую фотографию с понятным качеством и расходом трафика.

**Ввод и предпосылки:** selected quality/dataSaver; actual media type/dimensions; reference photo; location consent; available disk.

**Обязательные зависимости:** [V2-IOS-04](#v2-ios-04), [V2-IOS-06](#v2-ios-06), [V2-IOS-12](#v2-ios-12)

**Шаги реализации:**

1. Связать high/saver с явно определённым encoding/resolution contract либо убрать неработающий выбор до реализации.
2. Разделить проверку file readiness, резкость, сопоставимость ракурса и строительную проверку; не превращать наличие pixels в уверенный verdict.
3. Не утверждать наличие close-up только по image != nil; объяснить нужный кадр и дать пользователю проверить.
4. Проверить background processing, low storage и доступ к геоданным; сохранить существующие geoScope consumers.

**API и контракты:**

- Existing upload session/finalize metadata
- Никакой новый AI quality provider не требуется для UI correctness

**Состояния, которые нужно сохранить или реализовать:**

- noImage
- captured
- processing
- qualityUnknown
- qualityWarning
- ready
- permissionDenied
- savingFailed

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-13-AC-01 · NOT_RUN:** Given Saver выбран, Then фактический output следует документированному профилю; переключатель не пустой.
- **V2-IOS-13-AC-02 · NOT_RUN:** Given большой размытый кадр, Then размер сам по себе не устанавливает «резкость ОК».
- **V2-IOS-13-AC-03 · NOT_RUN:** Given location denied, Then нет подставленных координат/подтверждения объекта.
- **V2-IOS-13-AC-04 · NOT_RUN:** Given quality неизвестна, Then сохранение/предупреждение соответствует принятому evidence policy, не выдуманной норме.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-13-TEST-01 · NOT_RUN:** Real image fixtures по encoding/type, dimensions и заведомой размытости; не тестировать копию формулы.
- **V2-IOS-13-TEST-02 · NOT_RUN:** Device high/saver responsiveness и bytes, permissions, low-storage fallback.
- **V2-IOS-13-TEST-03 · NOT_RUN:** Visual capture all comparison states на реальном runner.

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/Views/CameraEvidenceView.swift:61](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/CameraEvidenceView.swift#L61)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/CameraPicker.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/CameraPicker.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/ImagePicker.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/ImagePicker.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/ProfileOfflineSettingsView.swift:94](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/ProfileOfflineSettingsView.swift#L94)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43Models.swift:577](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43Models.swift#L577)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerLocationService.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerLocationService.swift#L1)

**Условия остановки зависимого среза:**

- Нельзя заявлять инженерную пригодность/нормативное соответствие без проверенного метода и данных.
- Не удалять исходный pending файл до подтверждённого сохранения выбранного output.

**Условие выпуска:** G2; G3; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-13](AUDIT_REPORT_RU.md#ios-13), [IOS-02](AUDIT_REPORT_RU.md#ios-02).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-13`.

## V2-IOS-14

**Интеграция 20.10.2026:** Phase 6; AIS-EVID-002; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-14).

**Восстанавливать исправление отчёта, сохранив существующий queued submit**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Исправить и повторно отправить тот же отчёт после ошибки или перезапуска

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M/L. **Порядок DAG:** 38.

**Роли:** Worker.

**Экраны / семейства:** ManagerFeedbackResubmit; ReportResubmit; Existing evidence / correction camera.

**Основные действия:** Исправить и повторно отправить тот же отчёт после ошибки или перезапуска.

**Ввод и предпосылки:** existing reportId/taskId; server status changes_requested; manager note; worker reply; correction media revision; existing queued submit operationId.

**Обязательные зависимости:** [V2-IOS-05](#v2-ios-05), [V2-IOS-06](#v2-ios-06), [V2-IOS-07](#v2-ios-07), [V2-CON-01](#v2-con-01), [V2-CON-03](#v2-con-03)

**Шаги реализации:**

1. Переиспользовать queueSubmitOperation; не заменять его полностью прямым submit и не создавать новый report.
2. Сохранить correction note, выбранное фото, attach result и operation ID в draft/repository; retry повторяет только незавершённый этап.
3. Связать attachedSessionId с media revision; новая фотография после частичного успеха не может молча оставить старую attachment identity.
4. Очищать только успешно отправленный draft/correction, а не все pendingUploads другого активного отчёта.

**API и контракты:**

- Worker report detail
- WorkerAPI.uploadEvidence + addMedia
- Existing OperationType.submitReport того же reportId

**Состояния, которые нужно сохранить или реализовать:**

- loadingReport
- editingCorrection
- mediaPending
- attaching
- ready
- submitQueued
- retryableError
- submitted
- staleDecision

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-14-AC-01 · NOT_RUN:** Given report R1 changes_requested, When исправление отправлено, Then Manager видит новые разрешённые media/note в R1 и историю.
- **V2-IOS-14-AC-02 · NOT_RUN:** Given upload success + attach timeout, When restart/retry, Then существующий result продолжен без нового report.
- **V2-IOS-14-AC-03 · NOT_RUN:** Given correction A заменена B после attach, Then отправка следует принятой revision policy и не скрывает A/B рассогласование.
- **V2-IOS-14-AC-04 · NOT_RUN:** Given pending draft R2, When resubmit R1 succeeds, Then R2 и его файлы не удалены.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-14-TEST-01 · NOT_RUN:** State-machine tests с fake transport для каждого interruption boundary.
- **V2-IOS-14-TEST-02 · NOT_RUN:** Existing report payload fixture с old/new media, manager note и unknown status.
- **V2-IOS-14-TEST-03 · NOT_RUN:** Device camera correction→kill→resume; Manager independent readback.

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/Views/ReportResubmitView.swift:213](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/ReportResubmitView.swift#L213)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/DailyReportFormView.swift:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/DailyReportFormView.swift#L27)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/OperationQueueExecutor.swift:37](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/OperationQueueExecutor.swift#L37)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Persistence/Operation.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Persistence/Operation.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Persistence/AppStateStore.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Persistence/AppStateStore.swift#L1)

**Условия остановки зависимого среза:**

- Server status изменился — остановить stale action, перечитать и показать новую причину.
- Не признавать исторический текст на старом screenshot текущим ограничением correction media.

**Условие выпуска:** G1; G2; G3; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-04](AUDIT_REPORT_RU.md#ios-04), [IOS-05](AUDIT_REPORT_RU.md#ios-05), [IOS-18](AUDIT_REPORT_RU.md#ios-18).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-14`.

## V2-IOS-15

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001, AIS-EVID-002; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-15).

**Сохранить identity замечания при частичном успехе**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Создать или устранить замечание с доказательством и понятным результатом

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M/L. **Порядок DAG:** 39.

**Роли:** Worker; Manager.

**Экраны / семейства:** IssuesList / Create sheet; IssueResolution; Manager issue detail.

**Основные действия:** Создать или устранить замечание с доказательством и понятным результатом.

**Ввод и предпосылки:** project/task/issueId; author/assignee capability; title/description; evidence file; status transition; idempotency intent.

**Обязательные зависимости:** [V2-IOS-02](#v2-ios-02), [V2-IOS-06](#v2-ios-06), [V2-IOS-07](#v2-ios-07), [V2-CON-01](#v2-con-01)

**Шаги реализации:**

1. После успешного create сразу durable сохранить issueId и idempotency intent; повтор media/patch не вызывает второй create.
2. Отображать action error внутри create sheet с сохранённым текстом и фото, а не только за sheet.
3. Обновлять IssueResolution из возвращённого DTO/status; success и error должны иметь разные сообщения/traits.
4. В Manager открыть конкретное замечание с evidence и разрешёнными переходами, используя исправленный decode contract.

**API и контракты:**

- Existing project issues create/read/PATCH
- Worker evidence upload; author or task-assignee policy сохраняется

**Состояния, которые нужно сохранить или реализовать:**

- editing
- creating
- createdMediaPending
- uploading
- patching
- awaitingReview
- failedStep
- resolved
- forbidden

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-15-AC-01 · NOT_RUN:** Given create201+upload500, When Retry, Then один issueId и повтор только upload/patch.
- **V2-IOS-15-AC-02 · NOT_RUN:** Given Worker не автор и не assignee, Then server403 сохранён и текст ввода не исчезает.
- **V2-IOS-15-AC-03 · NOT_RUN:** Given correction отправлена, Then статус соответствует server response, а не прежнему immutable DTO.
- **V2-IOS-15-AC-04 · NOT_RUN:** Given notification issueId, Then Manager попадает к доказательству данного issue.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-15-TEST-01 · NOT_RUN:** Production command saga test create/media/patch interruption, stable IDs.
- **V2-IOS-15-TEST-02 · NOT_RUN:** Role fixtures author/assignee/other; error visibility UI.
- **V2-IOS-15-TEST-03 · NOT_RUN:** Staging Worker create→Manager detail→return→resolution.

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/Views/IssuesListView.swift:180](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/IssuesListView.swift#L180)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43API.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerV43API.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Views/ProjectDetailView.swift:694](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ProjectDetailView.swift#L694)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift:518](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift#L518)

**Условия остановки зависимого среза:**

- Нет разрешённого status transition — сохранить refusal; не расширять Worker права.
- Не делать новый issues backend, пока существующий endpoint покрывает задачу.

**Условие выпуска:** G1; G2; G3; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-18](AUDIT_REPORT_RU.md#ios-18), [IOS-12](AUDIT_REPORT_RU.md#ios-12).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-15`.

## V2-IOS-16

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-16).

**Сохранить chat draft и media при ошибке отправки**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Передать сообщение по задаче и повторить неуспешное вложение

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M/L. **Порядок DAG:** 40.

**Роли:** Worker; Manager.

**Экраны / семейства:** MessagesHub / Task chat; Voice recorder; Photo/video picker; Media viewer.

**Основные действия:** Передать сообщение по задаче и повторить неуспешное вложение.

**Ввод и предпосылки:** taskId/owner; client message ID; text или local media file; actual MIME/container; duration; upload result.

**Обязательные зависимости:** [V2-IOS-02](#v2-ios-02), [V2-IOS-06](#v2-ios-06), [V2-IOS-07](#v2-ios-07), [V2-CON-01](#v2-con-01)

**Шаги реализации:**

1. Вернуть result из sendMedia и удалять записанный voice файл только после подтверждённого success или явного Discard.
2. Сохранить pending clientId/media result; network retry продолжает upload/send с той же logical message identity.
3. Определять фактический PhotosPicker MIME/container или выполнять явное преобразование; не назначать JPEG/MP4 необработанным bytes без проверки.
4. Сохранить task access, polling/read markers и viewer; дать Send again/Discard с понятным состоянием.

**API и контракты:**

- TaskMessagesAPI.listAll/sendText/sendMedia/delete existing methods
- MediaUploadHelper.uploadChatMedia
- Worker offline text hook сохранить

**Состояния, которые нужно сохранить или реализовать:**

- draft
- recording
- recorded
- queued
- uploading
- sent
- failedRetryable
- permissionDenied
- deleted

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-16-AC-01 · NOT_RUN:** Given voice recorded и network error, Then запись остаётся доступна для preview/retry.
- **V2-IOS-16-AC-02 · NOT_RUN:** Given upload succeeded, message send timed out, Then retry не создаёт второй logical message.
- **V2-IOS-16-AC-03 · NOT_RUN:** Given HEIC/PNG/MOV input, Then MIME/fileExtension и actual bytes согласованы.
- **V2-IOS-16-AC-04 · NOT_RUN:** Given другой аккаунт, Then он не видит chat drafts/read markers предыдущего контекста.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-16-TEST-01 · NOT_RUN:** Production ChatViewModel fake transport + filesystem tests для success/error/timeout.
- **V2-IOS-16-TEST-02 · NOT_RUN:** Real media fixtures magic bytes/container; Shared tests не копируют конвертер.
- **V2-IOS-16-TEST-03 · NOT_RUN:** Device microphone deny/interruption, video playback, VoiceOver composer.

**Проверенные исходные точки:**

- [ios/Shared/Sources/Shared/TaskChatView.swift:124](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/TaskChatView.swift#L124)
- [ios/Shared/Sources/Shared/TaskMessageDTO.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/TaskMessageDTO.swift#L1)
- [ios/Shared/Sources/Shared/MediaUploadHelper.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/MediaUploadHelper.swift#L1)
- [ios/Shared/Sources/Shared/TaskChatReadStore.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/TaskChatReadStore.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/MessagesHubView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/MessagesHubView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Views/TasksListView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/TasksListView.swift#L1)

**Условия остановки зависимого среза:**

- Offline media scope может быть явно ограничен, но файл не уничтожается из-за отказа отправки.
- Не добавлять API/push права Manager через Worker sync.

**Условие выпуска:** G1; G2; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-18](AUDIT_REPORT_RU.md#ios-18).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-16`.


# M03 — Задачи и Manager review

## V2-AND-08

**Интеграция 20.10.2026:** Phase 6; AIS-EVID-002, AIS-PILOT-001D; release scope `ANDROID_DEFERRED`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-and-08).

**Manager видит полное доказательство и результат проверки**

**P1 · ANDROID · CURRENT_MINIMUM_MANAGER_REST · PROPOSED / NOT_RUN**

**Результат:** Manager DTO принимает file_url для каждого attachment и worker_note; UI использует прямой report-scoped URL, mediaId/uploadSessionId сохраняет identity. Удалить обязательность project-media first50 lookup для preview.

**Предлагаемый владелец:** Android owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M. **Порядок DAG:** 41.

**Роли:** Manager; owner/admin; project reviewer.

**Экраны / семейства:** Report Detail.

**Основные действия:** Открыть фото; Прочитать отчёт; Утвердить; Запросить правки; Отклонить; Повторить загрузку.

**Обязательные зависимости:** [V2-AND-02](#v2-and-02), [V2-CON-03](#v2-con-03)

**Условные зависимости выпуска:**

- V2-CON-01: если action автоматически повторяется после неизвестного результата; иначе NeedsReconciliation/readback

**Шаги реализации:**

1. Manager DTO принимает file_url для каждого attachment и worker_note; UI использует прямой report-scoped URL, mediaId/uploadSessionId сохраняет identity. Удалить обязательность project-media first50 lookup для preview.
2. При загрузке показывать metadata/note/evidence независимо от optional analysis; AI status не блокирует review evidence. Не принимать heuristic как решение.
3. Gallery thumbnails/fullscreen доступны для media_id и upload_session_id; signed URL expiry refresh через GET report detail, ошибки фото локальны и не стирают report.
4. Review CTA зависит от authoritative capability + status; note обязательность меняется по выбранному action, сохраняется при failure.
5. PATCH ambiguous timeout reconciles GET status; повторный tap coalesced. При stale submitted status серверный отказ не выдаётся за успех.
6. Success обновляет report и invalidates Manager REST inbox/count query с тем же scope; текущая filter selection сохраняется.
7. Null detail/error branch рендерит типизированную ошибку до early return, retry и back.

**API и контракты:**

- GET /api/v1/reports/:id
- PATCH /api/v1/reports/:id
- GET /api/v1/reports/:id/analysis-status (optional)
- GET /api/v1/reports list invalidation

**Состояния, которые нужно сохранить или реализовать:**

- Loading
- Ready
- ReadOnly
- EvidenceLoading
- EvidenceUnavailable
- ReviewEditing
- ReviewPending
- ReviewSaved
- Conflict
- Forbidden
- NotFound
- RetryableError

**Критерии приёмки — ещё не проверены:**

- **V2-AND-08-AC-01 · NOT_RUN:** AC01 Attachment with only upload_session_id + file_url отображается; mediaId outside first50 project media также виден без project list fetch.
- **V2-AND-08-AC-02 · NOT_RUN:** AC02 Manager видит полный worker_note и manager_note, а не только UUID/status; nullable/unknown fields безопасны.
- **V2-AND-08-AC-03 · NOT_RUN:** AC03 Истёкший URL даёт bounded refresh/retry; unauthorized image не заменяется публичной ссылкой и не кэшируется под чужим owner.
- **V2-AND-08-AC-04 · NOT_RUN:** AC04 Reject/changes требуют непустую note до send; approve может без note; поле и error copy соответствуют действию.
- **V2-AND-08-AC-05 · NOT_RUN:** AC05 401/403/404/500/offline на initial detail показывают причину/retry/back; error не заменяется «Нет отчёта».
- **V2-AND-08-AC-06 · NOT_RUN:** AC06 Двойной tap/timeout PATCH не делает два логических review; неизвестный outcome сначала GET reconcile.
- **V2-AND-08-AC-07 · NOT_RUN:** AC07 Saved decision обновляет detail, удаляет row из submitted-only после invalidate и обновляет достоверный count; filter A/All не сбрасывается.
- **V2-AND-08-AC-08 · NOT_RUN:** AC08 Peer/cross-project denied review остаётся denied на backend и UI; /sync/* из Manager не вызывается.

**Будущие проверки — NOT_RUN:**

- **V2-AND-08-TEST-01 · NOT_RUN:** DTO fixtures media_id-only, upload_session_id-only, signed URL nullable, worker_note,unknown optional fields.
- **V2-AND-08-TEST-02 · NOT_RUN:** Review validation/outcome reconciliation/error-state precedence/gallery refresh.
- **V2-AND-08-TEST-03 · NOT_RUN:** Real synthetic photo viewer+note, request changes/reject/approve and API outcome; large font/focus.

**Предлагаемое деление PR:**

- DTO/gallery/evidence error fix
- Review state/reconciliation/invalidation

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `android/AiStroykaManager/src/main/java/ai/aistroyka/manager/reports/ReportDetailState.kt`

**Проверенные исходные точки:**

- [android/shared/src/main/java/ai/aistroyka/shared/ManagerDtos.kt:34](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/ManagerDtos.kt#L34)
- [android/shared/src/main/java/ai/aistroyka/shared/ManagerApi.kt:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/ManagerApi.kt#L1)
- [android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ManagerViewModel.kt:247](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ManagerViewModel.kt#L247)
- [android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ui/ManagerApp.kt:625](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ui/ManagerApp.kt#L625)
- [apps/web/app/api/v1/reports/[id]/route.ts:59](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/reports/%5Bid%5D/route.ts#L59)

**Условия остановки зависимого среза:**



**Условие выпуска:** Нельзя PASS, пока screenshot/trace не доказывают просмотр photo+worker_note и server review outcome на конкретном report. Source DTO fix без native proof — PARTIAL.

**Rollback:** Возврат только readonly detail при capability/service regression; не возвращать preview dependency на first50 media.

**Находки:** [AND-001](AUDIT_REPORT_RU.md#and-001), [AND-013](AUDIT_REPORT_RU.md#and-013), [AND-014](AUDIT_REPORT_RU.md#and-014), [AND-017](AUDIT_REPORT_RU.md#and-017), [AND-018](AUDIT_REPORT_RU.md#and-018).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-AND-08`.

## V2-AND-09

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001D; release scope `ANDROID_DEFERRED`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-and-09).

**Правдивая Manager очередь: All/A/B/Без привязки, страницы и счётчики**

**P1 · ANDROID · CURRENT_MINIMUM_MANAGER_REST · PROPOSED / NOT_RUN**

**Результат:** Заменить nullable selectedProjectId на явный Scope(All|Project(id)|Unassigned); null default больше не сбрасывает All на first project.

**Предлагаемый владелец:** Android owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** L due to real backend contract dependency. **Порядок DAG:** 42.

**Роли:** Manager; owner/admin reviewer.

**Экраны / семейства:** Manager Home; Reports Inbox.

**Основные действия:** Выбрать область; Открыть ожидающий отчёт; Найти отчёт; Загрузить следующую страницу; Обновить.

**Обязательные зависимости:** [V2-AND-02](#v2-and-02), [V2-AND-08](#v2-and-08), [V2-CON-04](#v2-con-04)

**Шаги реализации:**

1. Заменить nullable selectedProjectId на явный Scope(All|Project(id)|Unassigned); null default больше не сбрасывает All на first project.
2. Согласовать backend pagination/status-before-limit/project/q semantics и exact/unknown totals до Android load-more. Existing bounded read не считается pagination.
3. ManagerReportsRepository query key = owner+scope+status+search+sort. Debounce/cancel stale request; page append dedupe stable reportId, сохранить scroll/back state.
4. Показывать понятное название объекта/автора/время там, где payload позволяет, UUID оставить secondary/debug. Не выдумывать имя по UUID.
5. Pending count брать из exact count с тем же разрешённым scope либо честно «Загружено N, есть ещё»; failed ops не превращать в0.
6. После review invalidate list/count с сохранением query scope; submitted-only больше не содержит обработанный report.
7. Unassigned явно видим для ролей, которым разрешён tenant review; project manager не получает чужие права ради отображения All.
8. Основной Manager path остаётся REST, Worker snapshot не используется как источник очереди.

**API и контракты:**

- GET /api/v1/reports — proposed additive pagination/unassigned contract
- GET /api/v1/ops/overview — bounded queue only until exact count contract
- GET /api/v1/projects
- PATCH /api/v1/reports/:id invalidates scoped REST queries

**Состояния, которые нужно сохранить или реализовать:**

- LoadingFirstPage
- Empty
- Ready
- LoadingMore
- EndReached
- PartialWithMore
- RefreshErrorWithCachedData
- FilterEmpty
- ForbiddenScope
- SearchNoResults

**Исходные platform contract references:**

- ANDROID-REPORT-LIST

Сопоставить с общим ownership CON/ARCH из раздела 3; не создавать параллельный серверный контракт.

**Критерии приёмки — ещё не проверены:**

- **V2-AND-09-AC-01 · NOT_RUN:** AC01 All сохраняется после Refresh/bootstrap/возврата из detail; Project A исключает B, Project B исключает A.
- **V2-AND-09-AC-02 · NOT_RUN:** AC02 Unassigned виден отдельно и в All только в рамках разрешений; привязка через task/day не теряется.
- **V2-AND-09-AC-03 · NOT_RUN:** AC03 Fixture≥205 отчётов с mixed status/project и submitted item за позицией101/201 доступен последовательными страницами; status filter применяется до page limit.
- **V2-AND-09-AC-04 · NOT_RUN:** AC04 Тот же report не дублируется/не пропадает при equal timestamps/new insertion между страницами по согласованной cursor semantics.
- **V2-AND-09-AC-05 · NOT_RUN:** AC05 total показан только точный; limit15 queue.size не выводится как полное количество. Network error показывает unknown/stale, не0.
- **V2-AND-09-AC-06 · NOT_RUN:** AC06 Поиск использует server semantics на полном scoped наборе, а не только загруженные100; debounce и stale query response не смешивают A/B.
- **V2-AND-09-AC-07 · NOT_RUN:** AC07 После approve/reject/changes row исчезает из submitted-only и counts обновлены, All/status filter сохраняются.
- **V2-AND-09-AC-08 · NOT_RUN:** AC08 Empty, no search results, no permissions и failed load имеют разные copy/retry; previous scoped rows сохраняются на transient error.
- **V2-AND-09-AC-09 · NOT_RUN:** AC09 Query не меняется на /sync/bootstrap; backward-compatible data остаётся для старых web/iOS clients.
- **V2-AND-09-AC-10 · NOT_RUN:** AC10 Пока pagination contract не внедрён, честный ограниченный список/unknown total допустим как промежуточный PATCH, но ticket/release gate полноты не закрыт.

**Будущие проверки — NOT_RUN:**

- **V2-AND-09-TEST-01 · NOT_RUN:** All/A/B/unassigned×status×q×205 rows; before-limit filters, exact/unknown totals, stable cursor.
- **V2-AND-09-TEST-02 · NOT_RUN:** Scope persistence, query cancellation, page merge/dedupe, review invalidation.
- **V2-AND-09-TEST-03 · NOT_RUN:** Navigate to101+ report, switch All/A/B/Unassigned, review and back with same scroll/filter.
- **V2-AND-09-TEST-04 · NOT_RUN:** Tenant/project permissions and legacy client data response compatibility.

**Предлагаемое деление PR:**

- Additive server list contract + cross-client fixtures
- Manager repository/scope UI
- Paging/review invalidation device proof

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `android/AiStroykaManager/src/main/java/ai/aistroyka/manager/reports/ManagerReportsRepository.kt`
- `packages/contracts/src/schemas/report-list.schema.ts`

**Проверенные исходные точки:**

- [android/shared/src/main/java/ai/aistroyka/shared/ManagerApi.kt:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/ManagerApi.kt#L1)
- [android/shared/src/main/java/ai/aistroyka/shared/ManagerDtos.kt:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/ManagerDtos.kt#L1)
- [android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ManagerViewModel.kt:168](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ManagerViewModel.kt#L168)
- [android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ui/ManagerApp.kt:249](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ui/ManagerApp.kt#L249)
- [apps/web/app/api/v1/reports/route.ts:20](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/reports/route.ts#L20)
- [apps/web/lib/domain/reports/report-list.repository.ts:79](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/reports/report-list.repository.ts#L79)
- [apps/web/lib/ops/ops-overview.repository.ts:97](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/ops/ops-overview.repository.ts#L97)

**Условия остановки зависимого среза:**



**Условие выпуска:** 205-row deterministic fixture + actual native paging/filter/review trace. Increase limit alone is FAIL.

**Rollback:** Отключить new paging UI при несовместимом contract, показывать ограниченность/unknown total; не обещать All полноту.

**Находки:** [AND-006](AUDIT_REPORT_RU.md#and-006), [AND-017](AUDIT_REPORT_RU.md#and-017), [AND-009](AUDIT_REPORT_RU.md#and-009), [AND-013](AUDIT_REPORT_RU.md#and-013).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-AND-09`.

## V2-IOS-17

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-17).

**Сделать Manager Home и проектные входы завершёнными**

**P2 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Создать первый объект или открыть существующую рабочую задачу

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M. **Порядок DAG:** 43.

**Роли:** Manager.

**Экраны / семейства:** ManagerTabShell; HomeDashboard; ProjectsList; CreateProjectSheet; ProjectDetail.

**Основные действия:** Создать первый объект или открыть существующую рабочую задачу.

**Ввод и предпосылки:** authorized Manager scope; projects list/state; project name; selected project; server capabilities.

**Обязательные зависимости:** [V2-IOS-02](#v2-ios-02), [V2-IOS-03](#v2-ios-03)

**Шаги реализации:**

1. Подключить существующий CreateProjectSheet из empty state с capability; оставить Home get-started route.
2. Определить source-of-truth выбранного проекта и типизированные route intents для project/task/report/issue/doc.
3. Согласовать активные filters с lifecycle, loading/error summary не превращать в healthy.
4. Сохранить существующую shell навигацию до проверки proposal; первый экран может стать actionable inbox без массового переименования маршрутов.

**API и контракты:**

- ManagerAPI.projects/createProject/projectDetail/projectSummary/workload
- Manager REST остаётся основой

**Состояния, которые нужно сохранить или реализовать:**

- loading
- emptyCanCreate
- emptyNoPermission
- errorRetry
- cachedStale
- creating
- created
- partialSummary

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-17-AC-01 · NOT_RUN:** Given 0 проектов и право create, Then CTA доступен прямо в пустом списке.
- **V2-IOS-17-AC-02 · NOT_RUN:** Given create response201, Then открывается новый проект по возвращённому ID; repeated tap не дублирует.
- **V2-IOS-17-AC-03 · NOT_RUN:** Given summary500 при доступном проекте, Then проект открыт, ошибочный блок имеет Retry/unknown.
- **V2-IOS-17-AC-04 · NOT_RUN:** Given Back из детали, Then сохраняются list search/filter и scroll context.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-17-TEST-01 · NOT_RUN:** UI empty/error/success create с production view model.
- **V2-IOS-17-TEST-02 · NOT_RUN:** Route resolver fixtures и two-project scoped cache.
- **V2-IOS-17-TEST-03 · NOT_RUN:** Device малый экран/крупный текст: первый project creation.

**Проверенные исходные точки:**

- [ios/AiStroykaManager/AiStroykaManager/Views/ManagerTabShell.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ManagerTabShell.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Views/HomeDashboardView.swift:526](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/HomeDashboardView.swift#L526)
- [ios/AiStroykaManager/AiStroykaManager/Views/ProjectsListView.swift:34](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ProjectsListView.swift#L34)
- [ios/AiStroykaManager/AiStroykaManager/Views/ProjectDetailView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ProjectDetailView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerV43Models.swift:186](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerV43Models.swift#L186)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift#L1)

**Условия остановки зависимого среза:**

- Не добавлять выдуманные lifecycle или capability поля: проверить текущий contract.
- Нет runtime validation IA proposal — не заменять весь tab bar одним PR.

**Условие выпуска:** G1; G3; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-16](AUDIT_REPORT_RU.md#ios-16), [IOS-01](AUDIT_REPORT_RU.md#ios-01).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-17`.

## V2-IOS-18

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001, AIS-EVID-002; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-18).

**Проверить полный Manager task lifecycle и назначение**

**P2 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Создать, назначить и изменить одну задачу с предсказуемым возвратом

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M. **Порядок DAG:** 44.

**Роли:** Manager.

**Экраны / семейства:** TasksList/list-calendar; TaskDetailManager; TaskFieldsEditSheet; TaskCreateEdit; AssigneePicker; Project tasks.

**Основные действия:** Создать, назначить и изменить одну задачу с предсказуемым возвратом.

**Ввод и предпосылки:** projectId/taskId; title/description; deadline/priority/status; assignee; photo requirements/reference media; server version/capabilities.

**Обязательные зависимости:** [V2-IOS-17](#v2-ios-17), [V2-IOS-04](#v2-ios-04)

**Шаги реализации:**

1. Это verification/structure пакет существующих функций, не утверждение, что CRUD отсутствует.
2. Один task repository/read model для all/project/worker routes; filters и pagination не теряют scope.
3. Отдельно показать результат create и assign при частичном успехе; повторяет только незавершённую команду.
4. Task requirements из Manager согласовать с Worker template/quantity; preserve task ID, optional clears и reference media.

**API и контракты:**

- ManagerAPI.tasks/taskDetail/createTask/patchTask/assignTask/projectWorkers
- Existing task field encoding: preserve explicit null/omitted semantics

**Состояния, которые нужно сохранить или реализовать:**

- listLoading
- filterEmpty
- detailLoading
- editing
- saving
- createdAssignmentPending
- validationError
- conflict
- saved

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-18-AC-01 · NOT_RUN:** Given create succeeded, assign failed, Then открыт существующий task и Retry assign не создаёт второй.
- **V2-IOS-18-AC-02 · NOT_RUN:** Given очистка dueDate/assignee разрешена, Then payload явным образом очищает поле согласно контракту.
- **V2-IOS-18-AC-03 · NOT_RUN:** Given task вне текущей страницы списка, Then deep link открывает его или корректный denial.
- **V2-IOS-18-AC-04 · NOT_RUN:** Given сохранён новый requirement, Then Worker получает ту же версию при sync/read.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-18-TEST-01 · NOT_RUN:** Wire fixtures create/patch including omitted/null fields and unknown enum.
- **V2-IOS-18-TEST-02 · NOT_RUN:** UI list/calendar/filter/back, create/edit/cancel, error/stale.
- **V2-IOS-18-TEST-03 · NOT_RUN:** Staging Manager assign→Worker taskDetail identity check.

**Проверенные исходные точки:**

- [ios/AiStroykaManager/AiStroykaManager/Views/TasksListView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/TasksListView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Views/ProjectDetailView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ProjectDetailView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerV43Models.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerV43Models.swift#L1)

**Условия остановки зависимого среза:**

- Изменение требований API требует additive compatibility, без breaking старых Worker клиентов.
- Не писать декоративные mirror tests; защищать данные, partial success и маршруты.

**Условие выпуска:** G1; G3; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** Validation/integration completion текущего scope.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-18`.

## V2-IOS-19

**Интеграция 20.10.2026:** Phase 6; AIS-EVID-002, AIS-OWNER-001, AIS-OWNER-002, AIS-PILOT-001D; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-19).

**Сохранить доказательство в Manager review и отдельной публикации**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Принять или вернуть отчёт и отдельно выбрать фото для заказчика

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M/L. **Порядок DAG:** 45.

**Роли:** Manager; Customer.

**Экраны / семейства:** ReportsInbox; ReportDetailReview; ManagerPhotoPublicationPanel; Report export/share.

**Основные действия:** Принять или вернуть отчёт и отдельно выбрать фото для заказчика.

**Ввод и предпосылки:** reportId/revision/status; worker/manager notes; all permitted media; publication item/source identity; expected version.

**Обязательные зависимости:** [V2-IOS-06](#v2-ios-06), [V2-IOS-07](#v2-ios-07), [V2-CON-03](#v2-con-03)

**Условные зависимости выпуска:**

- V2-CON-04: только интеграция inbox/list/count отчётов; работа над отдельным review detail не блокируется
- V2-CON-01: если action автоматически повторяется после неизвестного результата; иначе NeedsReconciliation/readback

**Шаги реализации:**

1. Сохранить existing report media, workerNote, quantity unknown semantics и note-required gate для reject/changes.
2. Согласовать review result/reload/cache invalidation с одним report repository, не повторять удачный PATCH из-за отказа вторичного read.
3. Не смешивать approved report с customer publication: выбор source items и version остаются явным действием.
4. Показывать stale conflict/revocation и независимый readback; все media должны открываться в разрешённом контексте.

**API и контракты:**

- ManagerAPI.reportDetail/reportReview/reportApprovalHistory
- ReportPhotoPublication existing GET/PATCH contract
- CustomerAPI.publishedPhotos

**Состояния, которые нужно сохранить или реализовать:**

- loading
- queueEmpty
- mediaLoading
- reviewPending
- approved
- changesRequested
- rejected
- publicationLoading
- publishing
- conflict
- revoked

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-19-AC-01 · NOT_RUN:** Given report с8media включая session-only, Then все доступны Manager и identity совпадает с Worker.
- **V2-IOS-19-AC-02 · NOT_RUN:** Given changes_requested, Then причина видна Worker и возврат сохраняет reportId.
- **V2-IOS-19-AC-03 · NOT_RUN:** Given approved, Then фото не публикуются автоматически.
- **V2-IOS-19-AC-04 · NOT_RUN:** Given publish/revoke, Then Customer последующий authorized read отражает разрешённый набор; stale expected_version не перезаписан молча.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-19-TEST-01 · NOT_RUN:** Existing ReportPhotoPublication contract fixtures + wrong-project/foreign-url negative cases.
- **V2-IOS-19-TEST-02 · NOT_RUN:** UI review error/save/refresh failure и publication selection/conflict.
- **V2-IOS-19-TEST-03 · NOT_RUN:** Staging three-role cycle с independent server readback, без настоящего production publish.

**Проверенные исходные точки:**

- [ios/AiStroykaManager/AiStroykaManager/Views/ReportsInboxView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ReportsInboxView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift#L1)
- [ios/Shared/Sources/Shared/ReportPhotoPublication.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/ReportPhotoPublication.swift#L1)
- [ios/Shared/Sources/Shared/ManagerV43Formatters.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/ManagerV43Formatters.swift#L1)
- [ios/AiStroykaCustomer/AiStroykaCustomer/CustomerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/CustomerAPI.swift#L1)

**Условия остановки зависимого среза:**

- Сохранить customer-safe source resolver и deny-by-default audience; не выдавать raw storage как shortcut.
- Нельзя обещать отзыв внешней уже скачанной копии; TTL и последующий gateway access проверяются отдельно.

**Условие выпуска:** G1; G3; G5; G6

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-04](AUDIT_REPORT_RU.md#ios-04), [IOS-07](AUDIT_REPORT_RU.md#ios-07).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-19`.

## V2-IOS-20

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-20).

**Уточнить Manager Team и Notifications действия**

**P2 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Связаться, назначить работу или открыть нужное уведомление

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M. **Порядок DAG:** 46.

**Роли:** Manager.

**Экраны / семейства:** TeamOverview; WorkerDetail; InviteTeammateSheet; Notifications.

**Основные действия:** Связаться, назначить работу или открыть нужное уведомление.

**Ввод и предпосылки:** workerId/email; project/task scope; invite role; notification target/read state; local hidden preference.

**Обязательные зависимости:** [V2-IOS-03](#v2-ios-03), [V2-IOS-17](#v2-ios-17)

**Шаги реализации:**

1. Подписать contact как email/копирование там, где нет phone; сообщить результат fallback.
2. При переходе к задачам WorkerDetail сохранить workerId filter, проект и путь назад.
3. Локальное скрытие notification назвать именно скрытием; не обещать отключение будущих push без server/device preference contract.
4. Invite/read mutations имеют отдельные pending/error; invitation retry не посылается повторно при неизвестном исходе без проверки.

**API и контракты:**

- ManagerAPI.workers/workerSummary/projectWorkers/assignTask
- tenant/invite existing gate
- notifications/read/opened/read-all

**Состояния, которые нужно сохранить или реализовать:**

- loading
- empty
- inviting
- inviteSent
- assigning
- contactUnavailable
- readPending
- readFailed
- locallyHidden

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-20-AC-01 · NOT_RUN:** Given только email, Then контактное действие не обещает телефонный звонок.
- **V2-IOS-20-AC-02 · NOT_RUN:** Given скрыта одна карточка, Then UI не сообщает подписку на будущие уведомления отключённой.
- **V2-IOS-20-AC-03 · NOT_RUN:** Given invite permission403, Then причина видна и роли не расширены.
- **V2-IOS-20-AC-04 · NOT_RUN:** Given WorkerDetail→Tasks, Then задачи сохраняют worker filter.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-20-TEST-01 · NOT_RUN:** UI contact fallback, empty team, filters, hidden/read error states.
- **V2-IOS-20-TEST-02 · NOT_RUN:** REST contract fake transport invitation/notification timeouts.
- **V2-IOS-20-TEST-03 · NOT_RUN:** Staging invite только на разрешённого тестового получателя; device open target через ticket11.

**Проверенные исходные точки:**

- [ios/AiStroykaManager/AiStroykaManager/Views/TeamOverviewView.swift:555](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/TeamOverviewView.swift#L555)
- [ios/AiStroykaManager/AiStroykaManager/Views/NotificationsView.swift:314](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/NotificationsView.swift#L314)
- [ios/AiStroykaManager/AiStroykaManager/Views/ManagerMoreView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ManagerMoreView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerV43Models.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerV43Models.swift#L1)

**Условия остановки зависимого среза:**

- Без явного разрешения не отправлять приглашения реальным адресатам.
- Не подменять локальное hide серверным unsubscribe и не менять notification contracts неявно.

**Условие выпуска:** G1; G3; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-16](AUDIT_REPORT_RU.md#ios-16).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-20`.

## V2-IOS-21

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-21).

**Согласовать Manager documents, issue DTO и decision права**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Открыть доказательство и выполнить разрешённое решение

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M. **Порядок DAG:** 47.

**Роли:** Manager.

**Экраны / семейства:** DocumentsHub; Project documents; ProjectIssuesForProject; ManagerCreateIssue/IssueDetail.

**Основные действия:** Открыть доказательство и выполнить разрешённое решение.

**Ввод и предпосылки:** project/document/issue ID; file metadata и private URL; project-owner capability; status; actual response DTO.

**Обязательные зависимости:** [V2-IOS-02](#v2-ios-02), [V2-IOS-17](#v2-ios-17)

**Шаги реализации:**

1. Написать fixture против production ManagerIssueDTO с реальными snake response keys; подтвердить loss nullable evidence fields до узкого исправления.
2. Выбрать один decoder strategy для response DTO, не переписывать request CodingKeys и соседние уже корректные модели.
3. Документ create/upload сохраняет documentId при partial failure; retry не создаёт новую карточку.
4. Decision controls привязать к действительным project permissions и status; у другой роли показать ответственного/ожидание, сохранить server403.

**API и контракты:**

- ManagerAPI.projectDocuments/createDocument/uploadDocumentFile/previewDocument/decideDocument
- ManagerAPI.issues/patchIssueStatus/createIssue
- Document decision endpoint требует project owner; tenant owner/Manager не заменяет его автоматически

**Состояния, которые нужно сохранить или реализовать:**

- loading
- empty
- previewLoading
- uploadPending
- underReview
- decisionPending
- forbidden
- decodeError
- retry

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-21-AC-01 · NOT_RUN:** Given created_at/evidence_url/evidence_upload_session_id, Then production DTO читает их и Link появляется для разрешённого evidence.
- **V2-IOS-21-AC-02 · NOT_RUN:** Given createDocument201 + file upload failure, Then retry использует тот же documentId.
- **V2-IOS-21-AC-03 · NOT_RUN:** Given tenant Manager без project-owner права, Then приложение не обещает успешный owner decision.
- **V2-IOS-21-AC-04 · NOT_RUN:** Given document удалён/доступ отозван, Then preview показывает объяснимый отказ, не бесконечный loading.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-21-TEST-01 · NOT_RUN:** App-level production DTO unit target либо узкое извлечение shared response model; не mirror BrokenKeys.
- **V2-IOS-21-TEST-02 · NOT_RUN:** Contract fixtures upload/decode/decision statuses and denial.
- **V2-IOS-21-TEST-03 · NOT_RUN:** UI QuickLook/download, upload progress, role-specific approve/reject/request_changes.

**Проверенные исходные точки:**

- [ios/AiStroykaManager/AiStroykaManager/Views/DocumentsHubView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/DocumentsHubView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Views/ProjectDetailView.swift:694](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ProjectDetailView.swift#L694)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift:518](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift#L518)
- [ios/Shared/Sources/Shared/APIClient.swift:27](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/APIClient.swift#L27)
- [ios/Shared/Tests/SharedTests/ManagerAPIDecodeStrategyTests.swift:37](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Tests/SharedTests/ManagerAPIDecodeStrategyTests.swift#L37)

**Условия остановки зависимого среза:**

- Если фактический DTO test опровергнет inference, снять IOS-12 и не менять decoder без причины.
- Нельзя направить Customer на внутренний documents endpoint или повысить Manager до owner ради UI.

**Условие выпуска:** G1; G3; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-12](AUDIT_REPORT_RU.md#ios-12).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-21`.

## V2-IOS-23

**Интеграция 20.10.2026:** Phase 1; AIS-EVID-002, AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-23).

**Разделить бюджет и физический прогресс во всех Manager выходах**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Оценить расходы и подтверждённый прогресс без подмены смысла

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M. **Порядок DAG:** 48.

**Роли:** Manager.

**Экраны / семейства:** ProjectAnalytics; Project overview KPI; PDF / Share.

**Основные действия:** Оценить расходы и подтверждённый прогресс без подмены смысла.

**Ввод и предпосылки:** planned/actual budget; currency; physical quantity/unit/source; time coverage; updatedAt; unknown/null.

**Обязательные зависимости:** [V2-IOS-01](#v2-ios-01)

**Шаги реализации:**

1. Отделить SpendRatio и PhysicalProgress в модели; actual/planned подписать как израсходованный бюджет.
2. Пока физический источник не определён, показывать unknown и объяснимую единицу/coverage, не fallback percentage.
3. PDF использует ту же модель и labels, currency/freshness; overrun не скрывается clamp до100%.
4. Live и preview series явно разделить; не создавать временную историю из одного текущего значения.

**API и контракты:**

- ManagerAPI.projectEstimate/projectSummary
- Physical progress только из принятого task/evidence contract; не из spending ratio

**Состояния, которые нужно сохранить или реализовать:**

- budgetKnown
- physicalUnknown
- partialCoverage
- mixedCurrency
- loading
- stale
- error
- exportReady

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-23-AC-01 · NOT_RUN:** Given actual80/planned100, Then показано80% освоения бюджета, не80% строительной готовности.
- **V2-IOS-23-AC-02 · NOT_RUN:** Given actual125/planned100, Then перерасход виден и не обрезан до100% без объяснения.
- **V2-IOS-23-AC-03 · NOT_RUN:** Given mixed currency или unknown physical, Then итог не выглядит как единая подтверждённая сумма/процент.
- **V2-IOS-23-AC-04 · NOT_RUN:** Given PDF export, Then значения/названия совпадают с UI и audience.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-23-TEST-01 · NOT_RUN:** Production metrics fixture null/zero/decimal/overrun/currency.
- **V2-IOS-23-TEST-02 · NOT_RUN:** PDF content verification с актуальной моделью; один визуальный export review.
- **V2-IOS-23-TEST-03 · NOT_RUN:** UI stale/error/empty и large text.

**Проверенные исходные точки:**

- [ios/AiStroykaManager/AiStroykaManager/Views/ProjectAnalyticsView.swift:72](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ProjectAnalyticsView.swift#L72)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerV43Models.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerV43Models.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift#L1)
- [ios/Shared/Sources/Shared/ManagerV43Formatters.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/ManagerV43Formatters.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Views/ProjectDetailView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ProjectDetailView.swift#L1)

**Условия остановки зависимого среза:**

- Нет данных для physical progress — не вычислять его из числа фото или spending.
- Не переносить внутренний бюджет на Customer поверхности.

**Условие выпуска:** G1; G3; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-08](AUDIT_REPORT_RU.md#ios-08), [IOS-02](AUDIT_REPORT_RU.md#ios-02).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-23`.

## V2-WEB-02

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-02).

**Открытие задачи из Canon board и восстановление контекста**

**P1 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Нажатие карточки открывает detail/inspector с корректным URL и возвратом.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** S/M: 1–3 дня. **Порядок DAG:** 49.

**Экраны / семейства:** F10; F33.

**Основные действия:** Нажатие карточки открывает detail/inspector с корректным URL и возвратом..

**Обязательные зависимости:** [V2-WEB-01](#v2-web-01)

**Шаги реализации:**

1. Использовать существующий TaskDetailCanonPage/controller; выбрать responsive inspector или явный detail navigation в current Canon.
2. Сохранить task id, project/scope/page/query; Back возвращает тот же список и фокус.
3. Согласовать старый ?task= deep link с canonical task detail без молчаливого игнорирования.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-02-AC-01 · NOT_RUN:** Одна карточка открывает соответствующую задачу на desktop и phone.
- **V2-WEB-02-AC-02 · NOT_RUN:** Прямой URL, refresh, browser Back/Forward воспроизводят тот же selected context.
- **V2-WEB-02-AC-03 · NOT_RUN:** 404/403/deleted task не показывают предыдущие данные и дают понятный выход.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-02-TEST-01 · NOT_RUN:** Route builder/resolver tests для task id/filter/locale.
- **V2-WEB-02-TEST-02 · NOT_RUN:** Interaction test board card→detail→Back; forbidden/deleted fixtures.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/app/[locale]/(dashboard)/dashboard/tasks/DashboardTasksClient.tsx:555](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/tasks/DashboardTasksClient.tsx#L555)
- [apps/web/app/[locale]/(dashboard)/dashboard/tasks/[id]/page.tsx:2](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/tasks/%5Bid%5D/page.tsx#L2)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-02](AUDIT_REPORT_RU.md#web-02).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-02`.

## V2-WEB-03

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-03).

**Полный и видимый scope списка задач**

**P1 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** «Все задачи» означает явно выбранный scope; отсутствие срока и все страницы доступны.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 2–4 дня. **Порядок DAG:** 50.

**Экраны / семейства:** F10.

**Основные действия:** «Все задачи» означает явно выбранный scope; отсутствие срока и все страницы доступны..

**Обязательные зависимости:** [V2-WEB-01](#v2-web-01)

**Шаги реализации:**

1. Отделить default report/date filters от task filters; задать явное отсутствие date bound, а не удалять query к скрытому default.
2. Показать активные filters и reset; pagination/load-more реализовать и в Canon board.
3. Серверно определить overdue/review scope либо явно показать, что фильтр текущей выборки ограничен; избегать двух независимых router.replace при reset.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-03-AC-01 · NOT_RUN:** Fixtures: >25 tasks, due в прошлом больше7 дней, future due, null due — каждая доступна при All.
- **V2-WEB-03-AC-02 · NOT_RUN:** Overdue count и список отражают один и тот же server scope; UI показывает from/to только когда они заданы.
- **V2-WEB-03-AC-03 · NOT_RUN:** Изменение pageSize и reset не теряет другие параметры; смена дня в долгой сессии обновляет today.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-03-TEST-01 · NOT_RUN:** Repository/filter contract tests на null/from/to/limit/offset.
- **V2-WEB-03-TEST-02 · NOT_RUN:** Playwright fixture list/board pages and URL restore; active filters aria-label.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/lib/cockpit/useFilterParams.ts:20](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/cockpit/useFilterParams.ts#L20)
- [apps/web/app/[locale]/(dashboard)/dashboard/tasks/DashboardTasksClient.tsx:154](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/tasks/DashboardTasksClient.tsx#L154)
- [apps/web/lib/domain/tasks/task.repository.ts:183](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/tasks/task.repository.ts#L183)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-03](AUDIT_REPORT_RU.md#web-03).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-03`.

## V2-WEB-04

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-04).

**Восстановление task mutations и частичного создания**

**P1 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Пользователь знает, сохранена ли задача/назначение/статус, и повторяет только неуспешную часть.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 2–4 дня. **Порядок DAG:** 51.

**Экраны / семейства:** F10.

**Основные действия:** Пользователь знает, сохранена ли задача/назначение/статус, и повторяет только неуспешную часть..

**Обязательные зависимости:** [V2-CON-01](#v2-con-01)

**Шаги реализации:**

1. Ввести per-command pending/error/success и заблокировать дублирующий submit.
2. Проверить assign response после create; при partial success сохранить createdTaskId и предложить повтор назначения.
3. Отобразить 401/403/409/422/5xx/network с понятным recovery; обновлять query cache по подтверждённому результату.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-04-AC-01 · NOT_RUN:** Create success+assign403 оставляет доступную созданную задачу и видимую ошибку назначения; retry не делает второй POST create.
- **V2-WEB-04-AC-02 · NOT_RUN:** Status/priority/assign error не имитирует сохранение; input и chosen worker сохранены.
- **V2-WEB-04-AC-03 · NOT_RUN:** Смена route/unmount не теряет принятое сервером действие и не показывает stale task data.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-04-TEST-01 · NOT_RUN:** Meaningful fault injection на create→assign partial success; double-click; offline error; version conflict.
- **V2-WEB-04-TEST-02 · NOT_RUN:** Task detail/chat/media regression по существующим API, без production mutation.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/app/[locale]/(dashboard)/dashboard/tasks/DashboardTasksClient.tsx:217](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/tasks/DashboardTasksClient.tsx#L217)
- [apps/web/app/[locale]/(dashboard)/dashboard/tasks/[id]/DashboardTaskDetailClient.tsx:116](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/tasks/%5Bid%5D/DashboardTaskDetailClient.tsx#L116)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-04](AUDIT_REPORT_RU.md#web-04).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-04`.

## V2-WEB-06

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-06).

**Отделить lifecycle проекта от его риска**

**P1 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Вкладки и header показывают реальный lifecycle; risk остаётся отдельным индикатором.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** S: 1–2 дня. **Порядок DAG:** 52.

**Экраны / семейства:** F08; F09.

**Основные действия:** Вкладки и header показывают реальный lifecycle; risk остаётся отдельным индикатором..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Привязать all/active/paused/completed predicates/count к projectStatus из контрактного источника.
2. Для отсутствующего статуса показывать unknown; не выбирать healthy default для lifecycle.
3. Header badge и card/list label используют один lifecycle adapter.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-06-AC-01 · NOT_RUN:** Active+critical остаётся в Active; completed+healthy только Completed; paused+low risk только Paused.
- **V2-WEB-06-AC-02 · NOT_RUN:** Tab count, pagination и visible rows согласованы.
- **V2-WEB-06-AC-03 · NOT_RUN:** Отсутствие portfolio/control не меняет lifecycle проекта на completed.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-06-TEST-01 · NOT_RUN:** Parameterized lifecycle×risk fixtures; real read-only list/detail after implementation.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/canon/DashboardProjectsCanonGrid.tsx:59](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/DashboardProjectsCanonGrid.tsx#L59)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/DashboardProjectDetailClient.tsx#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-06](AUDIT_REPORT_RU.md#web-06).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-06`.

## V2-WEB-07

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-07).

**Не превращать отказ загрузки в здоровый проект**

**P1 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Каждый главный блок различает отсутствие данных, отказ и актуальный подтверждённый ноль.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 3–5 дней. **Порядок DAG:** 53.

**Экраны / семейства:** F07; F09; F16; F18.

**Основные действия:** Каждый главный блок различает отсутствие данных, отказ и актуальный подтверждённый ноль..

**Обязательные зависимости:** [V2-ARCH-02](#v2-arch-02)

**Шаги реализации:**

1. Нормализовать fetch helpers в typed success/error/partial; первыми portfolio, summary, documents, schedule, inbox.
2. Рендерить локальные error/retry и partial freshness, сохраняя успешные соседние блоки.
3. Заменить hardcoded system OK и default healthy на статус с источником/временем либо нейтральную подпись.
4. Не стирать существующие ReportPublication error/conflict/version механизмы.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-07-AC-01 · NOT_RUN:** 500 summary не рисует 0 reports/low risk как факт; 200 пустой ответ даёт genuine empty.
- **V2-WEB-07-AC-02 · NOT_RUN:** 403 и expired session ведут в соответствующее recovery; сеть offline показывает последнюю допустимую версию как stale.
- **V2-WEB-07-AC-03 · NOT_RUN:** Повтор загрузки обновляет только успешные данные; race old response не перезаписывает новый project.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-07-TEST-01 · NOT_RUN:** Fault injection каждого важного helper !ok/network/partial.
- **V2-WEB-07-TEST-02 · NOT_RUN:** Screenshot states при отключении одного endpoint и всего network; bounded retry без request storm.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/canon/canon-live-data.ts:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/canon-live-data.ts#L8)
- [apps/web/components/canon/DashboardCanonHome.tsx:373](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/DashboardCanonHome.tsx#L373)
- [apps/web/components/canon/ProjectCommandCenterOverview.tsx:281](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/ProjectCommandCenterOverview.tsx#L281)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx:74](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/DashboardProjectDetailClient.tsx#L74)
- [apps/web/components/canon/CanonFooterBar.tsx:40](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/CanonFooterBar.tsx#L40)
- [apps/web/app/[locale]/(dashboard)/dashboard/support/SupportClient.tsx:41](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/support/SupportClient.tsx#L41)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-07](AUDIT_REPORT_RU.md#web-07).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-07`.

## V2-WEB-08

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001, AIS-OWNER-001, AIS-EVID-002; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-08).

**Вернуть входы к существующим project capabilities**

**P1 · WEB · INTEGRATION · PROPOSED / NOT_RUN**

**Результат:** Все действующие manager jobs достижимы из project workspace и существующих notifications/review packs.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M/L: 4–7 дней. **Порядок DAG:** 54.

**Экраны / семейства:** F09; F26; F34; F36; F37; F39.

**Основные действия:** Все действующие manager jobs достижимы из project workspace и существующих notifications/review packs..

**Обязательные зависимости:** [V2-ARCH-01](#v2-arch-01)

**Шаги реализации:**

1. Составить capability→current module→entrypoint map для8 потерянных manager panels; не монтировать старую страницу целиком.
2. Подключить минимальные sections для portal enable/preview, stakeholder invite/revoke, client requests, discussions/service list, issues, proof pack и commercial context.
3. Нормализовать issues/commercial legacy tab aliases; по возможности сохранить exact entity id.
4. Сгруппировать secondary project navigation без скрытия поддерживаемых actions и без отмены current16tabs.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-08-AC-01 · NOT_RUN:** Producer URLs из notifications/timeline/attention/review pack больше не падают в unrelated overview.
- **V2-WEB-08-AC-02 · NOT_RUN:** Manager может открыть invitation/revoke, issue, service/discussion list и proof pack из проекта.
- **V2-WEB-08-AC-03 · NOT_RUN:** CustomerEstimatesManagerPanel продолжает работать в existing Estimate area; internal/customer finance boundaries сохранены.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-08-TEST-01 · NOT_RUN:** Registry producer/consumer route contract tests; role-aware action inventory.
- **V2-WEB-08-TEST-02 · NOT_RUN:** Authenticated staging click-through каждого восстановленного entry; no destructive/revoke production test.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/DashboardProjectDetailClient.tsx#L24)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/project-detail-tabs.ts:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/project-detail-tabs.ts#L25)
- [apps/web/app/[locale]/(dashboard)/dashboard/notifications/notifications-workspace.utils.ts:77](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/notifications/notifications-workspace.utils.ts#L77)
- [apps/web/lib/domain/projects/project-timeline.repository.ts:95](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/projects/project-timeline.repository.ts#L95)
- [apps/web/lib/domain/review-packs/project-review-pack.service.ts:178](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/review-packs/project-review-pack.service.ts#L178)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectIssuesPanel.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/ProjectIssuesPanel.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectCommercialPanel.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/ProjectCommercialPanel.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/StakeholderManagerPanel.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/StakeholderManagerPanel.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ClientPortalManagerCard.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/ClientPortalManagerCard.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ServiceRequestsProjectTab.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/ServiceRequestsProjectTab.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/StakeholderDiscussionsManagerPanel.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/StakeholderDiscussionsManagerPanel.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectProofPackPanel.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/ProjectProofPackPanel.tsx#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-08](AUDIT_REPORT_RU.md#web-08).

**Канон:** Phase 1; 2; 4; 6; 8; 9; 13; AIS-PILOT-001; AIS-OWNER-001; AIS-EVID-002.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-08`.

## V2-WEB-12

**Интеграция 20.10.2026:** Phase 6; AIS-EVID-002, AIS-VISION-003; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-12).

**Source-aware просмотр отчёта и доказательств**

**P1 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Проверяющий выбирает любое attachment и видит настоящий смысл before/after, единицы и этап review.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 3–5 дней. **Порядок DAG:** 55.

**Экраны / семейства:** F11; F40.

**Основные действия:** Проверяющий выбирает любое attachment и видит настоящий смысл before/after, единицы и этап review..

**Обязательные зависимости:** [V2-ARCH-04](#v2-arch-04), [V2-CON-03](#v2-con-03)

**Условные зависимости выпуска:**

- V2-ARCH-05: только AI result area; manual evidence viewer может быть поставлен отдельно

**Шаги реализации:**

1. Сделать gallery active source selection, fullscreen для выбранного item, keyboard previous/next и альтернативы недоступному original.
2. Before/After только по сохранённой категории/паре/time с review; при одной фотографии показывать одиночное evidence.
3. Workflow progress derive из действительных данных/decision state, не констант; unit precision согласовать с quantities contract PR.
4. Сохранить DownloadAll, first4 links и existing publication expected_version/409; расширение gallery не даёт автоматической публикации.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-12-AC-01 · NOT_RUN:** 1/2/7+ attachments доступны без назначения ложной пары; выбор меняет fullscreen source.
- **V2-WEB-12-AC-02 · NOT_RUN:** AI queued/failed/no job/success-without-result различаются; reviewed/stale result содержит источник.
- **V2-WEB-12-AC-03 · NOT_RUN:** Approve report не публикует photos молча; повтор publish использует существующий version contract.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-12-TEST-01 · NOT_RUN:** Media gallery state tests; role/source-original revoked fixtures.
- **V2-WEB-12-TEST-02 · NOT_RUN:** Report review+publication staging fixture after #446/#448/#449 reconciliation; popup/keyboard/mobile checks.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/canon/ReportReviewCanonView.tsx:71](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/ReportReviewCanonView.tsx#L71)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-12](AUDIT_REPORT_RU.md#web-12).

**Канон:** Phase 6; 7; 13; AIS-EVID-002; AIS-VISION-003.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-12`.

## V2-WEB-15

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-15).

**Сохранение сведений при создании проекта**

**P2 · WEB · CONTRACTED_ENHANCEMENT · PROPOSED / NOT_RUN**

**Результат:** Созданный project brief имеет явный и восстанавливаемый контракт сохранения.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 2–4 дня (без неконтролируемой migration). **Порядок DAG:** 56.

**Экраны / семейства:** F08.

**Основные действия:** Созданный project brief имеет явный и восстанавливаемый контракт сохранения..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Сверить текущие project metadata fields/server schema и открытый PR; переиспользовать существующие поля, если они уже есть.
2. При approved additive contract сохранять адрес/клиента/notes отдельно; убрать sessionStorage-only write без reader.
3. Пока contract не принят, сократить форму до реально сохраняемых полей или дать явное recoverable local draft; не имитировать server persistence.
4. Проверять длину до обрезания и показать пользователю корректирующее действие.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-15-AC-01 · NOT_RUN:** Каждое принятое поле доступно после reload и authorized readback в своём scope.
- **V2-WEB-15-AC-02 · NOT_RUN:** Длинное название не обрезается незаметно; failure сохраняет ввод.
- **V2-WEB-15-AC-03 · NOT_RUN:** Старые composed names корректно отображаются, массовая migration не выполняется автоматически.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-15-TEST-01 · NOT_RUN:** POST/GET roundtrip contract test; form reload/long-text/partial failure.
- **V2-WEB-15-TEST-02 · NOT_RUN:** Другой разрешённый участник видит server-persisted brief без личных draft данных.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/app/[locale]/(dashboard)/projects/CreateProjectForm.tsx:48](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/projects/CreateProjectForm.tsx#L48)
- [apps/web/messages/ru.json:1026](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/messages/ru.json#L1026)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-15](AUDIT_REPORT_RU.md#web-15).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-15`.


# M04 — Заказчик, документы и опубликованные решения

## V2-IOS-24

**Интеграция 20.10.2026:** Phase 2; AIS-OWNER-002, AIS-OWNER-001; release scope `CUSTOMER`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-24).

**Дать Customer полный разрешённый список и понятный project context**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Найти свой проект и каждую требующую действия запись

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M. **Порядок DAG:** 57.

**Роли:** Customer.

**Экраны / семейства:** CustomerHome; CustomerProjectDetail progress/activity/requests/documents; Logout / project switch.

**Основные действия:** Найти свой проект и каждую требующую действия запись.

**Ввод и предпосылки:** stakeholder session; allowed portal projects; projectId; response collections/coverage; filter/search/page state.

**Обязательные зависимости:** [V2-IOS-02](#v2-ios-02), [V2-IOS-03](#v2-ios-03)

**Шаги реализации:**

1. Убрать client prefix truncation или добавить явное «Все / загрузить ещё» в рамках server coverage.
2. Выделить ожидающие действия и сохранить доступ к архиву/остальным записям; одинаково объяснять отсутствие данных и отсутствие права.
3. Сохранять project и list position при переходе в detail/action и назад.
4. Навигационные предложения Customer «Проекты / Решения / Профиль» считать proposal; не создавать Messages таб без существующего разрешённого workflow.

**API и контракты:**

- GET /api/v1/portal/projects
- GET /api/v1/portal/projects/:id; current collection limits/cursor verify

**Состояния, которые нужно сохранить или реализовать:**

- loading
- emptyMembership
- ready
- sectionEmpty
- partial
- loadMore
- filterEmpty
- errorRetry
- revoked

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-24-AC-01 · NOT_RUN:** Given 9requests/estimates/docs, Then девятая доступна через явный пользовательский путь.
- **V2-IOS-24-AC-02 · NOT_RUN:** Given 6milestones/decisions, Then UI не выдаёт первые5 за полный список.
- **V2-IOS-24-AC-03 · NOT_RUN:** Given удалено membership, Then subsequent reads закрыты и управляемое локальное состояние очищено по policy.
- **V2-IOS-24-AC-04 · NOT_RUN:** Given одной секции отказано, Then разрешённый остальной контекст не заменяется пустым успехом.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-24-TEST-01 · NOT_RUN:** DTO/list view fixtures0/1/8/9/20+ и server partial coverage.
- **V2-IOS-24-TEST-02 · NOT_RUN:** UI filter/detail/back/project switch.
- **V2-IOS-24-TEST-03 · NOT_RUN:** Staging stakeholder allow/deny и empty membership.

**Проверенные исходные точки:**

- [ios/AiStroykaCustomer/AiStroykaCustomer/Views/CustomerHomeView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/Views/CustomerHomeView.swift#L1)
- [ios/AiStroykaCustomer/AiStroykaCustomer/Views/CustomerProjectDetailView.swift:129](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/Views/CustomerProjectDetailView.swift#L129)
- [ios/AiStroykaCustomer/AiStroykaCustomer/CustomerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/CustomerAPI.swift#L1)
- [ios/AiStroykaCustomer/AiStroykaCustomer/CustomerSessionState.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/CustomerSessionState.swift#L1)
- [ios/Shared/Sources/Shared/CustomerPortalProjectView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/CustomerPortalProjectView.swift#L1)

**Условия остановки зависимого среза:**

- Не решать отсутствие списка переходом на внутренний Manager route.
- Не заявлять полноту beyond server response/cursor contract.

**Условие выпуска:** G1; G3; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-09](AUDIT_REPORT_RU.md#ios-09).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-24`.

## V2-IOS-25

**Интеграция 20.10.2026:** Phase 3; AIS-OWNER-002, AIS-OWNER-001, AIS-APPROVAL-003; release scope `CUSTOMER`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-25).

**Показывать Customer содержание версии до ответа**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Принять решение по понятным условиям и конкретной версии

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** L. **Порядок DAG:** 58.

**Роли:** Customer.

**Экраны / семейства:** Request detail; Estimate detail; Document review; Feedback / acknowledge / choice.

**Основные действия:** Принять решение по понятным условиям и конкретной версии.

**Ввод и предпосылки:** request/estimate/document ID; capability/actionMode/status; customer-safe description/instructions/note/due date; amount/currency; version; comment/choice.

**Обязательные зависимости:** [V2-IOS-24](#v2-ios-24)

**Условные зависимости выпуска:**

- V2-CON-01: если action автоматически повторяется после неизвестного результата; иначе NeedsReconciliation/readback

**Шаги реализации:**

1. Выделить detail presentation из action карточки; показать уже декодированные description/instructions/customerNote/validUntil/dueAt.
2. Связать документ и ответ с customer-safe source/version; предоставить разрешённое открытие содержания.
3. Сохранить gates для approve/reject/document_review/feedback/acknowledge/choice; предусмотреть понятный final confirmation и error recovery.
4. При изменившейся revision перечитать условия, не применять прежний ответ к новой цене/составу; использовать существующий idempotency/conflict contract или согласовать additive изменение.

**API и контракты:**

- POST portal/projects/:id/decisions/:requestId/respond
- POST projects/:id/estimates/:estimateId/respond
- Existing customer-safe read projection; version/document content contract must be verified before extension

**Состояния, которые нужно сохранить или реализовать:**

- loadingDetails
- viewable
- readOnly
- responding
- confirmed
- rejected
- needsComment
- staleVersion
- forbidden
- retryableFailure

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-25-AC-01 · NOT_RUN:** Given sent estimate с description/note/expiry, Then пользователь видит их до Approve и знает сумму/валюту.
- **V2-IOS-25-AC-02 · NOT_RUN:** Given document review request, Then доступно содержание разрешённой версии, которую подтверждают.
- **V2-IOS-25-AC-03 · NOT_RUN:** Given нет capability/actionMode не соответствует, Then action отсутствует/объяснён и backend denial сохранён.
- **V2-IOS-25-AC-04 · NOT_RUN:** Given revision changed, Then старое согласие не отправляется как согласие с новым составом.
- **V2-IOS-25-AC-05 · NOT_RUN:** Given response timeout, Then UI проверяет результат/позволяет безопасный retry и не теряет comment.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-25-TEST-01 · NOT_RUN:** Production DTO/capability matrix всех5action modes и missing capability.
- **V2-IOS-25-TEST-02 · NOT_RUN:** UI detail→confirmation→success/error, длинный RU/ES текст.
- **V2-IOS-25-TEST-03 · NOT_RUN:** Staging Customer response→Manager follow-up, stale/conflict/replay и finance-field negative fixture.

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `ios/AiStroykaCustomer/AiStroykaCustomer/Views/CustomerDecisionDetailView.swift`

**Проверенные исходные точки:**

- [ios/AiStroykaCustomer/AiStroykaCustomer/Views/CustomerProjectDetailView.swift:147](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/Views/CustomerProjectDetailView.swift#L147)
- [ios/AiStroykaCustomer/AiStroykaCustomer/CustomerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/CustomerAPI.swift#L1)
- [ios/Shared/Sources/Shared/CustomerPortalProjectView.swift:55](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/CustomerPortalProjectView.swift#L55)
- [ios/Shared/Tests/SharedTests/CustomerPortalProjectViewTests.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Tests/SharedTests/CustomerPortalProjectViewTests.swift#L1)

**Условия остановки зависимого среза:**

- Нет customer-safe document content/version endpoint — stop backend contract slice, не читать internal Manager DTO.
- Не добавлять contractor costs/budget/margin в Customer DTO и AI/PDF контекст.

**Условие выпуска:** G1; G3; G4; G5; G6

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-07](AUDIT_REPORT_RU.md#ios-07), [IOS-09](AUDIT_REPORT_RU.md#ios-09).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-25`.

## V2-IOS-26

**Интеграция 20.10.2026:** Phase 2; AIS-OWNER-002, AIS-OWNER-001, AIS-EVID-002; release scope `CUSTOMER`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-26).

**Сохранить защищённую галерею и добавить полноту просмотра**

**P2 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Открыть все явно опубликованные фотографии проекта

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M. **Порядок DAG:** 59.

**Роли:** Customer; Manager.

**Экраны / семейства:** CustomerPublishedPhotosSection; CustomerPublishedPhotoCard; Manager publication.

**Основные действия:** Открыть все явно опубликованные фотографии проекта.

**Ввод и предпосылки:** validated project/photo IDs; gateway path; source publication version; authenticated response; preview queue.

**Обязательные зависимости:** [V2-IOS-24](#v2-ios-24), [V2-IOS-19](#v2-ios-19), [V2-CON-03](#v2-con-03)

**Шаги реализации:**

1. Сохранить exact-gateway validation, authorization, no-cache handling и ограниченную preview queue; не заменить их AsyncImage с raw external URL.
2. Добавить путь к фотографии за пределами prefix9 и понятный full viewer по разрешённому contract.
3. Показать denied/removed/retry для конкретного item; перегрузка одного preview не блокирует всю страницу.
4. Определить управляемое memory/disk cache поведение при logout/revoke; не обещать удаление уже экспортированного файла.

**API и контракты:**

- GET portal/projects/:id/evidence
- Existing authenticated no-cache original gateway in CustomerPublishedEvidence/APIClient
- Manager explicit publication GET/PATCH

**Состояния, которые нужно сохранить или реализовать:**

- loading
- emptyPublished
- previewReady
- fullViewLoading
- permissionRevoked
- unsupportedMedia
- retry
- partialCollection

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-26-AC-01 · NOT_RUN:** Given 10published photos, Then десятая доступна через явный путь.
- **V2-IOS-26-AC-02 · NOT_RUN:** Given foreign project/gateway URL, Then credentials не отправляются и изображение не открывается.
- **V2-IOS-26-AC-03 · NOT_RUN:** Given revoked publication, Then новый authorized request отказан и stale app preview обработан по policy.
- **V2-IOS-26-AC-04 · NOT_RUN:** Given большой оригинал, Then preview generation не блокирует main thread и сохраняет право повторить.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-26-TEST-01 · NOT_RUN:** Сохранить и расширить production CustomerPublishedEvidenceTests для redirect/denied/type/identity.
- **V2-IOS-26-TEST-02 · NOT_RUN:** UI gallery0/1/10/error, viewer close/back.
- **V2-IOS-26-TEST-03 · NOT_RUN:** Staging publish→read→revoke→new read; отдельно TTL и внешние copies ограничения.

**Проверенные исходные точки:**

- [ios/AiStroykaCustomer/AiStroykaCustomer/Views/CustomerProjectDetailView.swift:129](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/Views/CustomerProjectDetailView.swift#L129)
- [ios/AiStroykaCustomer/AiStroykaCustomer/CustomerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/CustomerAPI.swift#L1)
- [ios/Shared/Sources/Shared/CustomerPublishedEvidence.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/CustomerPublishedEvidence.swift#L1)
- [ios/Shared/Sources/Shared/PhotoPreviewQueue.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/PhotoPreviewQueue.swift#L1)
- [ios/Shared/Sources/Shared/APIClient.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/APIClient.swift#L1)
- [ios/Shared/Tests/SharedTests/CustomerPublishedEvidenceTests.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Tests/SharedTests/CustomerPublishedEvidenceTests.swift#L1)

**Условия остановки зависимого среза:**

- Нельзя упростить gateway validation ради быстрого viewer.
- Право публикации подтверждается сервером, не только статусом approved отчёта.

**Условие выпуска:** G1; G4; G5; G6

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-09](AUDIT_REPORT_RU.md#ios-09).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-26`.

## V2-IOS-27

**Интеграция 20.10.2026:** Phase 2; AIS-CLIENT-005A, AIS-OWNER-002; release scope `CUSTOMER`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-27).

**Доработать существующий Customer intake без лишней обязательности**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Описать запрос, сохранить draft и вернуться к нему без потери ввода

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M/L. **Порядок DAG:** 60.

**Роли:** Customer.

**Экраны / семейства:** CustomerIntakeList; Create/edit form; Submit / withdraw.

**Основные действия:** Описать запрос, сохранить draft и вернуться к нему без потери ввода.

**Ввод и предпосылки:** title/description required; optional dates/location/work type/questions/media; bound projectId; editing draft/server ID; existing extra media refs.

**Обязательные зависимости:** [V2-IOS-24](#v2-ios-24), [V2-IOS-06](#v2-ios-06)

**Шаги реализации:**

1. Сохранить title/description как текущие обязательные поля; даты/URL/контекст не делать обязательными.
2. Для дат добавить native DatePicker с clear/unknown и преобразованием в API ISO date; сохранить явные null/omitted semantics при edit.
3. Локально сохранять незавершённый form; success message сохранить через load(preservingMessage:true), а failed reload не стирает успешный mutation результат.
4. Добавить список без prefix20 truncation. Camera/gallery media предлагается после подтверждения безопасного existing upload contract; mergeEditedMediaURL и дополнительные refs не терять.

**API и контракты:**

- Existing portal intake list/create/update/submit/withdraw paths from CustomerIntakeDraft
- Optional media upload/source contract must be checked; current API accepts refs

**Состояния, которые нужно сохранить или реализовать:**

- editing
- locallySaved
- savingServer
- saved
- validationError
- submitting
- submitted
- withdrawing
- withdrawn
- retry
- listPartial

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-27-AC-01 · NOT_RUN:** Given только title+description, Then draft по-прежнему можно сохранить.
- **V2-IOS-27-AC-02 · NOT_RUN:** Given save succeeded, Then подтверждение остаётся видимым после refresh; failed refresh не становится failed save.
- **V2-IOS-27-AC-03 · NOT_RUN:** Given editing draft с несколькими refs, Then изменение одного input не удаляет остальные mediaId/url references.
- **V2-IOS-27-AC-04 · NOT_RUN:** Given process restart, Then локальный ввод восстанавливается в том же bound project.
- **V2-IOS-27-AC-05 · NOT_RUN:** Given 21draft, Then он доступен через полный список/continuation.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-27-TEST-01 · NOT_RUN:** Production CustomerIntakeDraftTests по merge refs, clear date/null, project binding сохранить.
- **V2-IOS-27-TEST-02 · NOT_RUN:** View model tests save201+reload500, validation and submit/withdraw message preservation.
- **V2-IOS-27-TEST-03 · NOT_RUN:** UI DatePicker/clear, form focus, large text, Back/discard и реальный staging draft.

**Проверенные исходные точки:**

- [ios/AiStroykaCustomer/AiStroykaCustomer/Views/CustomerIntakeListView.swift:164](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/Views/CustomerIntakeListView.swift#L164)
- [ios/AiStroykaCustomer/AiStroykaCustomer/CustomerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/CustomerAPI.swift#L1)
- [ios/Shared/Sources/Shared/CustomerIntakeDraft.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/CustomerIntakeDraft.swift#L1)
- [ios/Shared/Tests/SharedTests/CustomerIntakeDraftTests.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Tests/SharedTests/CustomerIntakeDraftTests.swift#L1)

**Условия остановки зависимого среза:**

- Не использовать Worker upload allow-list/profile для Customer как shortcut.
- Если portal upload не разрешён, закончить dates/recovery/list slice и обозначить media addition BLOCKED_CONTRACT.

**Условие выпуска:** G1; G2; G3; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-11](AUDIT_REPORT_RU.md#ios-11), [IOS-09](AUDIT_REPORT_RU.md#ios-09).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-27`.

## V2-WEB-09

**Интеграция 20.10.2026:** Phase 3; AIS-OWNER-001, AIS-PILOT-001; release scope `CUSTOMER`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-09).

**Замкнуть документное согласование из inbox**

**P1 · WEB · INTEGRATION · PROPOSED / NOT_RUN**

**Результат:** Разрешённый project owner открывает нужный документ/версию из inbox и принимает решение.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 3–5 дней. **Порядок DAG:** 61.

**Экраны / семейства:** F13; F34.

**Основные действия:** Разрешённый project owner открывает нужный документ/версию из inbox и принимает решение..

**Обязательные зависимости:** [V2-ARCH-01](#v2-arch-01)

**Шаги реализации:**

1. Передавать documentId и допустимый source version в href/selection state.
2. Переиспользовать OwnerViewClient decision handlers/controller и existing single/bulk API в reachable document review surface.
3. Серверные capabilities определяют действия; не менять requireProjectOwner на tenant admin ради удобства.
4. После решения обновлять inbox, document и attention; back возвращает исходный filter.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-09-AC-01 · NOT_RUN:** Каждый inbox document открывает именно его preview и разрешённые decision controls.
- **V2-WEB-09-AC-02 · NOT_RUN:** Tenant admin без project owner membership не может принять документ; UI объясняет роль.
- **V2-WEB-09-AC-03 · NOT_RUN:** Concurrent change и partial bulk получают отдельные результаты; accepted states подтверждены readback.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-09-TEST-01 · NOT_RUN:** Project role matrix owner/manager/internal/stakeholder/platform owner; source revision conflict.
- **V2-WEB-09-TEST-02 · NOT_RUN:** Inbox→document→approve/reject/request changes→return на controlled staging fixtures.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/app/[locale]/(dashboard)/dashboard/approvals/approvals-workspace.utils.ts:54](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/approvals/approvals-workspace.utils.ts#L54)
- [apps/web/components/canon/ProjectDocumentsCanonPanel.tsx:91](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/ProjectDocumentsCanonPanel.tsx#L91)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/OwnerViewClient.tsx:194](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/OwnerViewClient.tsx#L194)
- [apps/web/app/api/v1/projects/[id]/documents/[documentId]/decision/route.ts:33](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/projects/%5Bid%5D/documents/%5BdocumentId%5D/decision/route.ts#L33)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-09](AUDIT_REPORT_RU.md#web-09).

**Канон:** Phase 2; 3; 13; AIS-OWNER-001; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-09`.

## V2-WEB-10

**Интеграция 20.10.2026:** Phase 2; AIS-OWNER-001, AIS-PILOT-001; release scope `CUSTOMER`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-10).

**Отдельный разрешённый shell клиентского портала**

**P1 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Customer/stakeholder получает навигацию, поиск, помощь, logout и handover в рамках своего доступа.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 3–5 дней. **Порядок DAG:** 62.

**Экраны / семейства:** F20; F21; F16; F19.

**Основные действия:** Customer/stakeholder получает навигацию, поиск, помощь, logout и handover в рамках своего доступа..

**Обязательные зависимости:** [V2-ARCH-01](#v2-arch-01), [V2-ARCH-07](#v2-arch-07)

**Шаги реализации:**

1. Добавить portal capabilities в shell/topbar/bell/footer вместо общего internal navigation.
2. Logout и смена identity доступны на desktop/phone; mobile active item соответствует actual section.
3. Разрешённый handover entry ведёт в customer-safe pack projection; не расширять middleware allowlist на внутренний namespace целиком.
4. Обновить notification targets и пустые anchors для отсутствующих approvals/docs.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-10-AC-01 · NOT_RUN:** Portal-only user не видит tasks/help/support/internal handover CTA, который немедленно возвращает его домой.
- **V2-WEB-10-AC-02 · NOT_RUN:** Logout удаляет сессию и не оставляет cached protected data; active nav однозначна.
- **V2-WEB-10-AC-03 · NOT_RUN:** Readonly customer, responding stakeholder и internal preview имеют соответствующие capabilities и finance projection.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-10-TEST-01 · NOT_RUN:** Policy/path resolver negatives; portal role screenshot matrix and keyboard flow.
- **V2-WEB-10-TEST-02 · NOT_RUN:** Invite→portal→project→document/decision→logout on staging.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/DashboardShell.tsx:44](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/DashboardShell.tsx#L44)
- [apps/web/components/canon/CanonTopBar.tsx:44](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/CanonTopBar.tsx#L44)
- [apps/web/lib/tenant/stakeholder-dashboard-paths.ts:47](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/tenant/stakeholder-dashboard-paths.ts#L47)
- [apps/web/components/canon/ClientPortalCanonView.tsx:84](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/ClientPortalCanonView.tsx#L84)
- [apps/web/components/canon/CanonPortalBottomNav.tsx:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/CanonPortalBottomNav.tsx#L8)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-10](AUDIT_REPORT_RU.md#web-10).

**Канон:** Phase 2; 9; 13; AIS-OWNER-001; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-10`.

## V2-WEB-16

**Интеграция 20.10.2026:** Phase 6; AIS-PILOT-001, AIS-EVID-002; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-16).

**Надёжное создание документа и честная ссылка доступа**

**P2 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Невалидный файл не создаёт запись; повтор upload использует тот же documentId; share semantics ясны.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 2–4 дня. **Порядок DAG:** 63.

**Экраны / семейства:** F34.

**Основные действия:** Невалидный файл не создаёт запись; повтор upload использует тот же documentId; share semantics ясны..

**Обязательные зависимости:** [V2-CON-01](#v2-con-01)

**Шаги реализации:**

1. Проверить size/type/title до POST document; удержать created document id при upload failure.
2. Ввести состояния validation→created→uploading→uploaded или retry upload; при необходимости reconcile orphan drafts через существующие APIs, не удалять их вслепую.
3. Review mutation error вывести в preview; copy link подписать как internal authorized link.
4. Публичный доступ предлагать только через existing scoped Proof Pack/share flow.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-16-AC-01 · NOT_RUN:** Oversize file делает0 POST document; upload500 после create даёт1 document и retry upload без нового POST.
- **V2-WEB-16-AC-02 · NOT_RUN:** Создание с закрытием/reopen формы не теряет известный server result.
- **V2-WEB-16-AC-03 · NOT_RUN:** Другой пользователь без project access не открывает copied original URL; UI не обещает иначе.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-16-TEST-01 · NOT_RUN:** Failure-at-each-step mutation tests; double submit, cancel, retry.
- **V2-WEB-16-TEST-02 · NOT_RUN:** Original access/revoked fixtures; document preview error focus.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/canon/ProjectDocumentsCanonPanel.tsx:228](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/ProjectDocumentsCanonPanel.tsx#L228)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/project-documents.api.ts:25](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/project-documents.api.ts#L25)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-16](AUDIT_REPORT_RU.md#web-16).

**Канон:** Phase 2; 6; 13; AIS-PILOT-001; AIS-EVID-002.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-16`.

## V2-WEB-23

**Интеграция 20.10.2026:** Phase 2; AIS-OWNER-001, AIS-EVID-002; release scope `CUSTOMER`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-23).

**Проверить полный customer path и опубликованные источники**

**P1 · WEB · VALIDATION_AND_INTEGRATION · PROPOSED / NOT_RUN**

**Результат:** Существующий customer portal проходит invite→project→published evidence→document/decision→revocation.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 3–5 дней. **Порядок DAG:** 64.

**Экраны / семейства:** F06; F20; F21; F22; F23; F38; F11.

**Основные действия:** Существующий customer portal проходит invite→project→published evidence→document/decision→revocation..

**Обязательные зависимости:** [V2-WEB-09](#v2-web-09), [V2-WEB-10](#v2-web-10)

**Шаги реализации:**

1. Продолжить AIS-OWNER-001 по существующим portal DTO и publication controls; не создавать второй Customer продукт.
2. Составить role scenario matrix: readonly, canRespond, revoked, internal preview, wrong project.
3. Проверить полный доступный список docs/media/decisions, next actions и отсутствие разрыва у пустых anchors; исправлять только воспроизведённые gaps.
4. Подтвердить cache invalidation и видимость originals после publish/withdraw/revoke.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-23-AC-01 · NOT_RUN:** Авторизованный customer видит только опубликованные выбранные evidence; title/status/full preview связаны с версией.
- **V2-WEB-23-AC-02 · NOT_RUN:** Readonly actor не получает response mutation; revoked actor теряет list, detail, original и cached derived view.
- **V2-WEB-23-AC-03 · NOT_RUN:** Customer-visible estimates/AI/export/notification preview не содержат internal costs/margin.
- **V2-WEB-23-AC-04 · NOT_RUN:** Every changed source marks old reviewed output stale where contract requires; no silent success.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-23-TEST-01 · NOT_RUN:** Existing customer-finance/publication tests + targeted staging role flow on synthetic fixtures.
- **V2-WEB-23-TEST-02 · NOT_RUN:** Screenshots of real portal home/list/detail/empty/error; original download revocation checks.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/client/ClientPortalViewClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/client/ClientPortalViewClient.tsx#L1)
- [apps/web/components/canon/ClientPortalCanonView.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/ClientPortalCanonView.tsx#L1)
- [apps/web/components/canon/PortalCanonProjectsList.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/PortalCanonProjectsList.tsx#L1)
- [apps/web/components/canon/ReportPublicationControls.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/ReportPublicationControls.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/stakeholder-invite/StakeholderInviteCanonPage.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/stakeholder-invite/StakeholderInviteCanonPage.tsx#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** Validation/integration completion текущего scope.

**Канон:** Phase 0; 2; 3; 4; 6; 13; AIS-OWNER-001; AIS-EVID-002.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-23`.

## V2-WEB-24

**Интеграция 20.10.2026:** Phase 3; AIS-OWNER-001, AIS-EVID-002; release scope `CUSTOMER`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-24).

**Межролевые списки и детали без потери сообщения или решения**

**P2 · WEB · VALIDATION_AND_INTEGRATION · PROPOSED / NOT_RUN**

**Результат:** Manager и customer завершают один lifecycle change-order/defect/discussion/aftercare, сохраняя собственную projection.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M/L: 4–6 дней. **Порядок DAG:** 65.

**Экраны / семейства:** F22; F23; F24; F25; F26; F36; F38.

**Основные действия:** Manager и customer завершают один lifecycle change-order/defect/discussion/aftercare, сохраняя собственную projection..

**Обязательные зависимости:** [V2-WEB-08](#v2-web-08), [V2-ARCH-07](#v2-arch-07)

**Условные зависимости выпуска:**

- V2-CON-01: если action автоматически повторяется после неизвестного результата; иначе NeedsReconciliation/readback

**Шаги реализации:**

1. После восстановления entrypoints проверить list→detail→allowed mutation→counterparty readback для каждого из4 доменов.
2. Переиспользовать existing lifecycle/actions/messages APIs; отделить operational issue от project defect и commercial decision от document approval.
3. Добавить context-preserving Back и отображение pending/error/conflict, где controlled test найдёт gap.
4. Не посылать внешних сообщений без явного user submit; notification preview фильтровать по audience.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-24-AC-01 · NOT_RUN:** Нет detail route без входа из своей family; links из notifications приводят в correct object.
- **V2-WEB-24-AC-02 · NOT_RUN:** Double submit/retry не дублирует accepted message/decision; denied transition отображается как denied.
- **V2-WEB-24-AC-03 · NOT_RUN:** Customer видит допустимую commercial version; internal discussion/finance не просачивается.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-24-TEST-01 · NOT_RUN:** Lifecycle fixture matrix per domain; both roles after mutation; same-entity refresh/back.
- **V2-WEB-24-TEST-02 · NOT_RUN:** Role negatives, revoked session, upload unavailable, partial thread failure.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/change-orders/[changeOrderId]/ManagerChangeOrderDetailClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/change-orders/%5BchangeOrderId%5D/ManagerChangeOrderDetailClient.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/defects/[defectId]/ManagerDefectDetailClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/defects/%5BdefectId%5D/ManagerDefectDetailClient.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/discussions/[discussionId]/ManagerDiscussionDetailClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/discussions/%5BdiscussionId%5D/ManagerDiscussionDetailClient.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/service-requests/[requestId]/ManagerServiceRequestDetailClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/service-requests/%5BrequestId%5D/ManagerServiceRequestDetailClient.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/StakeholderDiscussionsManagerPanel.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/StakeholderDiscussionsManagerPanel.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ServiceRequestsProjectTab.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/ServiceRequestsProjectTab.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectDecisionsPanel.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/ProjectDecisionsPanel.tsx#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-08](AUDIT_REPORT_RU.md#web-08).

**Канон:** Phase 2; 3; 4; 5; 8; 9; 13; AIS-OWNER-001; AIS-EVID-002.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-24`.

## V2-WEB-25

**Интеграция 20.10.2026:** Phase 6; AIS-PILOT-001, AIS-EVID-002; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-25).

**Завершить проверку сохранения и подтверждения daily log**

**P1 · WEB · VALIDATION_AND_INTEGRATION · PROPOSED / NOT_RUN**

**Результат:** Existing daily-log draft→confirm можно надёжно продолжить после навигации или сбоя.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 2–4 дня. **Порядок DAG:** 66.

**Экраны / семейства:** F12.

**Основные действия:** Existing daily-log draft→confirm можно надёжно продолжить после навигации или сбоя..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Сверить PR #353 и текущие merged изменения; не начинать параллельный draft persistence rewrite.
2. Пройти create/edit/reload/back/confirm с activities, crew, materials, events и source refs.
3. Различить local draft, server draft, confirmed record и AI interpretation; confirmed stamp остаётся серверным.
4. Исправлять только воспроизведённые state/recovery gaps с сохранением source lineage.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-25-AC-01 · NOT_RUN:** Accepted server draft восстанавливается по той же дате/project/log id.
- **V2-WEB-25-AC-02 · NOT_RUN:** Повтор confirm не создаёт второй журнал/работу; unauthorized/foreign project не подтверждается.
- **V2-WEB-25-AC-03 · NOT_RUN:** Conflict/revoked/offline не стирают несохранённый ввод без объяснения; provenance доступен review.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-25-TEST-01 · NOT_RUN:** Existing service/form/UI/RLS tests; targeted draft recovery and idempotent confirm integration.
- **V2-WEB-25-TEST-02 · NOT_RUN:** Staging field-log screen capture with known synthetic source.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/app/[locale]/(dashboard)/projects/ProjectFieldDailyLogPanel.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/projects/ProjectFieldDailyLogPanel.tsx#L1)
- [apps/web/lib/domain/field-daily-log/field-daily-log-form.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/field-daily-log/field-daily-log-form.ts#L1)
- [apps/web/lib/domain/field-daily-log/field-daily-log.service.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/field-daily-log/field-daily-log.service.ts#L1)
- [apps/web/lib/domain/field-daily-log/field-daily-log.repository.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/field-daily-log/field-daily-log.repository.ts#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** Validation/integration completion текущего scope.

**Канон:** Phase 1; 6; 13; AIS-PILOT-001; AIS-EVID-002.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-25`.

## V2-WEB-26

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001, AIS-MATCH-006; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-26).

**Развести people directory и управление доступом**

**P2 · WEB · VALIDATION_AND_INTEGRATION · PROPOSED / NOT_RUN**

**Результат:** Работник, подрядчик, tenant member и invitation имеют понятные роли и корректные действия.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 2–4 дня. **Порядок DAG:** 67.

**Экраны / семейства:** F14; F06.

**Основные действия:** Работник, подрядчик, tenant member и invitation имеют понятные роли и корректные действия..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Проверить каталог/search/filter/pagination и detail/history для workers и contractors.
2. Team administration выделить как управление доступом; назвать роль/проект/срок приглашения перед отправкой.
3. Сохранить защиту owner/last admin; revocation отображается после server readback.
4. Добавить текст к color status и честные no-project/no-days/no-matching-filters states.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-26-AC-01 · NOT_RUN:** Directory links не обещают роль администратора; profile/history показывают один user id.
- **V2-WEB-26-AC-02 · NOT_RUN:** Invite/revoke/change role доступны только разрешённой роли, denied mutation объясняется.
- **V2-WEB-26-AC-03 · NOT_RUN:** Expired invite и already member имеют отдельные next steps; повтор invite не создаёт неверный success.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-26-TEST-01 · NOT_RUN:** Tenant/project role matrix; owner protection; directory pagination and empty filters.
- **V2-WEB-26-TEST-02 · NOT_RUN:** Staging synthetic invite/revoke; no production external message during audit.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/canon/DashboardTeamCanonPage.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/DashboardTeamCanonPage.tsx#L1)
- [apps/web/components/canon/DashboardContractorsCanonPage.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/DashboardContractorsCanonPage.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/team/TeamPageClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/team/TeamPageClient.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/workers/[userId]/WorkerDetailCanonPage.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/workers/%5BuserId%5D/WorkerDetailCanonPage.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/workers/[userId]/days/WorkerDaysCanonPage.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/workers/%5BuserId%5D/days/WorkerDaysCanonPage.tsx#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** Validation/integration completion текущего scope.

**Канон:** Phase 1; 11; 13; AIS-PILOT-001; AIS-MATCH-006.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-26`.

## V2-WEB-29

**Интеграция 20.10.2026:** Phase 0; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-29).

**Проверить tenant admin и platform admin как разные продукты**

**P2 · WEB · VALIDATION_AND_INTEGRATION · PROPOSED / NOT_RUN**

**Результат:** Администратор организации и платформенный оператор получают правильный scope, доступ и устойчивые панели.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M/L: 3–5 дней. **Порядок DAG:** 68.

**Экраны / семейства:** F28; F29.

**Основные действия:** Администратор организации и платформенный оператор получают правильный scope, доступ и устойчивые панели..

**Обязательные зависимости:** [V2-ARCH-02](#v2-arch-02), [V2-ARCH-07](#v2-arch-07)

**Шаги реализации:**

1. Пройти все11 tenant admin pages и5 canonical platform pages +4aliases по source/action registry и controlled role fixtures.
2. Разделить all-or-nothing console reads на independent resource states там, где это не ослабляет security gate.
3. Перед job/push/operator/billing/support mutation показывать affected scope, pending и authoritative result.
4. Сохранить platform grant/freshness/IP/host/surface/tier/step-up; не переносить customer Owner View в этот shell.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-29-AC-01 · NOT_RUN:** Tenant owner без platform grant получает denied на platform routes/API.
- **V2-WEB-29-AC-02 · NOT_RUN:** Один unavailable diagnostics endpoint не скрывает разрешённые healthy sections, но auth failure закрывает protected data.
- **V2-WEB-29-AC-03 · NOT_RUN:** Refresh/page/action URL не меняет tenant/object scope; logs не содержат secrets.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-29-TEST-01 · NOT_RUN:** Admin/platform access gate matrix and policy contract tests.
- **V2-WEB-29-TEST-02 · NOT_RUN:** Read-only staging screenshot coverage all administration pages; controlled mutations separately.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/platform-admin/PlatformAdminConsoleClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/platform-admin/PlatformAdminConsoleClient.tsx#L1)
- [apps/web/components/platform-admin/PlatformAdminTestingClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/platform-admin/PlatformAdminTestingClient.tsx#L1)
- [apps/web/components/platform-admin/PlatformBillingPilotClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/platform-admin/PlatformBillingPilotClient.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/admin/jobs/AdminJobsClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/admin/jobs/AdminJobsClient.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/admin/push/AdminPushOutboxClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/admin/push/AdminPushOutboxClient.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/admin/operator/OperatorWorkbenchClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/admin/operator/OperatorWorkbenchClient.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/admin/layout.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/admin/layout.tsx#L1)
- [apps/web/app/[locale]/(platform-admin)/platform-admin/layout.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28platform-admin%29/platform-admin/layout.tsx#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** Validation/integration completion текущего scope.

**Канон:** Phase 0; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-29`.

## V2-WEB-31

**Интеграция 20.10.2026:** Phase 9; AIS-OWNER-001, AIS-EVID-002; release scope `CUSTOMER`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-31).

**Handover и public proof share с источниками и отзывом доступа**

**P1 · WEB · VALIDATION_AND_INTEGRATION · PROPOSED / NOT_RUN**

**Результат:** Пакет передачи открывается правильному получателю, соответствует версиям источников и отзывам.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 3–5 дней. **Порядок DAG:** 69.

**Экраны / семейства:** F27; F31; F39.

**Основные действия:** Пакет передачи открывается правильному получателю, соответствует версиям источников и отзывам..

**Обязательные зависимости:** [V2-WEB-08](#v2-web-08), [V2-WEB-10](#v2-web-10), [V2-ARCH-07](#v2-arch-07)

**Шаги реализации:**

1. Переиспользовать действующие pack generation/readiness/share services; восстановить manager entrypoint после WEB08.
2. Вместо blocked client handover link сформировать allowed customer pack projection или scoped public share с явным audience.
3. Проверить title/media/document/decision/commercial source versions и withdrawal/revoke invalidation.
4. Не создавать публичные URLs для internal оригиналов без существующего audience policy.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-31-AC-01 · NOT_RUN:** Incomplete pack показывает missing evidence и не выдаёт handed-over статус.
- **V2-WEB-31-AC-02 · NOT_RUN:** Expired/revoked share закрывает pack и originals; no-store/caches не восстанавливают доступ.
- **V2-WEB-31-AC-03 · NOT_RUN:** Customer/public pack не содержит internal financial fields и служебные storage identifiers.
- **V2-WEB-31-AC-04 · NOT_RUN:** Изменённый источник помечает опубликованный pack stale согласно contract.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-31-TEST-01 · NOT_RUN:** Existing share/finance isolation tests plus missing/revoked source fixtures.
- **V2-WEB-31-TEST-02 · NOT_RUN:** Manager→customer/public packet controlled staging route and export validation.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/HandoverManagerPanel.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/HandoverManagerPanel.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/handover/pack/HandoverPackPreviewClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/handover/pack/HandoverPackPreviewClient.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectProofPackPanel.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/ProjectProofPackPanel.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectReviewPackPanel.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/ProjectReviewPackPanel.tsx#L1)
- [apps/web/app/[locale]/share/proof/[token]/page.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/share/proof/%5Btoken%5D/page.tsx#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** Validation/integration completion текущего scope.

**Канон:** Phase 6; 9; 13; AIS-OWNER-001; AIS-EVID-002.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-31`.

## V2-WEB-33

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-33).

**Governance case от создания до подтверждённого закрытия**

**P2 · WEB · VALIDATION · PROPOSED / NOT_RUN**

**Результат:** Governance workflow сохраняет ответственного, срок, source и историю решений.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** S/M: 1–3 дня. **Порядок DAG:** 70.

**Экраны / семейства:** F17.

**Основные действия:** Governance workflow сохраняет ответственного, срок, source и историю решений..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Проверить list/filter/create/detail/status/owner/due/history на существующих contracts.
2. Различить пустой case, missing source, denied transition и network failure.
3. Проверить возврат к списку/дедлайн/linked task/report и audit attribution; исправлять только подтверждённые gaps.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-33-AC-01 · NOT_RUN:** Create/detail/save/readback согласованы; смена route не теряет сохранённую версию.
- **V2-WEB-33-AC-02 · NOT_RUN:** Чужой tenant/project и недопустимый actor не меняют case.
- **V2-WEB-33-AC-03 · NOT_RUN:** Closure имеет реальную историю/основание, не только изменение badge.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-33-TEST-01 · NOT_RUN:** Targeted case lifecycle and authorization tests; conflict fixture if versioning supported.
- **V2-WEB-33-TEST-02 · NOT_RUN:** Staging list/create/detail/error screenshots and keyboard navigation.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/app/[locale]/(dashboard)/dashboard/governance/GovernanceCasesClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/governance/GovernanceCasesClient.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/governance/[id]/GovernanceCaseDetailClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/governance/%5Bid%5D/GovernanceCaseDetailClient.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/governance/GovernanceCanonPage.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/governance/GovernanceCanonPage.tsx#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** Validation/integration completion текущего scope.

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-33`.


# M05 — Доказуемые AI результаты

## V2-ARCH-05

**Интеграция 20.10.2026:** Phase 7; AIS-EVID-002, AIS-VISION-003, AIS-GRAPH-004, AIS-CORRECTION-009; release scope `AI`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-arch-05).

**Долговечный AI результат, source lifecycle и human review**

**P1 · ARCH · ARCHITECTURE · PROPOSED / NOT_RUN**

**Результат:** Завершённый job имеет доступный source-linked результат, review state и правила устаревания.

**Предлагаемый владелец:** Architecture/domain owner + web/mobile reviewers. Конкретный исполнитель не назначен.

**Оценка:** L: 5–8 дней, зависит от текущего PR. **Порядок DAG:** 71.

**Экраны / семейства:** F11; F39; F40.

**Основные действия:** Завершённый job имеет доступный source-linked результат, review state и правила устаревания..

**Обязательные зависимости:** [V2-ARCH-04](#v2-arch-04), [V2-ARCH-07](#v2-arch-07), [V2-CON-03](#v2-con-03)

**Шаги реализации:**

1. Сверить существующие AI PR по actual diff. PR #446 по fresh metadata/filenames меняет private media resolver/source binding, а не подтверждённый durable completion: не расширять его молча до другой задачи. Для persistence продолжить реально совпадающий срез, если он есть, либо оформить отдельный bounded PR; current main handler await analyzeImage отбрасывает result, AIService записывает usage.
2. Persist result только для server-resolved tenant/project/report/media identity и текущего job attempt/lease; idempotent result key/version не размножает findings при retry.
3. Различить no job, job queued, provider fallback, success без usable result, insufficient evidence, reviewed result, stale source.
4. Graph связывает existing sources/results/revisions; source correction/delete/revoke инвалидирует derived retrieval/output.
5. AI proposal не меняет accepted work/commercial baseline автоматически; human decision/audit/version отдельны.

**Критерии приёмки — ещё не проверены:**

- **V2-ARCH-05-AC-01 · NOT_RUN:** Job success с usable output имеет durable result id и источники, доступные после reload.
- **V2-ARCH-05-AC-02 · NOT_RUN:** Retry/concurrent stale attempt не перезаписывает новый accepted result и не удваивает findings.
- **V2-ARCH-05-AC-03 · NOT_RUN:** Foreign source/revoked project не попадают в provider context, result cache или customer summary.
- **V2-ARCH-05-AC-04 · NOT_RUN:** UI показывает реальные uncertainty/units/method и human review; live provider proof не заменяется HTTP200/done SSE.

**Будущие проверки — NOT_RUN:**

- **V2-ARCH-05-TEST-01 · NOT_RUN:** Lease/idempotency/concurrency/source-revoke integration tests; current #446 exact diff tests.
- **V2-ARCH-05-TEST-02 · NOT_RUN:** Staging provider test only when separately authorized; strict existing ai_live_provider --require-live gate for live claim.
- **V2-ARCH-05-TEST-03 · NOT_RUN:** Web/native same result fixture + accepted/stale lifecycle readback.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/lib/platform/jobs/job.handlers/ai-analyze-media.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/platform/jobs/job.handlers/ai-analyze-media.ts#L1)
- [apps/web/lib/platform/ai/ai.service.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/platform/ai/ai.service.ts#L1)
- [apps/web/app/api/v1/reports/[id]/analysis-status/route.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/reports/%5Bid%5D/analysis-status/route.ts#L1)
- [apps/web/lib/domain/construction-graph/construction-graph.repository.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/construction-graph/construction-graph.repository.ts#L1)
- [apps/web/components/canon/ReportPublicationControls.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/ReportPublicationControls.tsx#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [ARCH-001](AUDIT_REPORT_RU.md#arch-001).

**Канон:** Phase 6; 7; 13; AIS-EVID-002; AIS-VISION-003; AIS-GRAPH-004; AIS-CORRECTION-009.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-ARCH-05`.

## V2-IOS-22

**Интеграция 20.10.2026:** Phase 7; AIS-VISION-003, AIS-EVID-002; release scope `AI`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-22).

**Развести AI job, insight и решение по источнику**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Понять результат анализа и принять обоснованное действие

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M/L. **Порядок DAG:** 72.

**Роли:** Manager.

**Экраны / семейства:** AITab; AIRiskDetail; ProjectAI; ProjectIntelligence; ProjectCopilotChat; ManagerDecisions.

**Основные действия:** Понять результат анализа и принять обоснованное действие.

**Ввод и предпосылки:** job status; retained result/insight identity; source evidence/revision; project; uncertainty semantics; human decision.

**Обязательные зависимости:** [V2-IOS-01](#v2-ios-01), [V2-ARCH-05](#v2-arch-05)

**Ранний независимый срез:**

- Удалить ложные измерения/проценты и показать unknown/job status можно до ARCH05. Result-driven UX зависит от persisted canonical result.

**Шаги реализации:**

1. Убрать probability50/confidence70/delay0 из live job mapping; техническую ошибку называть ошибкой обработки.
2. Определить UI read model AIJobStatus отдельно от AIInsight; если результата нет, показывать состояние обработки и recovery.
3. В insight detail показывать источник, дату, revision, основание и пределы уверенности; severity badge следует данным.
4. Сохранить настоящие risk decision API/audit; привязать решение к корректной source/result identity после согласования backend, сохранить прежние jobs references совместимо.

**API и контракты:**

- ManagerAPI.aiRequests/projectAi/riskDecisions/submitRiskDecision
- Existing project intelligence/copilot + Graph AI context
- Retained result contract из backend программы; новый pipeline не нужен

**Состояния, которые нужно сохранить или реализовать:**

- queued
- running
- failed
- resultUnavailable
- insightReady
- stale
- reviewing
- decisionSaved
- copilotFallback

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-22-AC-01 · NOT_RUN:** Given failed job без insight, Then не появляется строительный high-risk или вымышленная вероятность.
- **V2-IOS-22-AC-02 · NOT_RUN:** Given result stale относительно фото, Then UI не предлагает его как актуальную проверку без предупреждения/повторного анализа.
- **V2-IOS-22-AC-03 · NOT_RUN:** Given save decision error, Then решение не показано сохранённым и комментарий остаётся.
- **V2-IOS-22-AC-04 · NOT_RUN:** Given Copilot fallback/empty stream, Then нет ложного утверждения об успешном grounded анализе.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-22-TEST-01 · NOT_RUN:** Production job→view model fixtures success/fail/empty/unknown/stale.
- **V2-IOS-22-TEST-02 · NOT_RUN:** SSE parsing existing client: cancel/error/done-without-result; provider calls не нужны для unit.
- **V2-IOS-22-TEST-03 · NOT_RUN:** Staging один разрешённый source→result→human review после backend durable result gate.

**Проверенные исходные точки:**

- [ios/AiStroykaManager/AiStroykaManager/Views/AITabView.swift:59](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/AITabView.swift#L59)
- [ios/AiStroykaManager/AiStroykaManager/Views/AIRiskDetailView.swift:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/AIRiskDetailView.swift#L24)
- [ios/AiStroykaManager/AiStroykaManager/Views/ProjectDetailView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ProjectDetailView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Views/ProjectIntelligenceView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ProjectIntelligenceView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Views/ProjectCopilotChatView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ProjectCopilotChatView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Views/ManagerMoreView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ManagerMoreView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerCopilotService.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerCopilotService.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerIntelligenceModels.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerIntelligenceModels.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerV43Models.swift:209](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerV43Models.swift#L209)
- [ios/Shared/Sources/Shared/CopilotSSEClient.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/CopilotSSEClient.swift#L1)

**Условия остановки зависимого среза:**

- Нет retained result contract — оставить ясный job UI; не генерировать fake insight.
- Provider quality/runtime не доказаны одним200/done; не добавлять новую AI инфраструктуру.

**Условие выпуска:** G3; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-03](AUDIT_REPORT_RU.md#ios-03).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-22`.

## V2-WEB-11

**Интеграция 20.10.2026:** Phase 7; AIS-EVID-002, AIS-VISION-003, AIS-OWNER-001; release scope `AI`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-11).

**Разделить строительный риск, AI job status и рекомендации**

**P1 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** AI центр показывает техническое состояние jobs и только обоснованные строительные выводы.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 2–4 дня. **Порядок DAG:** 73.

**Экраны / семейства:** F40; F07.

**Основные действия:** AI центр показывает техническое состояние jobs и только обоснованные строительные выводы..

**Обязательные зависимости:** [V2-ARCH-04](#v2-arch-04), [V2-ARCH-05](#v2-arch-05)

**Ранний независимый срез:**

- Удалить ложные измерения/проценты и показать unknown/job status можно до ARCH05. Result-driven UX зависит от persisted canonical result.

**Шаги реализации:**

1. Переименовать failed/dead summary в статус обработки; actual project risks получать из соответствующего source-backed read model.
2. Удалить неподтверждённые section2/monolith defaults; empty recommendation → no evidence/what to upload.
3. Каждой рекомендации дать source, timestamp, method/provider, unknown и permitted next action.
4. Heuristic guide score назвать coverage/relevance по фактическому смыслу либо не показывать процент; null остаётся unavailable.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-11-AC-01 · NOT_RUN:** 90% successful jobs никогда не утверждает отсутствие high-risk проектов.
- **V2-WEB-11-AC-02 · NOT_RUN:** Нет данных → нейтральное empty/unknown, а не выдуманная стройплощадка.
- **V2-WEB-11-AC-03 · NOT_RUN:** Current request type×status heatmap сохранён; risk и job legends объясняют разные знаменатели.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-11-TEST-01 · NOT_RUN:** Fixtures queued/running/failed/dead/success и no construction sources.
- **V2-WEB-11-TEST-02 · NOT_RUN:** Source citation linking, customer context projection и fallback transparency checks.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/canon/DashboardAiRisksCanonPage.tsx:95](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/DashboardAiRisksCanonPage.tsx#L95)
- [apps/web/app/[locale]/(dashboard)/dashboard/ai/ai-requests-workspace.utils.ts:173](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/ai/ai-requests-workspace.utils.ts#L173)
- [apps/web/messages/ru.json:115](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/messages/ru.json#L115)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-11](AUDIT_REPORT_RU.md#web-11).

**Канон:** Phase 7; 13; AIS-EVID-002; AIS-VISION-003; AIS-OWNER-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-11`.


# M06 — Структура интерфейса, понятные состояния и помощь

## V2-AND-10

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001; release scope `ANDROID_DEFERRED`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-and-10).

**Нативная навигация, состояния, текст и доступность существующих экранов**

**P2 · ANDROID · CURRENT_MINIMUM · PROPOSED / NOT_RUN**

**Результат:** Ввести typed destinations и единый app-local navigator/back stack (Navigation Compose или другой согласованный native механизм), route содержит stable IDs, не весь mutable DTO.

**Предлагаемый владелец:** Android owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M; apply per existing screen family. **Порядок DAG:** 74.

**Роли:** Worker; Manager.

**Экраны / семейства:** все 8 текущих destinations; два first-launch overlays.

**Основные действия:** Назад; Продолжить; Повторить; Сохранить и выйти; Основное действие текущего job.

**Обязательные зависимости:** [V2-AND-03](#v2-and-03)

**Шаги реализации:**

1. Ввести typed destinations и единый app-local navigator/back stack (Navigation Compose или другой согласованный native механизм), route содержит stable IDs, не весь mutable DTO.
2. UI Back и system Back вызывают одинаковую policy; draft auto-save по V2-AND-03. Login/keyboard/overlay/deep-link back имеют осмысленный порядок.
3. Shared presentation LoadState различает loading/empty/ready/error/forbidden/offline-stale; retry локален экрану, не сбрасывает всё приложение.
4. Worker login сделать keyboard-safe/scrollable с email IME и password semantics; сохранить test tags. Manager уже scrollable — не делать повторную бессмысленную правку.
5. Technical IDs/cursor/bootstrap/raw status/Storage RLS instructions перенести в diagnostics; UI говорит о задаче, фото, ожидании сети, сохранении.
6. Проверить TalkBack labels, focus order, actionable role и touch targets по native guideline на runtime. В statics report не выдавать непроверенные px/contrast числа.
7. Localize en/ru/es/it и проверить длинную строку/крупный шрифт/small screen; не добавлять новую навигационную вкладку только ради перестановки.

**API и контракты:**

- Нет новых endpoints; все ошибки существующих calls передаются через screen-specific state

**Состояния, которые нужно сохранить или реализовать:**

- Loading
- Empty
- Ready
- Success
- Error
- OfflineWithCache
- OfflineWithoutCache
- Forbidden
- NotFound
- Cancelled
- Retrying

**Критерии приёмки — ещё не проверены:**

- **V2-AND-10-AC-01 · NOT_RUN:** AC01 System Back и экранный Back возвращают в ожидаемую предыдущую область; report не теряется; relaunch восстанавливает route по ID.
- **V2-AND-10-AC-02 · NOT_RUN:** AC02 Small screen + keyboard + font scale200% не скрывают Login primary action; TalkBack can label/focus every current interactive control.
- **V2-AND-10-AC-03 · NOT_RUN:** AC03 HTTP401/403/404/500/offline не отображаются как empty data; null detail не бесконечно loading.
- **V2-AND-10-AC-04 · NOT_RUN:** AC04 Picker cancel/overlay dismiss/Back — обычное действие, не красная ошибка.
- **V2-AND-10-AC-05 · NOT_RUN:** AC05 Visible text не предлагает pilot flag, получение URL через список media, «bootstrap», raw cursor или status enum.
- **V2-AND-10-AC-06 · NOT_RUN:** AC06 Сохранены старые pilot tags и добавлены stable tags на новые actionable states; no-op roles устранены.
- **V2-AND-10-AC-07 · NOT_RUN:** AC07 en/ru/es/it key coverage+visual sample; ошибки/disabled состояние читаются без одного только цвета.
- **V2-AND-10-AC-08 · NOT_RUN:** AC08 No terminal success до server acceptance; retry сохраняет scope/input.

**Будущие проверки — NOT_RUN:**

- **V2-AND-10-TEST-01 · NOT_RUN:** Typed destination decode/back policy/state mapping; unknown route safely returns to permitted root.
- **V2-AND-10-TEST-02 · NOT_RUN:** System back/gesture, process restoration, keyboard, TalkBack,200%font, four locales, narrow screen.
- **V2-AND-10-TEST-03 · NOT_RUN:** Fresh screenshots of critical states with build/SHA/locale/device recorded; no inferred contrast numbers.

**Предлагаемое деление PR:**

- Navigation/back contract
- Error/copy/localization
- Runtime accessibility verification

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/navigation/Destination.kt`
- `android/AiStroykaManager/src/main/java/ai/aistroyka/manager/navigation/Destination.kt`
- `android/shared/src/main/java/ai/aistroyka/shared/ui/LoadState.kt`

**Проверенные исходные точки:**

- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/MainActivity.kt:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/MainActivity.kt#L9)
- [android/AiStroykaManager/src/main/java/ai/aistroyka/manager/MainActivity.kt:8](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/java/ai/aistroyka/manager/MainActivity.kt#L8)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerApp.kt:314](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerApp.kt#L314)
- [android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ui/ManagerApp.kt:512](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ui/ManagerApp.kt#L512)
- [android/AiStroykaWorker/src/main/res/values/strings.xml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/res/values/strings.xml#L1)
- [android/AiStroykaWorker/src/main/res/values-ru/strings.xml:16](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/res/values-ru/strings.xml#L16)
- [android/AiStroykaWorker/src/main/res/values-es/strings.xml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/res/values-es/strings.xml#L1)
- [android/AiStroykaWorker/src/main/res/values-it/strings.xml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/res/values-it/strings.xml#L1)
- [android/AiStroykaManager/src/main/res/values/strings.xml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/res/values/strings.xml#L1)
- [android/AiStroykaManager/src/main/res/values-ru/strings.xml:53](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/res/values-ru/strings.xml#L53)
- [android/AiStroykaManager/src/main/res/values-es/strings.xml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/res/values-es/strings.xml#L1)
- [android/AiStroykaManager/src/main/res/values-it/strings.xml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/res/values-it/strings.xml#L1)

**Условия остановки зависимого среза:**



**Условие выпуска:** Runtime interaction/a11y matrix на согласованном min-supported и target API устройств; visual baseline приложен. Static source review alone PARTIAL.

**Rollback:** Route migration сохраняет report IDs и owner; старый UI не включается с destructive backToHome reset.

**Находки:** [AND-015](AUDIT_REPORT_RU.md#and-015), [AND-013](AUDIT_REPORT_RU.md#and-013), [AND-018](AUDIT_REPORT_RU.md#and-018), [AND-002](AUDIT_REPORT_RU.md#and-002), [AND-003](AUDIT_REPORT_RU.md#and-003).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-AND-10`.

## V2-AND-11

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001; release scope `ANDROID_DEFERRED`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-and-11).

**Контекстная помощь после основной работы, без ложной уверенности ИИ**

**P2 · ANDROID · CURRENT_MINIMUM_VISUAL_AND_COPY · PROPOSED / NOT_RUN**

**Результат:** Оставить существующие first-launch dismissal/seen prefs; persistent home guide сделать optional/collapsible с запоминаемым выбором в нужном owner/app scope.

**Предлагаемый владелец:** Android owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** S–M; visual/copy fix can ship independently after essential bootstrap. **Порядок DAG:** 75.

**Роли:** Worker; Manager.

**Экраны / семейства:** Worker Home; Manager Home; first-launch overlays.

**Основные действия:** Основное рабочее действие; Показать помощь; Скрыть помощь; Перейти к доступному шагу.

**Обязательные зависимости:** [V2-AND-02](#v2-and-02), [V2-AND-10](#v2-and-10)

**Шаги реализации:**

1. Оставить существующие first-launch dismissal/seen prefs; persistent home guide сделать optional/collapsible с запоминаемым выбором в нужном owner/app scope.
2. Worker first screen: current shift/task/resume draft/retry upload. Manager first screen: pending review/scope. Guide ниже primary job и не блокирует essential bootstrap.
3. Показывать только native actions, которые доступны по state/capability. href из server help валидировать через native action router; неподдерживаемые web suggestions не выглядят кнопками.
4. Согласовать counted steps с теми, что реально показаны и достижимы; не считать 5 web launch events для 3 native шагов.
5. Убрать percentage «Уверенность ИИ»: это deterministic heuristic в текущем backend. Не вводить fake confidence и не добавлять LLM только ради исправления.
6. Until backend knows worker/platform, локальные честные подсказки достаточны. Замена string manager→worker без изменения backend не решает role mismatch.
7. Не обещать task creation/invite/team/AI workspace/queue resume, пока соответствующее Android действие не реализовано.

**API и контракты:**

- GET /api/v1/activation/status (optional)
- POST /api/v1/help/hints (optional)
- POST /api/v1/help/assistant (optional)
- POST /api/v1/help/assistant/events only existing consent/event policy; no new analytics just for audit

**Состояния, которые нужно сохранить или реализовать:**

- Hidden
- Collapsed
- Expanded
- AvailableAction
- UnavailableAction
- LoadingOptionalHelp
- HelpUnavailableWithoutBlockingWork

**Исходные platform contract references:**

- ANDROID-GUIDE

Сопоставить с общим ownership CON/ARCH из раздела 3; не создавать параллельный серверный контракт.

**Критерии приёмки — ещё не проверены:**

- **V2-AND-11-AC-01 · NOT_RUN:** AC01 Existing first-launch Start dismiss and persisted seen keep working; user can collapse persistent card and choice survives restart.
- **V2-AND-11-AC-02 · NOT_RUN:** AC02 Primary job visible/available before optional help loads; help errors do not block create/review.
- **V2-AND-11-AC-03 · NOT_RUN:** AC03 Count matches exactly visible achievable steps; no project/team creation step in Worker.
- **V2-AND-11-AC-04 · NOT_RUN:** AC04 Every displayed CTA routes to permitted current native action; unsupported href is not silently no-op.
- **V2-AND-11-AC-05 · NOT_RUN:** AC05 No unqualified AI confidence percent derived from heuristic; copy explains factual hint basis where useful.
- **V2-AND-11-AC-06 · NOT_RUN:** AC06 Worker role/platform mismatch is resolved locally or by tested additive shared contract; changing role string alone FAIL.
- **V2-AND-11-AC-07 · NOT_RUN:** AC07 Four locales and large-text states verified; first-launch overlay doesn't obscure Login.

**Будущие проверки — NOT_RUN:**

- **V2-AND-11-TEST-01 · NOT_RUN:** Help action allow-map/capability filters; count equals visible steps; prefs migration.
- **V2-AND-11-TEST-02 · NOT_RUN:** If shared backend changed: worker/platform roles and backward-compatible Manager/client hints.
- **V2-AND-11-TEST-03 · NOT_RUN:** First use, second use, slow/offline help, collapse/reopen; primary action accessibility.

**Предлагаемое деление PR:**

- Home hierarchy/collapse/copy
- Optional native action mapping

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `android/shared/src/main/java/ai/aistroyka/shared/help/NativeHelpAction.kt`

**Проверенные исходные точки:**

- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerApp.kt:81](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/ui/WorkerApp.kt#L81)
- [android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ui/ManagerApp.kt:107](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ui/ManagerApp.kt#L107)
- [android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ManagerViewModel.kt:304](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/java/ai/aistroyka/manager/ManagerViewModel.kt#L304)
- [android/shared/src/main/java/ai/aistroyka/shared/HelpApi.kt:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/HelpApi.kt#L1)
- [apps/web/app/api/v1/help/assistant/route.ts:127](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/help/assistant/route.ts#L127)
- [apps/web/app/api/v1/help/hints/route.ts:11](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/help/hints/route.ts#L11)
- [android/AiStroykaWorker/src/main/res/values/strings.xml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/res/values/strings.xml#L1)
- [android/AiStroykaWorker/src/main/res/values-ru/strings.xml:16](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/res/values-ru/strings.xml#L16)
- [android/AiStroykaWorker/src/main/res/values-es/strings.xml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/res/values-es/strings.xml#L1)
- [android/AiStroykaWorker/src/main/res/values-it/strings.xml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/res/values-it/strings.xml#L1)
- [android/AiStroykaManager/src/main/res/values/strings.xml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/res/values/strings.xml#L1)
- [android/AiStroykaManager/src/main/res/values-ru/strings.xml:53](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/res/values-ru/strings.xml#L53)
- [android/AiStroykaManager/src/main/res/values-es/strings.xml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/res/values-es/strings.xml#L1)
- [android/AiStroykaManager/src/main/res/values-it/strings.xml:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/main/res/values-it/strings.xml#L1)

**Условия остановки зависимого среза:**



**Условие выпуска:** Job-first screenshots + actual helper CTA routing with no unsupported promises; no invented usability percentages.

**Rollback:** Скрыть optional help целиком при ошибке; основная работа остаётся доступной.

**Находки:** [AND-016](AUDIT_REPORT_RU.md#and-016), [AND-018](AUDIT_REPORT_RU.md#and-018).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-AND-11`.

## V2-AND-12

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001; release scope `ANDROID_DEFERRED`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-and-12).

**Worker push: permission, доставка, открытие правильного отчёта, logout**

**P2 · ANDROID · CURRENT_MINIMUM_WORKER_NOTIFICATION_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Сохранить существующий encrypted token/register stable keys, добавить регистрацию outcome/retry policy с owner generation fence.

**Предлагаемый владелец:** Android owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M. **Порядок DAG:** 76.

**Роли:** Worker.

**Экраны / семейства:** Permission education; Home feedback; Report Detail / Resubmit; Login continuation.

**Основные действия:** Разрешить уведомления; Продолжить без уведомлений; Открыть отчёт; Повторно проверить состояние.

**Обязательные зависимости:** [V2-AND-01](#v2-and-01), [V2-AND-07](#v2-and-07), [V2-AND-10](#v2-and-10)

**Шаги реализации:**

1. Сохранить существующий encrypted token/register stable keys, добавить регистрацию outcome/retry policy с owner generation fence.
2. Проверить merged manifest и реализовать contextual notification permission flow/channel для поддерживаемых Android API, не просить permission на password login.
3. Разобрать реальный backend type report_ready payload report_id/status; notification route хранит только validated target ID/expected owner scope, затем GET canonical own detail.
4. Foreground, background и killed-state entry (onCreate/onNewIntent) используют один router. При session absent сохранить pending safe target, затем identity bootstrap; чужой/удалённый target safe fallback.
5. Permission denied не блокирует отчёты; in-app recent feedback + manual refresh дают тот же результат проверки.
6. Logout unregister best-effort и остановка pending owner notification navigation; token rotation/reinstall/новый login имеют проверяемую привязку.
7. Unknown payload/version/missing id — safe no-op с видимым fallback в Home, без исполнения arbitrary URL.
8. Manager FCM dependency/inbox не добавлять: отдельный later parity ticket после активации scope.

**API и контракты:**

- POST /api/v1/devices/register
- POST /api/v1/devices/unregister
- GET /api/v1/reports/:id
- GET /api/v1/worker/sync
- backend review enqueue type=report_ready payload={report_id,status}

**Состояния, которые нужно сохранить или реализовать:**

- PermissionUnknown
- PermissionDenied
- PermissionGranted
- TokenPending
- Registered
- RegistrationRetry
- MessageForeground
- PendingNavigation
- RequiresLogin
- TargetReady
- TargetUnavailable
- SignedOut

**Критерии приёмки — ещё не проверены:**

- **V2-AND-12-AC-01 · NOT_RUN:** AC01 Grant/deny/dismiss permission не блокируют основной report journey; denied user видит feedback через refresh.
- **V2-AND-12-AC-02 · NOT_RUN:** AC02 Один и тот же report_ready открывает правильный own detail/resubmit в foreground/background/killed и after-login состояниях.
- **V2-AND-12-AC-03 · NOT_RUN:** AC03 Missing/malformed/stale/foreign report_id/unknown type безопасно возвращают в Home; arbitrary external URL не открывается автоматически.
- **V2-AND-12-AC-04 · NOT_RUN:** AC04 A notification→logout→B не показывает данные A и не открывает его target; late registration A ignored after generation change.
- **V2-AND-12-AC-05 · NOT_RUN:** AC05 Token refresh, reinstall/new device, unregister success/failure и следующий login проверены; server ownership reconciliation согласован, не assumed.
- **V2-AND-12-AC-06 · NOT_RUN:** AC06 Если report status уже другой, detail показывает canonical current state, не payload status как истину.
- **V2-AND-12-AC-07 · NOT_RUN:** AC07 Tokens/full payload/private report content не пишутся в logs; notification body не раскрывает больше согласованной policy.
- **V2-AND-12-AC-08 · NOT_RUN:** AC08 Manager module не получает новый Firebase integration в этой задаче.

**Будущие проверки — NOT_RUN:**

- **V2-AND-12-TEST-01 · NOT_RUN:** Payload parser/router whitelist, pending target owner fence, unknown version/missing fields.
- **V2-AND-12-TEST-02 · NOT_RUN:** Register/unregister idempotency + actual review payload; account rotation behavior.
- **V2-AND-12-TEST-03 · NOT_RUN:** Permission grant/deny; foreground/background/killed; authenticated/expired/signedout; stale and foreign targets; logout/token rotation.

**Предлагаемое деление PR:**

- Permission/channel/router + parser tests
- Registration ownership and full device lifecycle proof

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/notifications/WorkerNotificationRouter.kt`

**Проверенные исходные точки:**

- [android/AiStroykaWorker/src/main/AndroidManifest.xml:3](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/AndroidManifest.xml#L3)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerFirebaseMessagingService.kt:11](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerFirebaseMessagingService.kt#L11)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/MainActivity.kt:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/MainActivity.kt#L9)
- [android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerApplication.kt:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerApplication.kt#L1)
- [android/shared/src/main/java/ai/aistroyka/shared/PushRegistrationService.kt:15](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/PushRegistrationService.kt#L15)
- [android/shared/src/main/java/ai/aistroyka/shared/WorkerApi.kt:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/main/java/ai/aistroyka/shared/WorkerApi.kt#L1)
- [apps/web/app/api/v1/reports/[id]/route.ts:178](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/reports/%5Bid%5D/route.ts#L178)

**Условия остановки зависимого среза:**



**Условие выпуска:** Полная lifecycle matrix на FCM-capable test device с обезличенными receipts. Local payload injection отдельно от real delivery; одно не заменяет другое.

**Rollback:** Отключить deep-link execution, оставить in-app refresh/feedback; не ломать existing token unregister.

**Находки:** [AND-011](AUDIT_REPORT_RU.md#and-011), [AND-015](AUDIT_REPORT_RU.md#and-015).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-AND-12`.

## V2-ARCH-03

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-arch-03).

**Отделить feature behavior от Canon presentation**

**P2 · ARCH · ARCHITECTURE · PROPOSED / NOT_RUN**

**Результат:** Route pages собирают feature controllers, а Canon компоненты не теряют действия из-за skin-ветвления.

**Предлагаемый владелец:** Architecture/domain owner + web/mobile reviewers. Конкретный исполнитель не назначен.

**Оценка:** M/L: 4–7 дней по3 небольшим slices. **Порядок DAG:** 77.

**Экраны / семейства:** F09; F10; F11; F34; F35; F40.

**Основные действия:** Route pages собирают feature controllers, а Canon компоненты не теряют действия из-за skin-ветвления..

**Обязательные зависимости:** [V2-WEB-01](#v2-web-01), [V2-WEB-02](#v2-web-02), [V2-ARCH-02](#v2-arch-02)

**Шаги реализации:**

1. ADR описывает existing app routes → src/features domain orchestration → lib/domain/services → components/canon/ui. Не переносить весь repo ради структуры.
2. Начать с task controller: query/filter/selection/create/assign/status, затем document review/upload и report evidence.
3. Извлечь чистые view models/actions; presentation принимает typed props/capabilities, не импортирует implementation из app route tree.
4. Удалять legacy branch только после feature parity inventory и source consumers check; старые ветки не broad-merge.

**Критерии приёмки — ещё не проверены:**

- **V2-ARCH-03-AC-01 · NOT_RUN:** Один task command ведёт к одному backend mutation независимо от list/board/phone view.
- **V2-ARCH-03-AC-02 · NOT_RUN:** Canonical visual change не отключает существующее action.
- **V2-ARCH-03-AC-03 · NOT_RUN:** Границы imports проверяются для выделенных features; bundle/build и SSR не ухудшаются необоснованно.
- **V2-ARCH-03-AC-04 · NOT_RUN:** Рабочие shared components и current public/native canon сохраняются.

**Будущие проверки — NOT_RUN:**

- **V2-ARCH-03-TEST-01 · NOT_RUN:** Feature command integration tests и stable React render test.
- **V2-ARCH-03-TEST-02 · NOT_RUN:** Before/after action parity matrix and screenshot comparison for moved slice.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/canon/DashboardTasksCanonPage.tsx:150](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/DashboardTasksCanonPage.tsx#L150)
- [apps/web/app/[locale]/(dashboard)/dashboard/tasks/DashboardTasksClient.tsx:118](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/tasks/DashboardTasksClient.tsx#L118)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/DashboardProjectDetailClient.tsx#L24)
- [apps/web/components/canon/DashboardAiRisksCanonPage.tsx:14](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/DashboardAiRisksCanonPage.tsx#L14)
- [apps/web/components/canon/ReportReviewCanonView.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/ReportReviewCanonView.tsx#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-21](AUDIT_REPORT_RU.md#web-21), [WEB-01](AUDIT_REPORT_RU.md#web-01), [WEB-02](AUDIT_REPORT_RU.md#web-02).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-ARCH-03`.

## V2-ARCH-08

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001, AIS-EVID-002; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-arch-08).

**Telemetry завершения реальных пользовательских задач**

**P2 · ARCH · ARCHITECTURE · PROPOSED / NOT_RUN**

**Результат:** Метрики различают открытие UI, server success, partial success, recovery и подтверждённую пользу.

**Предлагаемый владелец:** Architecture/domain owner + web/mobile reviewers. Конкретный исполнитель не назначен.

**Оценка:** M: 2–4 дня. **Порядок DAG:** 78.

**Экраны / семейства:** F04; F05; F07; F10; F11; F20; F21; F40.

**Основные действия:** Метрики различают открытие UI, server success, partial success, recovery и подтверждённую пользу..

**Обязательные зависимости:** [V2-ARCH-02](#v2-arch-02)

**Шаги реализации:**

1. Расширять существующий event registry: onboarding start/complete, project/task create, assignment partial, report submitted/reviewed, photo published/withdrawn, customer decision, action dead end.
2. Завершение события привязать к acknowledged server state, correlation/request id и release SHA; CTA click не равен complete.
3. Собирать only allowed non-sensitive dimensions: surface/role class/feature/result/error code; no message bodies/tokens/media URLs.
4. Построить baseline funnel/recovery latency/duplicate rate/false healthy incidents; целевые проценты после фактических наблюдений.

**Критерии приёмки — ещё не проверены:**

- **V2-ARCH-08-AC-01 · NOT_RUN:** Один idempotent command имеет один success event, partial assign отдельный result.
- **V2-ARCH-08-AC-02 · NOT_RUN:** Client error и backend trace можно связать без раскрытия чувствительных данных.
- **V2-ARCH-08-AC-03 · NOT_RUN:** No events from preview/mock mode counted as production usage.
- **V2-ARCH-08-AC-04 · NOT_RUN:** Dashboard metrics указывают period/sample/coverage, а не выдуманный ROI.

**Будущие проверки — NOT_RUN:**

- **V2-ARCH-08-TEST-01 · NOT_RUN:** Event schema/redaction/deduplication tests.
- **V2-ARCH-08-TEST-02 · NOT_RUN:** Synthetic staging journey verifies begin→pending→success/failure events and release attribution.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/lib/growth/track-event.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/growth/track-event.ts#L1)
- [apps/web/lib/growth/product-events.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/growth/product-events.ts#L1)
- [apps/web/lib/growth/funnel-events.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/growth/funnel-events.ts#L1)
- [apps/web/lib/telemetry/telemetry.service.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/telemetry/telemetry.service.ts#L1)
- [apps/web/lib/observability/trace.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/observability/trace.ts#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** Validation/integration completion текущего scope.

**Канон:** Phase 1; 7; 13; AIS-PILOT-001; AIS-EVID-002.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-ARCH-08`.

## V2-IOS-28

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001, AIS-OWNER-002; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-28).

**Сделать настройки, help и диагностику понятными действиями**

**P2 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Управлять реальным состоянием приложения и получить помощь в контексте

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M. **Порядок DAG:** 79.

**Роли:** Worker; Manager; Customer.

**Экраны / семейства:** Worker ProfileOfflineSettings/Diagnostics; ManagerMore/Settings/Decisions/Help; Customer account/logout entry.

**Основные действия:** Управлять реальным состоянием приложения и получить помощь в контексте.

**Ввод и предпосылки:** current session/scope; sync pause state; notification authorization/preference; locale; help context; diagnostic safe metadata.

**Обязательные зависимости:** [V2-IOS-03](#v2-ios-03), [V2-IOS-07](#v2-ios-07)

**Шаги реализации:**

1. Заменить неоднозначное «Управлять sync» явными Pause/Resume и отдельным Refresh; текст отражает executor state.
2. У каждого preference указать фактический effect; OS permission и app preference не смешивать.
3. Help сохраняет роль/страницу/тип проблемы и предлагает существующий recovery path; не закрывает основную задачу запросом AI.
4. Диагностика показывает version, queue state и безопасные IDs; не экспортирует токены, raw private payload или чужие данные.

**API и контракты:**

- Existing help/hints, help/assistant and events
- Existing tenant/profile and notification/device methods
- Billing/entitlement read-only boundaries сохраняются

**Состояния, которые нужно сохранить или реализовать:**

- preferenceSaved
- systemPermissionDenied
- queuePaused
- queueResumed
- helpLoading
- helpFallback
- diagnosticsReady
- signedOut

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-28-AC-01 · NOT_RUN:** Given pause, Then пользователю ясно, что очередь остановлена; refresh не маскируется под resume.
- **V2-IOS-28-AC-02 · NOT_RUN:** Given notifications запрещены системой, Then toggle не обещает доставку без разрешения.
- **V2-IOS-28-AC-03 · NOT_RUN:** Given help failure, Then остаётся понятная локальная помощь/повтор, основной экран работает.
- **V2-IOS-28-AC-04 · NOT_RUN:** Given logout, Then scope/reset соответствует ticket2.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-28-TEST-01 · NOT_RUN:** State/UI tests pause/resume/permission mismatch и locale.
- **V2-IOS-28-TEST-02 · NOT_RUN:** Safe diagnostics serialization test no tokens/private payload.
- **V2-IOS-28-TEST-03 · NOT_RUN:** Device Settings return и role-specific help paths.

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/Views/ProfileOfflineSettingsView.swift:94](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/ProfileOfflineSettingsView.swift#L94)
- [ios/AiStroykaWorker/AiStroykaWorker/Views/DiagnosticsView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Views/DiagnosticsView.swift#L1)
- [ios/AiStroykaWorker/AiStroykaWorker/Services/LocalReminderService.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Services/LocalReminderService.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Views/ManagerMoreView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ManagerMoreView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Views/ManagerSettingsView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Views/ManagerSettingsView.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Services/ManagerAPI.swift#L1)
- [ios/AiStroykaCustomer/AiStroykaCustomer/Views/CustomerHomeView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/Views/CustomerHomeView.swift#L1)
- [ios/Shared/Sources/Shared/AppRuntime.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/AppRuntime.swift#L1)

**Условия остановки зависимого среза:**

- Не менять Stripe/entitlement behavior из Manager Settings UI-задачи.
- Не отправлять сообщения поддержке/приглашения без соответствующей авторизации.

**Условие выпуска:** G1; G3; G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-13](AUDIT_REPORT_RU.md#ios-13), [IOS-16](AUDIT_REPORT_RU.md#ios-16).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-28`.

## V2-IOS-29

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001, AIS-OWNER-002; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-29).

**Проверить native typography, accessibility и четыре локали**

**P2 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Выполнить основной сценарий с крупным текстом и assistive navigation

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M/L. **Порядок DAG:** 80.

**Роли:** Worker; Manager; Customer.

**Экраны / семейства:** Все семейства screen-family-coverage; Shared controls; Camera/QuickLook/system bridges.

**Основные действия:** Выполнить основной сценарий с крупным текстом и assistive navigation.

**Ввод и предпосылки:** actual current binary; small/large supported devices; VoiceOver; text scaling/reduced motion; RU/EN/ES/IT; permission/error states.

**Обязательные зависимости:** [V2-IOS-05](#v2-ios-05), [V2-IOS-17](#v2-ios-17), [V2-IOS-24](#v2-ios-24)

**Шаги реализации:**

1. Сделать state gallery существующих primitives на актуальной сборке, не считать исторические PNG эталоном runtime.
2. Проверить реальные hit regions, accessible labels/selected traits, Dynamic Type и focus/error announcement; внутренние frame36 не равны фактической hit area.
3. Исправлять по компонентам после измерения: semantic fonts/scaled metrics, multiline/scroll, non-color status и reduced motion.
4. Обновлять четыре locale bundle вместе; проверить динамические keys, plural/format/date/currency и длинные переводы, не ограничиваться наличием literal key.

**API и контракты:**

- Существующие domain endpoints не меняются; locale ресурсы каждого app + Shared

**Состояния, которые нужно сохранить или реализовать:**

- normal
- loading
- disabled
- error
- empty
- stale
- offline
- largeText
- voiceOverFocused
- longTranslation

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-29-AC-01 · NOT_RUN:** Given максимальный поддерживаемый text scale, Then primary CTA и error доступны без наложения.
- **V2-IOS-29-AC-02 · NOT_RUN:** Given VoiceOver, Then icon-only attach/record/send имеют корректное действие/состояние и порядок.
- **V2-IOS-29-AC-03 · NOT_RUN:** Given ошибка формы, Then focus/announcement указывает её и сохранённый input.
- **V2-IOS-29-AC-04 · NOT_RUN:** Given RU/EN/ES/IT, Then нет сырых ключей/обрезанного критического смысла и форматирование соответствует контракту.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-29-TEST-01 · NOT_RUN:** Accessibility inspector + реальный VoiceOver сценарий; source modifiers не равны PASS.
- **V2-IOS-29-TEST-02 · NOT_RUN:** Snapshot только критических state/layout комбинаций, не каждой декоративной строки.
- **V2-IOS-29-TEST-03 · NOT_RUN:** Device camera/gallery/mic/location deny-return и системный Back/Close.

**Проверенные исходные точки:**

- [ios/AiStroykaWorker/AiStroykaWorker/Design/WorkerV43Components.swift:184](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Design/WorkerV43Components.swift#L184)
- [ios/AiStroykaWorker/AiStroykaWorker/Design/WorkerV43Tokens.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorker/Design/WorkerV43Tokens.swift#L1)
- [ios/AiStroykaManager/AiStroykaManager/Design/ManagerV43Components.swift:113](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Design/ManagerV43Components.swift#L113)
- [ios/AiStroykaManager/AiStroykaManager/Design/ManagerV43Tokens.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManager/Design/ManagerV43Tokens.swift#L1)
- [ios/AiStroykaCustomer/AiStroykaCustomer/Design/CustomerTokens.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/Design/CustomerTokens.swift#L1)
- [ios/AiStroykaCustomer/AiStroykaCustomer/Design/CustomerStatusView.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomer/Design/CustomerStatusView.swift#L1)
- [ios/Shared/Sources/Shared/InlineStatusViews.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/InlineStatusViews.swift#L1)
- [ios/Shared/Sources/Shared/TaskChatView.swift:345](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Sources/Shared/TaskChatView.swift#L345)

**Условия остановки зависимого среза:**

- Нет свежего native rendering — визуальный verdict UNKNOWN; mockup обозначать PROPOSAL.
- Не менять Worker/Manager в один app и не заменять native navigation веб-паттернами ради единообразия.

**Условие выпуска:** G4; G5

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-19](AUDIT_REPORT_RU.md#ios-19).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-29`.

## V2-PUB-05

**Интеграция 20.10.2026:** Phase 12; AIS-PILOT-001; release scope `PUBLIC_WEB`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-pub-05).

**Сохранить intent обращения и фокус многошаговой формы**

**P2 · PUBLIC · PUBLIC_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Параметризовать существующую форму intent, заголовком и подходящими полями; сохранять исходную тему в payload и подтверждении. Фактическое поведение backend attribution отдельно проверить.

**Предлагаемый владелец:** Web UI owner + product/content reviewer. Конкретный исполнитель не назначен.

**Оценка:** S/M: оценить после baseline responsive check. **Порядок DAG:** 81.

**Роли:** Посетитель / новый и действующий пользователь.

**Экраны / семейства:** /partners, /pricing/enterprise, /security; /ru/contact, шаг 1 → 2.

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Параметризовать существующую форму intent, заголовком и подходящими полями; сохранять исходную тему в payload и подтверждении. Фактическое поведение backend attribution отдельно проверить.
2. После смены шага переносить фокус на заголовок шага или первое поле, сообщать текущий шаг assistive technology; Back возвращает осмысленный фокус и сохраняет введённое.
3. Один компонент формы, intent pilot/partner/enterprise/security/support, подходящие заголовок и поля; payload fixture и success сохраняют исходную тему. После перехода шага фокус на heading/первом поле; Back восстанавливает ввод.

**Критерии приёмки — ещё не проверены:**

- **V2-PUB-05-AC-01 · NOT_RUN:** Партнёрская, Enterprise и security заявки сохраняют видимую тему до подтверждения.
- **V2-PUB-05-AC-02 · NOT_RUN:** Общая инфраструктура формы используется без трёх дублирующих реализаций.
- **V2-PUB-05-AC-03 · NOT_RUN:** После Continue последовательные Tab проходят все поля шага 2 до Submit.
- **V2-PUB-05-AC-04 · NOT_RUN:** Back сохраняет поля; ошибка объявляется и ведёт к исправлению.

**Будущие проверки — NOT_RUN:**

- **V2-PUB-05-TEST-01 · NOT_RUN:** CTA→intent→payload fixture
- **V2-PUB-05-TEST-02 · NOT_RUN:** Ошибка/возврат формы
- **V2-PUB-05-TEST-03 · NOT_RUN:** Keyboard only
- **V2-PUB-05-TEST-04 · NOT_RUN:** Screen reader step announcement
- **V2-PUB-05-TEST-05 · NOT_RUN:** RU/EN/ES/IT long copy

**Проверенные исходные точки:**

- [apps/web/components/public/v41/V41PilotButton.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/public/v41/V41PilotButton.tsx#L1)
- [apps/web/components/public/v43/PilotForm.tsx:98](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/public/v43/PilotForm.tsx#L98)
- [apps/web/components/public/v43/PilotForm.tsx:208](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/public/v43/PilotForm.tsx#L208)

**Условия остановки зависимого среза:**

- Неподтверждённый контракт или неожиданный scope — остановить зависимый срез и зафиксировать вопрос; продолжить независимые работы.
- Не выполнять merge/deploy/migration/provider/store actions без действующей авторизации и gates.

**Условие выпуска:** Фактический rendered flow, состояния, локали и ссылки подтверждены

**Rollback:** Изолированный код/flag rollback, сохраняя пользовательский ввод, принятую историю и существующие server IDs.

**Находки:** [PUB-003](AUDIT_REPORT_RU.md#pub-003), [PUB-004](AUDIT_REPORT_RU.md#pub-004).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-PUB-05`.

## V2-PUB-06

**Интеграция 20.10.2026:** Phase 12; AIS-PILOT-001; release scope `PUBLIC_WEB`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-pub-06).

**Дать действующим пользователям отдельный путь поддержки**

**P2 · PUBLIC · PUBLIC_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Выделить support intent и форму/канал существующей проблемы с категорией, версией приложения и безопасным request ID; контакт продаж оставить для пилота.

**Предлагаемый владелец:** Web UI owner + product/content reviewer. Конкретный исполнитель не назначен.

**Оценка:** S/M: оценить после baseline responsive check. **Порядок DAG:** 82.

**Роли:** Посетитель / новый и действующий пользователь.

**Экраны / семейства:** /ru/support → /ru/contact.

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Выделить support intent и форму/канал существующей проблемы с категорией, версией приложения и безопасным request ID; контакт продаж оставить для пилота.
2. Дать категории: не отправляется отчёт, нет доступа, неверные данные, billing, другое. Предложить safe requestId/build/version, без session dumps и signed URLs. Показать контактный канал и ожидание ответа только на основе согласованного процесса.

**Критерии приёмки — ещё не проверены:**

- **V2-PUB-06-AC-01 · NOT_RUN:** Из Support понятно, как сообщить о текущей проблеме и что приложить.
- **V2-PUB-06-AC-02 · NOT_RUN:** Заявка не требует описания нового пилота; состояния отправки/ошибки/повтора проверены на разрешённом тестовом получателе.

**Будущие проверки — NOT_RUN:**

- **V2-PUB-06-TEST-01 · NOT_RUN:** Support flow без PII в диагностике
- **V2-PUB-06-TEST-02 · NOT_RUN:** Ошибка доставки/повтор на тестовом окружении

**Условия остановки зависимого среза:**

- Неподтверждённый контракт или неожиданный scope — остановить зависимый срез и зафиксировать вопрос; продолжить независимые работы.
- Не выполнять merge/deploy/migration/provider/store actions без действующей авторизации и gates.

**Условие выпуска:** Фактический rendered flow, состояния, локали и ссылки подтверждены

**Rollback:** Изолированный код/flag rollback, сохраняя пользовательский ввод, принятую историю и существующие server IDs.

**Находки:** [PUB-002](AUDIT_REPORT_RU.md#pub-002).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-PUB-06`.

## V2-PUB-07

**Интеграция 20.10.2026:** Phase 12; AIS-PILOT-001; release scope `PUBLIC_WEB`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-pub-07).

**Переписать семь статей как инструкции по реальным ролям**

**P2 · PUBLIC · PUBLIC_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Сделать справку по ролям и операциям: условия, шаги, ожидаемый результат, ошибки/восстановление, контекстная ссылка. Писать после исправления фактических путей.

**Предлагаемый владелец:** Web UI owner + product/content reviewer. Конкретный исполнитель не назначен.

**Оценка:** S/M: оценить после baseline responsive check. **Порядок DAG:** 83.

**Роли:** Посетитель / новый и действующий пользователь.

**Экраны / семейства:** /ru/docs/*.

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Сделать справку по ролям и операциям: условия, шаги, ожидаемый результат, ошибки/восстановление, контекстная ссылка. Писать после исправления фактических путей.
2. Для каждого гайда: роль, prerequisites, точные действия/кнопки, подтверждённый результат, отмена, offline/retry, limits, следующий шаг. Сначала Worker report+correction, Manager review, Customer versioned response.

**Критерии приёмки — ещё не проверены:**

- **V2-PUB-07-AC-01 · NOT_RUN:** Новый пользователь проходит первый отчёт и возврат на доработку по инструкции, не угадывая названия кнопок.
- **V2-PUB-07-AC-02 · NOT_RUN:** Роль компании, владелец проекта и platform owner объяснены отдельно.

**Будущие проверки — NOT_RUN:**

- **V2-PUB-07-TEST-01 · NOT_RUN:** Moderated first-use walkthrough
- **V2-PUB-07-TEST-02 · NOT_RUN:** Проверка всех deep links в RU/EN/ES/IT

**Проверенные исходные точки:**

- [apps/web/app/[locale]/(public)/docs/[slug]/page.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28public%29/docs/%5Bslug%5D/page.tsx#L1)

**Условия остановки зависимого среза:**

- Неподтверждённый контракт или неожиданный scope — остановить зависимый срез и зафиксировать вопрос; продолжить независимые работы.
- Не выполнять merge/deploy/migration/provider/store actions без действующей авторизации и gates.

**Условие выпуска:** Фактический rendered flow, состояния, локали и ссылки подтверждены

**Rollback:** Изолированный код/flag rollback, сохраняя пользовательский ввод, принятую историю и существующие server IDs.

**Находки:** [PUB-001](AUDIT_REPORT_RU.md#pub-001).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-PUB-07`.

## V2-WEB-13

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-13).

**Правдивые названия меню и область поиска**

**P2 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Пункт меню однозначно описывает фактический экран, а поиск обещает только доступный scope.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** S: 1–2 дня. **Порядок DAG:** 84.

**Экраны / семейства:** F09; F15; F40.

**Основные действия:** Пункт меню однозначно описывает фактический экран, а поиск обещает только доступный scope..

**Обязательные зависимости:** [V2-ARCH-01](#v2-arch-01)

**Шаги реализации:**

1. Workload назвать Рабочая нагрузка, uploads — Загрузки, approvals — Согласования, devices — Устройства; сверить русский/английский glossary.
2. Развести задачи пользователя и служебные разделы, сохранить existing links/testIds.
3. До реального multi-entity search указать «Поиск задач»; ⌘K реализовать с доступным focus либо убрать affordance.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-13-AC-01 · NOT_RUN:** Ни один пункт не обещает supply/finance/document registry, которого он не открывает.
- **V2-WEB-13-AC-02 · NOT_RUN:** Search input, shortcut и results имеют один scope и сохраняют locale/query.
- **V2-WEB-13-AC-03 · NOT_RUN:** Каждая роль видит только разрешённые route actions; same labels на phone и desktop.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-13-TEST-01 · NOT_RUN:** Registry label/destination assertions; keyboard shortcut and navigation smoke.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/canon/CanonSidebarNav.tsx:37](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/CanonSidebarNav.tsx#L37)
- [apps/web/components/canon/CanonTopBar.tsx:44](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/CanonTopBar.tsx#L44)
- [apps/web/messages/ru.json:30](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/messages/ru.json#L30)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-13](AUDIT_REPORT_RU.md#web-13).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-13`.

## V2-WEB-14

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-14).

**Убрать ложные действия в заголовках**

**P2 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Favorite и project ellipsis имеют реальное действие либо не выглядят интерактивными.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** XS/S: 0.5–1 день. **Порядок DAG:** 85.

**Экраны / семейства:** F08; F09; F10.

**Основные действия:** Favorite и project ellipsis имеют реальное действие либо не выглядят интерактивными..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Default Favorite выключить на неиспользующих его страницах или реализовать только при существующем persistent contract.
2. Ellipsis наполнить разрешёнными existing project actions либо удалить пустую кнопку без удаления контента.
3. Localized accessible names и return focus для настоящего menu.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-14-AC-01 · NOT_RUN:** В актуальном action registry нет достижимой Favorite/ellipsis без outcome.
- **V2-WEB-14-AC-02 · NOT_RUN:** Tab order не останавливается на декоративных элементах.
- **V2-WEB-14-AC-03 · NOT_RUN:** Не добавлены локальные fake favorites, которые теряются после reload.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-14-TEST-01 · NOT_RUN:** Source action audit plus targeted keyboard interaction screenshots.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/canon/CanonPageHeader.tsx:24](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/CanonPageHeader.tsx#L24)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx:244](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/DashboardProjectDetailClient.tsx#L244)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-14](AUDIT_REPORT_RU.md#web-14).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-14`.

## V2-WEB-18

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-18).

**Согласовать период существующего графика работ**

**P2 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Заголовки, day strip и списки показывают один выбранный период.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** S: 1–2 дня. **Порядок DAG:** 86.

**Экраны / семейства:** F35.

**Основные действия:** Заголовки, day strip и списки показывают один выбранный период..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Передавать lookaheadDays во все зависимые views/labels; сохранять existing Gantt helpers.
2. Сделать Week/Month действительно разными периодами либо переименовать их в реальные list modes.
3. Сохранить selected milestone и links в project tasks при смене периода.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-18-AC-01 · NOT_RUN:** Выбор14/30 меняет и bucket, и label, и визуально обещанный диапазон.
- **V2-WEB-18-AC-02 · NOT_RUN:** Milestone на day10 не находится в «следующие7» при режиме14.
- **V2-WEB-18-AC-03 · NOT_RUN:** Gantt/mobile list create/select/related task actions работают по прежнему API.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-18-TEST-01 · NOT_RUN:** Schedule-health/layout fixtures day7/8/14/15/30, timezone boundaries.
- **V2-WEB-18-TEST-02 · NOT_RUN:** Phone/desktop period switch and keyboard screenshot validation.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/canon/ProjectScheduleCanonPanel.tsx:43](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/ProjectScheduleCanonPanel.tsx#L43)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-18](AUDIT_REPORT_RU.md#web-18).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-18`.

## V2-WEB-19

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001, AIS-OWNER-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-19).

**Доступность основных Canon действий**

**P2 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Project navigation, mobile document preview и status metadata доступны с клавиатуры и assistive technology.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 2–4 дня. **Порядок DAG:** 87.

**Экраны / семейства:** F09; F10; F14; F34.

**Основные действия:** Project navigation, mobile document preview и status metadata доступны с клавиатуры и assistive technology..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Использовать корректные tab ids/selected relationships либо настоящий nav/link pattern без ложного tabpanel labeling.
2. Mobile preview перевести на existing accessible Modal/sheet primitive с trap/Escape/restore; сохранить source selection.
3. Status badges дополнить текстом, icon buttons — локализованным именем; field labels связать с controls.
4. Измерить actual contrast/zoom/targets в rendered build; не ставить WCAG PASS по source.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-19-AC-01 · NOT_RUN:** Нет aria-labelledby на отсутствующий id; active tab/section announces корректно.
- **V2-WEB-19-AC-02 · NOT_RUN:** Открыть/закрыть preview можно keyboard; focus внутри до close, затем возвращается на исходный item.
- **V2-WEB-19-AC-03 · NOT_RUN:** Team status понятен без цвета; no clipped content на выбранных zoom/long-text fixtures.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-19-TEST-01 · NOT_RUN:** Targeted accessibility tree + keyboard + screen reader runs after implementation.
- **V2-WEB-19-TEST-02 · NOT_RUN:** Render desktop/phone with en/ru/es/it longest copy; compare good shared Modal.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/canon/CanonProjectTabBar.tsx:83](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/CanonProjectTabBar.tsx#L83)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx:262](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/DashboardProjectDetailClient.tsx#L262)
- [apps/web/components/canon/CanonLocaleSwitcher.tsx:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/CanonLocaleSwitcher.tsx#L9)
- [apps/web/app/[locale]/(dashboard)/dashboard/support/SupportClient.tsx:140](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/support/SupportClient.tsx#L140)
- [apps/web/components/canon/DashboardTeamCanonPage.tsx:157](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/DashboardTeamCanonPage.tsx#L157)
- [apps/web/components/ui/Modal.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/ui/Modal.tsx#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-19](AUDIT_REPORT_RU.md#web-19).

**Канон:** Phase 1; 2; 13; AIS-PILOT-001; AIS-OWNER-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-19`.

## V2-WEB-20

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001, AIS-OWNER-001; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-20).

**Локаль, тексты и сохранение навигационного контекста**

**P2 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Смена языка не теряет task/tab/filter и доступна на мобильном; support/auth copy использует текущую локаль.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 2–3 дня. **Порядок DAG:** 88.

**Экраны / семейства:** F05; F18; F19; F33.

**Основные действия:** Смена языка не теряет task/tab/filter и доступна на мобильном; support/auth copy использует текущую локаль..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Сохранять path+safe query+anchor в locale links; включить language control в mobile account/menu.
2. Локализовать Support и accessibility strings, не копировать API error/status без объяснения.
3. Проверить locale-preserving legacy aliases/provider next и единый glossary для worker/contractor/owner/customer.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-20-AC-01 · NOT_RUN:** Смена ru→en→es→it сохраняет projectId/taskId/tab/date filter и ожидаемый return.
- **V2-WEB-20-AC-02 · NOT_RUN:** Phone user имеет доступ к языку и logout.
- **V2-WEB-20-AC-03 · NOT_RUN:** Все новые dashboard strings присутствуют в4 bundles; i18n:check проходит требуемый scope.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-20-TEST-01 · NOT_RUN:** Locale URL builder tests; auth/provider safe-next fixtures.
- **V2-WEB-20-TEST-02 · NOT_RUN:** RU support create/reply/cancel and long IT/ES button labels screenshot.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/canon/CanonProjectTabBar.tsx:83](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/CanonProjectTabBar.tsx#L83)
- [apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx:262](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/projects/%5Bid%5D/DashboardProjectDetailClient.tsx#L262)
- [apps/web/components/canon/CanonLocaleSwitcher.tsx:9](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/CanonLocaleSwitcher.tsx#L9)
- [apps/web/app/[locale]/(dashboard)/dashboard/support/SupportClient.tsx:140](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/support/SupportClient.tsx#L140)
- [apps/web/components/canon/DashboardTeamCanonPage.tsx:157](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/DashboardTeamCanonPage.tsx#L157)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-19](AUDIT_REPORT_RU.md#web-19).

**Канон:** Phase 1; 2; 13; AIS-PILOT-001; AIS-OWNER-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-20`.

## V2-WEB-27

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-27).

**Операционные экраны загрузок, устройств и нагрузки**

**P2 · WEB · VALIDATION_AND_INTEGRATION · PROPOSED / NOT_RUN**

**Результат:** Оператор понимает scope и может перейти от технического состояния к предметной задаче.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 2–3 дня. **Порядок DAG:** 89.

**Экраны / семейства:** F15.

**Основные действия:** Оператор понимает scope и может перейти от технического состояния к предметной задаче..

**Обязательные зависимости:** [V2-WEB-13](#v2-web-13)

**Шаги реализации:**

1. Сверить actual filter/pagination/export behavior и явно назвать current export scope.
2. Загрузки связывать с upload/report/task, устройства с worker, workload с authoritative action_url.
3. Recurring-rule toggle подтверждать сервером; ошибки/denied не рисуют активный rule.
4. Новые функции склада/закупок сюда не добавлять: deferred materials roadmap отдельный.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-27-AC-01 · NOT_RUN:** Все row actions открывают правильный объект; not found/revoked даёт выход.
- **V2-WEB-27-AC-02 · NOT_RUN:** Экспорт ограниченного набора подписан; counts не выдаются за весь portfolio.
- **V2-WEB-27-AC-03 · NOT_RUN:** Failed toggle возвращает подтверждённое состояние и повторяемую ошибку.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-27-TEST-01 · NOT_RUN:** Controlled page2/filter/export/toggle failure tests.
- **V2-WEB-27-TEST-02 · NOT_RUN:** Keyboard and phone table/cards validation; partial endpoint outage.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/app/[locale]/(dashboard)/dashboard/uploads/DashboardUploadsClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/uploads/DashboardUploadsClient.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/devices/DashboardDevicesClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/devices/DashboardDevicesClient.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/workload/WorkloadCanonPage.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/workload/WorkloadCanonPage.tsx#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** Validation/integration completion текущего scope.

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-27`.

## V2-WEB-28

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001, AIS-OWNER-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-28).

**Ролевая помощь, поддержка и security settings**

**P2 · WEB · FIX_AND_VALIDATION · PROPOSED / NOT_RUN**

**Результат:** Помощь даёт правильный следующий шаг, а обращение/изменение метода входа имеет ясный результат.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 2–4 дня. **Порядок DAG:** 90.

**Экраны / семейства:** F18; F19.

**Основные действия:** Помощь даёт правильный следующий шаг, а обращение/изменение метода входа имеет ясный результат..

**Обязательные зависимости:** [V2-WEB-20](#v2-web-20)

**Шаги реализации:**

1. Role/help context брать из existing session capabilities, не только pathname owner/manager heuristic.
2. Guide actions включают доступный href/action, score не выдаётся за ML confidence.
3. Support list/thread/send получают независимые load/error/retry states и локализованный текст.
4. Проверить last-auth-method, link/unlink provider, cancel callback и safe return; не объединять identities ошибочно.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-28-AC-01 · NOT_RUN:** Ни worker, ни customer не получают неподходящую manager launch step без объяснения.
- **V2-WEB-28-AC-02 · NOT_RUN:** Failed load tickets не выглядит как отсутствие обращений; failed send сохраняет draft.
- **V2-WEB-28-AC-03 · NOT_RUN:** Provider cancel/failed unlink не оставляет пользователя без входа или false linked state.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-28-TEST-01 · NOT_RUN:** Help role/action projection tests and support partial failure.
- **V2-WEB-28-TEST-02 · NOT_RUN:** Auth methods recovery tests plus RU UI scenarios; provider live flow только в разрешённой среде.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/help/HelpCenterClient.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/help/HelpCenterClient.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/dashboard/support/SupportClient.tsx:41](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/dashboard/support/SupportClient.tsx#L41)
- [apps/web/components/auth/AuthMethodsSettingsCard.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/auth/AuthMethodsSettingsCard.tsx#L1)
- [apps/web/app/api/v1/help/assistant/route.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/api/v1/help/assistant/route.ts#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-07](AUDIT_REPORT_RU.md#web-07), [WEB-19](AUDIT_REPORT_RU.md#web-19).

**Канон:** Phase 1; 2; 13; AIS-PILOT-001; AIS-OWNER-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-28`.

## V2-WEB-32

**Интеграция 20.10.2026:** Phase 1; AIS-PILOT-001; release scope `CONTRACTOR_CORE`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-32).

**Один достоверный рабочий день и портфельный action list**

**P2 · WEB · VALIDATION_AND_INTEGRATION · PROPOSED / NOT_RUN**

**Результат:** Manager начинает с настоящих приоритетных действий, а данные имеют правильную давность/coverage.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 2–4 дня. **Порядок DAG:** 92.

**Экраны / семейства:** F07; F16.

**Основные действия:** Manager начинает с настоящих приоритетных действий, а данные имеют правильную давность/coverage..

**Обязательные зависимости:** [V2-WEB-07](#v2-web-07), [V2-WEB-17](#v2-web-17), [V2-ARCH-01](#v2-arch-01)

**Шаги реализации:**

1. Сопоставить существующие portfolio/control, ops/overview, workload, attention и phase1 daily control; использовать один semantic action descriptor.
2. Ранжирование/overdue/attention сделать объяснимым; job failures отделить от construction risks.
3. Дать primary next action и источник; неизвестный/partial block не исключает другие полезные действия.
4. Сохранить совместимость /portfolio; не строить ещё один дублирующий dashboard.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-32-AC-01 · NOT_RUN:** Карточка priority открывает объект, где действие действительно можно выполнить.
- **V2-WEB-32-AC-02 · NOT_RUN:** Source time и scope видимы; unknown не снижает risk к healthy.
- **V2-WEB-32-AC-03 · NOT_RUN:** Одно действие не считается несколько раз только потому, что пришло из двух read models.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-32-TEST-01 · NOT_RUN:** Aggregation/deduplication/sourceURL fixtures; role-based priority scenario.
- **V2-WEB-32-TEST-02 · NOT_RUN:** Observed task completion time baseline до численных KPI целей.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/canon/DashboardCanonHome.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/DashboardCanonHome.tsx#L1)
- [apps/web/app/[locale]/(dashboard)/portfolio/PortfolioOverview.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/portfolio/PortfolioOverview.tsx#L1)
- [apps/web/lib/domain/projects/project-attention.repository.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/lib/domain/projects/project-attention.repository.ts#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** Validation/integration completion текущего scope.

**Канон:** Phase 1; 7; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-32`.


# M07 — Коммерческий и публичный выпуск

## V2-WEB-17

**Интеграция 20.10.2026:** Phase 4; AIS-PILOT-001, AIS-OWNER-001; release scope `COMMERCIAL`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-17).

**Корректные денежные агрегаты и полнота портфеля**

**P2 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Итоги имеют явные scope/currency/coverage, а перерасход остаётся видимым численно.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 2–4 дня. **Порядок DAG:** 91.

**Экраны / семейства:** F07; F21; F37.

**Основные действия:** Итоги имеют явные scope/currency/coverage, а перерасход остаётся видимым численно..

**Обязательные зависимости:** [V2-ARCH-06](#v2-arch-06)

**Шаги реализации:**

1. Агрегировать весь объявленный portfolio scope на сервере или честно назвать первые6/partial.
2. Группировать деньги по currency; currency customer total брать из тех же approved records, что входят в сумму. FX только при существующем reviewed conversion contract.
3. Сохранить uncapped numeric utilization и capped visual track; показать numerator/denominator.
4. Пустой/неполученный budget не считать нулевым расходом или отсутствием риска.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-17-AC-01 · NOT_RUN:** 7+ проектов не даёт portfolio total по6 без предупреждения.
- **V2-WEB-17-AC-02 · NOT_RUN:** EUR+USD не складывается в единую сумму с произвольным symbol; draft первой строки не задаёт approved-total currency.
- **V2-WEB-17-AC-03 · NOT_RUN:** 125% budget показывает125%, even if bar100%; missing planned amount сообщает unknown.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-17-TEST-01 · NOT_RUN:** Single/mixed currency, incomplete summaries, overrun, missing denominator fixtures.
- **V2-WEB-17-TEST-02 · NOT_RUN:** Customer response projection test no costs/margin; aggregation query readback.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/components/canon/DashboardCanonHome.tsx:63](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/DashboardCanonHome.tsx#L63)
- [apps/web/components/canon/ClientPortalCanonView.tsx:36](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/ClientPortalCanonView.tsx#L36)
- [apps/web/components/canon/canon-live-data.ts:105](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/canon-live-data.ts#L105)
- [apps/web/components/canon/ProjectCommandCenterOverview.tsx:115](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/canon/ProjectCommandCenterOverview.tsx#L115)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-17](AUDIT_REPORT_RU.md#web-17).

**Канон:** Phase 1; 4; 7; 13; AIS-PILOT-001; AIS-OWNER-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-17`.

## V2-PUB-08

**Интеграция 20.10.2026:** Phase 12; AIS-PILOT-001; release scope `PUBLIC_WEB`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-pub-08).

**Подготовить утверждённые публичные условия и правдивые материалы**

**P2 · PUBLIC · PUBLIC_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Подготовить пакет для уполномоченного владельца/юриста: данные оператора, контакты, действительные процессы данных, версии и локализации. Публиковать только утверждённую редакцию в существующем release gate.

**Предлагаемый владелец:** Web UI owner + product/content reviewer. Конкретный исполнитель не назначен.

**Оценка:** S/M: оценить после baseline responsive check. **Порядок DAG:** 93.

**Роли:** Посетитель / новый и действующий пользователь.

**Экраны / семейства:** /ru/privacy, /ru/terms.

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. Подготовить пакет для уполномоченного владельца/юриста: данные оператора, контакты, действительные процессы данных, версии и локализации. Публиковать только утверждённую редакцию в существующем release gate.
2. Владелец утверждает legal/operator details и реальный процесс данных. У кейсов отличить illustrative scenario от доказанного внедрения; ссылки магазинов только после подтверждённой публикации. Данный audit не даёт юридическое заключение.

**Критерии приёмки — ещё не проверены:**

- **V2-PUB-08-AC-01 · NOT_RUN:** У страниц есть утверждённый владелец, версия и дата; текст соответствует реально включённым функциям.
- **V2-PUB-08-AC-02 · NOT_RUN:** Ссылки из регистрации, поддержки и форм ведут к той же редакции.

**Будущие проверки — NOT_RUN:**

- **V2-PUB-08-TEST-01 · NOT_RUN:** Link/version consistency
- **V2-PUB-08-TEST-02 · NOT_RUN:** Фактическое согласование уполномоченным владельцем

**Условия остановки зависимого среза:**

- Неподтверждённый контракт или неожиданный scope — остановить зависимый срез и зафиксировать вопрос; продолжить независимые работы.
- Не выполнять merge/deploy/migration/provider/store actions без действующей авторизации и gates.

**Условие выпуска:** Фактический rendered flow, состояния, локали и ссылки подтверждены

**Rollback:** Изолированный код/flag rollback, сохраняя пользовательский ввод, принятую историю и существующие server IDs.

**Находки:** [PUB-005](AUDIT_REPORT_RU.md#pub-005).

**Канон:** Phase 1; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-PUB-08`.

## V2-WEB-21

**Интеграция 20.10.2026:** Phase 12; AIS-PILOT-001; release scope `COMMERCIAL`; `DETAIL_EXISTING_REQUIREMENT`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-21).

**Честное ожидание активации подписки без изменения billing gates**

**P2 · WEB · FIX · PROPOSED / NOT_RUN**

**Результат:** Пользователь понимает pending/timeout/error и не получает неподтверждённое обещание active subscription.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** S: 1–2 дня. **Порядок DAG:** 94.

**Экраны / семейства:** F30.

**Основные действия:** Пользователь понимает pending/timeout/error и не получает неподтверждённое обещание active subscription..

**Обязательные зависимости:** Нет отдельного предшествующего пакета; текущий baseline и scope проверить перед началом.

**Шаги реализации:**

1. После24 refresh attempts выставить UI timeout/delayed-confirmation state и безопасный существующий refresh/support next action.
2. Показать billing read error отдельно от no records; документировать, какая legacy read model отображена.
3. Любое объединение billing read sources выделить в согласованный billing migration slice после shadow/staging/cutover gates; этот ticket его не выполняет.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-21-AC-01 · NOT_RUN:** Через2 минуты без подтверждения не остаётся бесконечное «Проверяем»; новый checkout автоматически не запускается.
- **V2-WEB-21-AC-02 · NOT_RUN:** Return/cancel route и refreshed active state объясняют текущий server verdict.
- **V2-WEB-21-AC-03 · NOT_RUN:** Stripe payloads, entitlement source, checkout mutations и seven-day gates идентичны baseline.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-21-TEST-01 · NOT_RUN:** Fake timers на24attempt timeout и active transition; billing read error fixtures.
- **V2-WEB-21-TEST-02 · NOT_RUN:** Contract regression asserts existing checkout payload/gates unchanged; no live payment during audit.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/app/[locale]/(dashboard)/billing/page.tsx:11](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28dashboard%29/billing/page.tsx#L11)
- [apps/web/components/billing/SubscribePlansClient.tsx:82](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/billing/SubscribePlansClient.tsx#L82)
- [apps/web/app/[locale]/(public)/subscribe/page.tsx:46](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28public%29/subscribe/page.tsx#L46)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Любая необходимость менять checkout/Stripe/entitlement resolution: отдельный billing owner slice с прежними gates.
- Нет доказательств7-day zero-drift/staging/cutover — read-source migration остаётся BLOCKED, UI работа продолжается.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** [WEB-20](AUDIT_REPORT_RU.md#web-20).

**Канон:** Phase 12; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-21`.

## V2-WEB-30

**Интеграция 20.10.2026:** Phase 12; AIS-PILOT-001; release scope `PUBLIC_WEB`; `INTEGRATION_VALIDATION_ONLY`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-web-30).

**Public acquisition и визуальные регрессии по результатам Product Design**

**P2 · WEB · INTEGRATION_VALIDATION_ONLY · PROPOSED / NOT_RUN**

**Результат:** Все28 public families ведут пользователя к нужному действию, остаются читаемыми и сохраняют intent.

**Предлагаемый владелец:** Web feature owner + reviewer. Конкретный исполнитель не назначен.

**Оценка:** M: 2–4 дня. **Порядок DAG:** 95.

**Экраны / семейства:** F01; F02; F03; F04; F05.

**Основные действия:** Все28 public families ведут пользователя к нужному действию, остаются читаемыми и сохраняют intent..

**Обязательные зависимости:** [V2-PUB-01](#v2-pub-01), [V2-PUB-02](#v2-pub-02), [V2-PUB-03](#v2-pub-03), [V2-PUB-04](#v2-pub-04), [V2-PUB-05](#v2-pub-05), [V2-PUB-06](#v2-pub-06), [V2-PUB-07](#v2-pub-07), [V2-PUB-08](#v2-pub-08)

**Авторитетное уточнение объёма:**

- Проверить интеграцию V2-PUB-01–08 и общий acquisition path. Самостоятельно повторно не реализовывать те же public fixes; их owners и оценки находятся в PUB tickets.

Исходные platform steps ниже читаются в пределах авторитетного уточнения; не дублировать чужую реализацию.

**Шаги реализации:**

1. Подключить свежие PUB findings root: hero overlay, primary public link/auth button contrast, pricing comparison grid, docs card overlap, contact step focus и intent.
2. Исправлять scoped selectors/layout, сохраняя V4.1/V4.3 render direction; не redesign entire site из-за отдельных CSS defects.
3. Проверить все public internal/external links, меню, FAQ roles, dynamic docs/cases, тарифные CTA и возвращение в кабинет.
4. Не считать статические screenshots product capability и не добавлять fake business metrics; catalog price authority сохраняется.

**Критерии приёмки — ещё не проверены:**

- **V2-WEB-30-AC-01 · NOT_RUN:** Hero paragraph не перекрыт product illustration на проверенных widths/long locales.
- **V2-WEB-30-AC-02 · NOT_RUN:** Primary <a>/<Link>/<button> имеют одинаковую заданную контрастную variant семантику.
- **V2-WEB-30-AC-03 · NOT_RUN:** Pricing comparison rows расположены последовательно, inner5columns читаемы с контролируемым scroll.
- **V2-WEB-30-AC-04 · NOT_RUN:** Docs CardLink занимает реальную высоту grid item; все7 карточек читаются без перекрытия и имеют полноценную focus/hit area.
- **V2-WEB-30-AC-05 · NOT_RUN:** Auth primary Button реализует dark text token на yellow background; font-size utility не перекрывает color. Проверить rendered CSS всех variants/sizes.
- **V2-WEB-30-AC-06 · NOT_RUN:** Contact step2 получает focus и intent; submit receipt фактичен; весь public nav/CTA audit закрыт root evidence.

**Будущие проверки — NOT_RUN:**

- **V2-WEB-30-TEST-01 · NOT_RUN:** Root Product Design screenshot suite on target desktop/phone/long locales; scoped CSS regression.
- **V2-WEB-30-TEST-02 · NOT_RUN:** Contact step1→step2→back/cancel без external submission для preview; full lead submit только с разрешённым test endpoint.

**Визуальная приёмка исходного пакета:**

- Authenticated role-specific screenshots BEFORE/AFTER on desktop and narrow phone viewport.
- Loading/empty/error/forbidden/partial-success states; keyboard focus and back/locale restoration.
- Visual validation is NOT_RUN; code or generated mockup does not constitute a PASS.

**Проверенные исходные точки:**

- [apps/web/styles/website-v41.css:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/styles/website-v41.css#L1)
- [apps/web/components/public/v41/HomeHero.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/public/v41/HomeHero.tsx#L1)
- [apps/web/components/public/v43/InternalPageHero.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/public/v43/InternalPageHero.tsx#L1)
- [apps/web/components/public/v43/PricingCard.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/public/v43/PricingCard.tsx#L1)
- [apps/web/components/public/v43/PilotForm.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/public/v43/PilotForm.tsx#L1)
- [apps/web/components/public/v41/V41PilotContext.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/public/v41/V41PilotContext.tsx#L1)
- [apps/web/app/[locale]/(public)/docs/page.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/%5Blocale%5D/%28public%29/docs/page.tsx#L1)
- [apps/web/components/ui/Button.tsx:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/components/ui/Button.tsx#L1)
- [apps/web/app/design-tokens.css:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/app/design-tokens.css#L1)
- [apps/web/tailwind.config.ts:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/apps/web/tailwind.config.ts#L1)

**Дополнительные ограничения:**

- Preserve existing Canon/V4 components and service contracts; isolate the smallest slice.
- Do not change tenant/project/platform role semantics or expose contractor internal finances to customer.
- No fabricated data/status/AI certainty; keep empty/error/unknown distinct.
- No merge/deploy/migration/store upload is authorized by this plan.

**Условия остановки зависимого среза:**

- Current PR/head overlaps: rebase/resume it; do not open a parallel implementation.
- Unexpected auth/projection/contract behavior: stop that slice and reconcile source + tests before widening scope.

**Условие выпуска:** Affected journey proof on current build

**Rollback:** Isolated reviewed revert or feature flag preserving original data/contracts; do not roll back by deleting accepted data or bypassing permission gates.

**Находки:** Validation/integration completion текущего scope.

**Канон:** Phase 1; 12; 13; AIS-PILOT-001.

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-WEB-30`.


# M08 — Сценарная приёмка выбранного выпуска

## V2-AND-13

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001; release scope `ANDROID_DEFERRED`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-and-13).

**Android scope lock и воспроизводимый non-bypass release gate**

**P1_GATE · ANDROID · GATE_ONLY_NO_PARITY_EXPANSION · PROPOSED / NOT_RUN**

**Результат:** Записать current minimum и текущую роль Android в каноне, не менять iOS-primary молча. README и store promises не должны перечислять несуществующие tasks/team/AI/offline features.

**Предлагаемый владелец:** Android owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** M QA plus coordinated owner scheduling; duration depends on device/backend access. **Порядок DAG:** 96.

**Роли:** Product owner; Android lead; Backend lead; QA.

**Экраны / семейства:** все 8 current destinations +2 overlays; три ключевых journeys.

**Основные действия:** Проверить конкретный build; Принять minimum scope; Зафиксировать PASS/PARTIAL/BLOCKED; Отложить широкую parity.

**Обязательные зависимости:** [V2-AND-01](#v2-and-01), [V2-AND-02](#v2-and-02), [V2-AND-03](#v2-and-03), [V2-AND-04](#v2-and-04), [V2-AND-05](#v2-and-05), [V2-AND-06](#v2-and-06), [V2-AND-07](#v2-and-07), [V2-AND-08](#v2-and-08), [V2-AND-09](#v2-and-09), [V2-AND-10](#v2-and-10), [V2-AND-11](#v2-and-11), [V2-AND-12](#v2-and-12)

**Шаги реализации:**

1. Записать current minimum и текущую роль Android в каноне, не менять iOS-primary молча. README и store promises не должны перечислять несуществующие tasks/team/AI/offline features.
2. Сохранить существующие launch/tag/submit JSON tests и добавить необходимые invariants из tickets. Manager instrumentation уже существует — включить его в gate, не создавать видимость отсутствовавшего target.
3. Обновить Worker Maestro: start shift→assigned task→before+after→server submit; убрать устаревший Photo attached wait и optional taps, которые маскируют required step. Manager выбирает конкретный созданный report и asserts server decision.
4. Запускать выбранные tests на SHA/build variant и фиксировать команды/exit/results/device/locale. Workflow manual сейчас — расширение CI выбирать по policy, не заявлять обязательным до согласования ресурсов.
5. Не использовать clearState на реальном устройстве/аккаунте с работой; isolated synthetic test tenant/device only.
6. Native proof включает no-network/restart/401/403/404/500/409/permissions/A-B owner/101+ paging/push lifecycle; не только launch.
7. Подготовить release evidence pack с source/build/environment/version/photo bypass state. Store upload/approval отдельный owner gate, не действие Cursor по умолчанию.

**API и контракты:**

- Только scoped test fixtures existing/approved additive endpoints; no production mutation

**Состояния, которые нужно сохранить или реализовать:**

- NOT_RUN
- PASS
- FAIL
- PARTIAL
- BLOCKED_TOOLCHAIN
- BLOCKED_CONTRACT
- OWNER_GATE

**Критерии приёмки — ещё не проверены:**

- **V2-AND-13-AC-01 · NOT_RUN:** AC01 Current Android minimum и later parity перечислены отдельно; Customer Android/social auth/chat/docs/Manager AI/full Manager push не появляются без named scope.
- **V2-AND-13-AC-02 · NOT_RUN:** AC02 Unit + contract + both app launch instrumentation результаты привязаны к build SHA; отсутствующий runtime обозначен NOT_RUN, не PASS.
- **V2-AND-13-AC-03 · NOT_RUN:** AC03 Worker mandatory start/task/before/after/non-bypass submit проверен; Manager mandatory exact report review и Worker outcome доказаны.
- **V2-AND-13-AC-04 · NOT_RUN:** AC04 Three end-to-end journeys: new report→review, changes_requested→new evidence→accept, offline/expiry/restart→same intent recover без logical duplicates.
- **V2-AND-13-AC-05 · NOT_RUN:** AC05 Matrix All/A/B/unassigned/101+/205rows/counts, notes/history,401/403/404/500, changes409+ACK409 и queue crash points приложена.
- **V2-AND-13-AC-06 · NOT_RUN:** AC06 Full Worker push lifecycle и denied permission fallback имеют отдельные current test receipts; Manager push explicitly later.
- **V2-AND-13-AC-07 · NOT_RUN:** AC07 Four locales/large text/TalkBack/back/picker cancel screens проверены на согласованных устройствах; definition counts не выдаются за tap coverage.
- **V2-AND-13-AC-08 · NOT_RUN:** AC08 source branch/release branch freshness, runtime config и signing/store prerequisites проверяются отдельно; identical application SHA не доказывает flags/prod auth/runtime.
- **V2-AND-13-AC-09 · NOT_RUN:** AC09 Ноль P1 data-loss/ownership/evidence failures в agreed minimum; additive contract gates закрыты до release claim.
- **V2-AND-13-AC-10 · NOT_RUN:** AC10 APK/AAB/store upload не выполняется автоматически и не объявляется пройденным по историческим June evidence.

**Будущие проверки — NOT_RUN:**

- **V2-AND-13-TEST-01 · NOT_RUN:** cd android; ./gradlew :shared:testDebugUnitTest :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug — проверить actual task names/pinned toolchain before use; не выполнено в аудите.
- **V2-AND-13-TEST-02 · NOT_RUN:** :AiStroykaWorker:connectedDebugAndroidTest + :AiStroykaManager:connectedDebugAndroidTest на isolated configured test device; commands/result captured.
- **V2-AND-13-TEST-03 · NOT_RUN:** Updated Maestro/manual test matrix with deterministic report IDs and exact server assertions; no optional required action.
- **V2-AND-13-TEST-04 · NOT_RUN:** Evidence index includes SHA,variant,client profile,device/API,locale,time,expected/actual,private-data-safe screenshot/trace.

**Предлагаемое деление PR:**

- Scope/readme + current test fixtures
- Worker/Manager mandatory flow automation
- Dated release evidence and owner review

**Предлагаемые новые пути — наличие файлов не утверждается:**

- `docs/tasks/2026-10-19-android-minimum-handoff.md`

**Проверенные исходные точки:**

- [android/README.md:3](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/README.md#L3)
- [maestro/flows/android_worker_pilot.yaml:35](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/maestro/flows/android_worker_pilot.yaml#L35)
- [maestro/flows/android_worker_full_launch.yaml:34](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/maestro/flows/android_worker_full_launch.yaml#L34)
- [maestro/flows/android_manager_pilot.yaml:35](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/maestro/flows/android_manager_pilot.yaml#L35)
- [.github/workflows/android-instrumented-smoke.yml:3](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/.github/workflows/android-instrumented-smoke.yml#L3)
- [android/AiStroykaWorker/src/androidTest/java/ai/aistroyka/worker/WorkerAppLaunchInstrumentedTest.kt:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaWorker/src/androidTest/java/ai/aistroyka/worker/WorkerAppLaunchInstrumentedTest.kt#L1)
- [android/AiStroykaManager/src/androidTest/java/ai/aistroyka/manager/ManagerAppLaunchInstrumentedTest.kt:22](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/AiStroykaManager/src/androidTest/java/ai/aistroyka/manager/ManagerAppLaunchInstrumentedTest.kt#L22)
- [android/shared/src/test/java/ai/aistroyka/shared/SubmitReportBodyTest.kt:7](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/android/shared/src/test/java/ai/aistroyka/shared/SubmitReportBodyTest.kt#L7)

**Условия остановки зависимого среза:**



**Условие выпуска:** NO_GO по умолчанию до подтверждения реализации/контрактов/runtime. Сам готовый plan и source revalidation не меняют deferred Android first-pilot status.

**Rollback:** Scope/release claim отозвать до исправления gate, сохранить evidence и pending user work. Не расширять тесты бесконечно после закрытия конкретных рисков.

**Находки:** [AND-019](AUDIT_REPORT_RU.md#and-019), [AND-020](AUDIT_REPORT_RU.md#and-020), [AND-011](AUDIT_REPORT_RU.md#and-011).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-AND-13`.

## V2-IOS-30

**Интеграция 20.10.2026:** Phase 13; AIS-PILOT-001, AIS-OWNER-002, AIS-EVID-002, AIS-VISION-003; release scope `CONTRACTOR_CORE`; `CROSS_CUTTING_ACCEPTANCE`. [Привязка и ограничения](CANONICAL_MAPPING_RU.md#v2-ios-30).

**Доказать основной цикл на production типах и реальных устройствах**

**P1 · IOS · CURRENT_PRODUCT_COMPLETION · PROPOSED / NOT_RUN**

**Результат:** Получить проверяемый результат для конкретной сборки

**Предлагаемый владелец:** iOS owner + backend reviewer. Конкретный исполнитель не назначен.

**Оценка:** L. **Порядок DAG:** 97.

**Роли:** Worker; Manager; Customer.

**Экраны / семейства:** CI; Все критические cross-role flows; Release decision.

**Основные действия:** Получить проверяемый результат для конкретной сборки.

**Ввод и предпосылки:** completed implementation slices; test roles/dataset; current build/backend manifest; physical devices/runner; explicit release scope.

**Обязательные зависимости:** [V2-IOS-02](#v2-ios-02), [V2-IOS-03](#v2-ios-03), [V2-IOS-04](#v2-ios-04), [V2-IOS-05](#v2-ios-05), [V2-IOS-06](#v2-ios-06), [V2-IOS-07](#v2-ios-07), [V2-IOS-08](#v2-ios-08), [V2-IOS-09](#v2-ios-09), [V2-IOS-10](#v2-ios-10), [V2-IOS-11](#v2-ios-11), [V2-IOS-12](#v2-ios-12), [V2-IOS-13](#v2-ios-13), [V2-IOS-14](#v2-ios-14), [V2-IOS-15](#v2-ios-15), [V2-IOS-16](#v2-ios-16), [V2-IOS-17](#v2-ios-17), [V2-IOS-18](#v2-ios-18), [V2-IOS-19](#v2-ios-19), [V2-IOS-20](#v2-ios-20), [V2-IOS-21](#v2-ios-21), [V2-IOS-22](#v2-ios-22), [V2-IOS-23](#v2-ios-23), [V2-IOS-24](#v2-ios-24), [V2-IOS-25](#v2-ios-25), [V2-IOS-26](#v2-ios-26), [V2-IOS-27](#v2-ios-27), [V2-IOS-28](#v2-ios-28), [V2-IOS-29](#v2-ios-29)

**Ограничение scope выпуска:**

- Исходный полный dependency set — критерий всей iOS программы. Отдельные contractor-ops, Customer и AI gates используют только относящиеся к ним задачи; не ждать Customer для независимого contractor-ops fix.

**Шаги реализации:**

1. Заменить Self copies в критических rule tests вызовом production code; сохранить полезные Shared/auth/publication tests.
2. Добавить обязательные slice tests после login smoke: draft/media/retry/role switch и Customer capability/version; executed/skipped/failed считать отдельно.
3. Собрать device evidence для camera/upload/process death/APNs/large text, связывая artifact с SHA/build/OS/role/network.
4. Сделать отчёт по достижению результата, а не только зелёному job: Worker source→Manager review→correction→explicit publish→Customer allowed read/respond.

**API и контракты:**

- Существующие staging auth/task/report/media/review/publication/customer contracts; production mutations не нужны для первых gates

**Состояния, которые нужно сохранить или реализовать:**

- PROPOSED
- IMPLEMENTED
- LOCAL_VERIFIED
- STAGING_VERIFIED
- DEVICE_VERIFIED
- PILOT_ACCEPTED
- BLOCKED

**Критерии приёмки — ещё не проверены:**

- **V2-IOS-30-AC-01 · NOT_RUN:** Given build release candidate, Then каждый required flow имеет конкретный executed outcome и артефакт; skipped не называется PASS.
- **V2-IOS-30-AC-02 · NOT_RUN:** Given A logout→B login при pending callback, Then нет чужого видимого cache/replay.
- **V2-IOS-30-AC-03 · NOT_RUN:** Given upload server-success/client-timeout и process kill, Then тот же report/media восстанавливается без дубликата.
- **V2-IOS-30-AC-04 · NOT_RUN:** Given Customer slice, Then публикация/ответ/revoke/finance isolation доказаны отдельно от contractor-ops pilot.
- **V2-IOS-30-AC-05 · NOT_RUN:** Given неизвестный device gate, Then конкретный release scope остаётся blocked, независимые source fixes могут продолжаться.

**Будущие проверки — NOT_RUN:**

- **V2-IOS-30-TEST-01 · NOT_RUN:** Unit/contract на production Swift типах + TS fixture parity.
- **V2-IOS-30-TEST-02 · NOT_RUN:** Staging multi-role tests с independent readback; no blanket entire suite rerun without reason.
- **V2-IOS-30-TEST-03 · NOT_RUN:** Physical device matrix по реально поддерживаемым OS/device + report exact passed/failed/skipped.

**Проверенные исходные точки:**

- [.github/workflows/ios-ui-smoke.yml:47](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/.github/workflows/ios-ui-smoke.yml#L47)
- [ios/README.md:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/README.md#L1)
- [ios/AiStroykaWorker/AiStroykaWorkerUITests/WorkerV43UITests.swift:201](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorkerUITests/WorkerV43UITests.swift#L201)
- [ios/AiStroykaWorker/AiStroykaWorkerUITests/WorkerSmokeUITests.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaWorker/AiStroykaWorkerUITests/WorkerSmokeUITests.swift#L1)
- [ios/AiStroykaManager/AiStroykaManagerUITests/ManagerSmokeUITests.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaManager/AiStroykaManagerUITests/ManagerSmokeUITests.swift#L1)
- [ios/AiStroykaCustomer/AiStroykaCustomerUITests/CustomerSmokeUITests.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/AiStroykaCustomer/AiStroykaCustomerUITests/CustomerSmokeUITests.swift#L1)
- [ios/Shared/Tests/SharedTests/AuthServiceRefreshGuardTests.swift:1](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/ios/Shared/Tests/SharedTests/AuthServiceRefreshGuardTests.swift#L1)

**Условия остановки зависимого среза:**

- Store upload/production rollout требуют существующих Mode B и release permissions; мегаплан не авторизует их.
- Не объявлять safe Customer/private data proof только по отсутствию поля в UI; проверить DTO/API/audience и subsequent read denial.

**Условие выпуска:** G0; G1; G2; G3; G4; G5; G6

**Rollback:** Отключить изменённый маршрут/исполнитель по согласованному rollout. Сохранить pending drafts, файлы, server IDs и audit history; не откатывать данные удалением.

**Находки:** [IOS-15](AUDIT_REPORT_RU.md#ios-15), [IOS-19](AUDIT_REPORT_RU.md#ios-19).

Полная машинная запись, включая исходную platform карточку: [tickets.json](tickets.snapshot.json), ID `V2-IOS-30`.


# Приложение B. Полные определения iOS release gates и Android later scope

- **G0:** Свежий manifest: source/PR SHA, app build/target, backend stamp, flags, dataset и выполненный тест. Историческая release-ветка не доказывает сборку.
- **G1:** Роль и scope: negative cases A/B, tenant/project boundaries, revoke; старый callback не пишет в новый scope. Customer не получает внутренние финансы.
- **G2:** Сохранность: local write подтверждён, process death/partial network/retry продолжают ту же identity; rollback сохраняет файлы и историю.
- **G3:** Смысл и contract: no fake metrics/default facts, nullable/units/version/coverage согласованы; actual source совпадает с preview и result.
- **G4:** Свежий native render/interaction: loading/empty/error/offline/permission, small/large screen, large text, VoiceOver, RU/EN/ES/IT. Mockup=PROPOSAL.
- **G5:** Фактически выполненные slice и cross-role сценарии для конкретной сборки; build/login smoke/skip не заменяют device proof.
- **G6:** Customer publication/response: явный выбор, gateway identity, capability и версия; последующие reads после revoke запрещены. Внешние скачанные копии не обещается удалять.

Это определения проверки включённого среза, не требование включить всю iOS-программу в один выпуск. Customer G6 нужен только при Customer/publication scope.

## Android later parity — не входит в 97 как текущая обязательная реализация

- **Manager projects/task create+assign/team/invite:** Отсутствует в текущих native routes; D1 expected scope, после стабилизации iOS и named Android scope.
- **Manager notifications inbox/full push:** Отдельный lifecycle, Gradle/module integration и server action map; не смешивать с завершением Worker FCM.
- **Manager documents/finance/AI Copilot/SSE/project intelligence/graph:** Новые сущности/flows, потребуют самостоятельного product+API audit.
- **Worker QR/invite join/social auth/phone OTP:** Новый onboarding/auth scope; existing assigned email account minimum достаточен для текущего repair plan.
- **Worker direct camera/location evidence, task chat/issues/drawings:** Picker-only daily report канон; расширять только по выделенному приоритету, permissions/privacy/device gates отдельно.
- **Customer Android:** Не существующий module; отдельная архитектурная/product ADR, не parity checkbox.
- **Полный offline архив истории и background AI features:** Текущий Worker snapshot ограничен; минимум обеспечивает свои pending drafts/операции и текущие/недавние данные с честной coverage.

# Приложение C. Каноническое сопоставление Phase 0–13 и AIS-*

# AISTROYKA V2 — crosswalk к действующей дорожной карте

База source: `04ec74bf955c29799ab535c043a33c1f9296c309`. Дата повторной проверки: 2026-10-19. Это сопоставление задач, а не разрешение реализации, слияния или релиза.

## 1. Нумерация и источник истины

Канон — фазы0–13 из [Master sequence](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L240) и действующие `AIS-*` IDs из [product amendment](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L19). В [historical DAG](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md#L9) присутствуют Lane A `A1–A7`, а не `A01–A09`. Буквальные `A01–A09` не найдены fresh git/rg в текущих canonical docs. Поэтому их нельзя выдавать за новую каноническую очередь.

`V2-WEB-01–33`, `V2-ARCH-01–09` и `F01–F40` — номера этого аудита. A01–A09 сохраняются только как исторические aliases первого плана; здесь они не объявляются canonical и не перенумеровываются. Ниже V2 задачи привязаны к реальным phase/AIS требованиям.

Раздел14 — [шаблон Cursor](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1753), не Phase14 продукта. Старые Development Roadmap phases1–6 и delivery R0–R9 — другие исторические схемы, их номера сюда не переносятся.

## 2. Все действующие фазы0–13

| Phase / источник | Состояние и граница вывода | V2 работа | Действующий ID | Условие завершения |
|---|---|---|---|---|
| [0. Live Truth Verification](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L261) | Current main совпадает с checkout по fresh root compare; это не проверка всех live tenants/devices/schema. WEB22 source/public diagnostic и текущие PR требуют нового exact-head gate. | V2-WEB-22; V2-ARCH-07/09 | AIS-PILOT-001 | Fresh GitHub/health buildStamp/schema receipts, tenant/project/role negatives. Повтор SQL только после receipts preflight, не по старому timestamp. |
| [1. Manager Daily Control Center](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L338) | Dashboard/portfolio/workload/attention, project/tasks/reports и services уже есть. Потеряны отдельные actions и truthful states; новый параллельный dashboard не нужен. | V2-WEB-01–08,13–20,25–29,32–33; V2-ARCH-01–04/06/08 | AIS-PILOT-001 | Task→assignment→report daily loop, create workspace и exact entity navigation; source counts не равны завершению task. |
| [2. Owner / Customer Portal](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L470) | Portal/client views, iOS Customer foundation и safe projection существуют; project Owner View не равен platform /owner. Входы и shell требуют согласования. | V2-WEB-09/10/23/24; V2-ARCH-01/04/07 | AIS-OWNER-001; AIS-OWNER-002 (native peer) | Invite/access/revoke, safe media originals, decisions, approved commercial versions. Contractor-only pilot не расширяется планом без отдельного slice. |
| [3. Decision Requests](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L629) | ProjectDecisionsPanel и existing decision-request adapter присутствуют; document approval — отдельный endpoint с project owner role. | V2-WEB-09/23/24; V2-ARCH-04/07 | AIS-OWNER-001 | Idempotent response по source/version, actor audit, conflict/revoked state. Не ослаблять document decision authorization до tenant admin. |
| [4. Customer Estimates / Commercial Approvals](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L781) | CustomerEstimatesManagerPanel уже монтируется в ProjectEstimatePanel. Legacy commercial deep link требует правильного destination; finance aggregates требуют scope/currency. | V2-WEB-08/17/23/24; V2-ARCH-04/06/07 | AIS-OWNER-001 | Customer-approved totals отделены от internal cost/margin; draft first record не задаёт currency approved aggregate. |
| [5. Change Orders](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L956) | Manager/client change-order modules и отдельные detail routes существуют. Реализовать/проверить cross-role lifecycle, не дублировать домен. | V2-WEB-24; V2-ARCH-04/07 | AIS-OWNER-001 | Accepted version, schedule/commercial impact и source refs; invalid transitions/concurrent decisions не скрываются. |
| [6. Proof Pack / Before-After Evidence](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1077) | Proof/review pack и report publication/private originals существуют. Current Canon report произвольно именует первые2фото Before/After, а manager ProofPack entry потерян. | V2-WEB-08/12/16/25/31; V2-ARCH-04/05/07 | AIS-EVID-002; AIS-VISION-003 | Source identity/time/category, explicit publish/withdraw, duplicate retry protection, private original access. Фото само по себе не measured quantity. |
| [7. AI Daily Digest](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1164) | daily-digest.service, project intelligence, AI queue и construction Graph есть. Worker report AI durable path и review/source lifecycle требуют current PR reconciliation. | V2-WEB-07/11/12/17/32; V2-ARCH-04/05/06/08 | AIS-EVID-002; AIS-VISION-003; AIS-GRAPH-004; AIS-CORRECTION-009 | Facts vs inference/unknown, source/version, reviewed publication, customer projection до LLM, no successful-job→healthy-project inference. |
| [8. Punch List / Defects](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1281) | Current canonical model project_defects, не новая punch_items. Client/Manager defects detail существует. Operational issues — другая family. | V2-WEB-08/24; V2-ARCH-01/04/07 | AIS-OWNER-001; AIS-EVID-002 | Correct status vocabulary, real before/after source refs, verification actor; issue notifications открывают issue, не unrelated overview. |
| [9. Handover Pack](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1365) | Existing readiness service, pack API и browser preview/print. Client link вне allowed subtree ведёт в portal redirect. | V2-WEB-10/31; V2-ARCH-07 | AIS-OWNER-001; AIS-EVID-002 | Safe customer projection, incomplete/stale pack, expiry/revoke originals. Существующий internal pack API не надо пересоздавать. |
| [10. Telegram Bot Layer](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1468) | Telegram auth/connect card и notification emit services есть. Deep-link/role compatibility требуется; bot/live delivery подзадачей не запускались. | V2-WEB-05/28; V2-ARCH-01/07/09 | AIS-PILOT-001 (safety/release) | Сначала existing supported quick actions; не новый bot engine. External message delivery только в отдельно авторизованном тесте; invite/deep links сохраняют role/scope. |
| [11. Contractor Directory](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1525) | Current workers/contractors directories и details существуют. Marketplace/matching readiness из этого не следует. | V2-WEB-26; V2-ARCH-04 | AIS-MATCH-006 (later expansion) | Проверяемые profile/capability/source metrics; no invented ratings; matching после confirmed scope/graph и pilot. |
| [12. Monetization / Packaging](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1599) | Pricing catalog, subscribe, legacy billing, billing-readiness и platform pilot controls существуют; pending activation UI и public comparison CSS требуют исправления. | V2-WEB-21/30; V2-ARCH-09 | AIS-PILOT-001 (release guard) | Visual/readability/recovery slice не меняет Stripe/checkout/entitlement reads;7-day zero-drift shadow/staging/cutover gates сохраняются. |
| [13. Final Production Hardening](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md#L1676) | Исторический closure 2026-06-16 относится к другому SHA a7686d6 и CONDITIONAL pilot scope; не является current UI/device PASS. | V2-ARCH-07/08/09; affected WEB tickets validation | AIS-PILOT-001; AIS-OWNER-001 | Fresh current-head security/observability/core E2E/staging/prod proof; product defects и UNKNOWN runtime нельзя закрыть планом/старым отчётом. |

## 3. Девять V2 архитектурных задач и реальные canonical IDs

Исторические A01–A09 — только aliases первого плана. Для текущего Cursor handoff рабочий ID — V2-ARCH-xx, а продуктовый источник указан в последнем столбце. Это не новая версия канонической дорожной карты.

| Handoff ID | Результат | Product phases | Канонические требования |
|---|---|---|---|
| V2-ARCH-01 | Единый реестр маршрутов, действий и capabilities | 1, 2, 13 | AIS-PILOT-001, AIS-OWNER-001 |
| V2-ARCH-02 | Типизированные ресурсные состояния и recovery commands | 1, 13 | AIS-PILOT-001 |
| V2-ARCH-03 | Отделить feature behavior от Canon presentation | 1, 13 | AIS-PILOT-001 |
| V2-ARCH-04 | Контракты сущностей, источников, units и разрешённых действий | 1, 2, 6, 7, 13 | AIS-PILOT-001, AIS-EVID-002, AIS-VISION-003, AIS-GRAPH-004 |
| V2-ARCH-05 | Долговечный AI результат, source lifecycle и human review | 6, 7, 13 | AIS-EVID-002, AIS-VISION-003, AIS-GRAPH-004, AIS-CORRECTION-009 |
| V2-ARCH-06 | Единые read models, полнота и cache invalidation | 1, 4, 7, 13 | AIS-PILOT-001, AIS-OWNER-001 |
| V2-ARCH-07 | Матрица доступа и projection для каждого actor/source | 0, 2, 13 | AIS-PILOT-001, AIS-OWNER-001, AIS-EVID-002 |
| V2-ARCH-08 | Telemetry завершения реальных пользовательских задач | 1, 7, 13 | AIS-PILOT-001, AIS-EVID-002 |
| V2-ARCH-09 | Релиз по доказательствам критических journeys | 0, 13 | AIS-PILOT-001, AIS-OWNER-001 |

## 4. Расширения amendment: не перепрыгивать зависимости

| Existing ID | Реальное назначение / порядок | V2 связь |
|---|---|---|
| AIS-PILOT-001 | Fresh truth/security/current pilot первым. [Источник](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L24) | ARCH07/09, критический task/auth cycle. |
| AIS-OWNER-001 / 002 | Existing portal + Customer iOS, не создание второго приложения. Customer surfaces не расширяют contractor-only pilot автоматически. [Источник](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L25) | WEB09/10/23/24/31 + mobile peer handoff. |
| AIS-EVID-002 / VISION-003 | Source capture → finding → reviewed result; async analysis lifecycle. [Источник](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L27) | WEB12/16/25/31, ARCH04/05/07. |
| AIS-CLIENT-005A | Async preproject intake; manual intake уже есть по fresh project state, не воссоздавать CRUD. [Источник](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L29) | Собственный current intake source inventory/PR продолжить; этот web114 registry не доказывает отдельный page family intake. |
| AIS-GRAPH-004 | Existing graph repository/persistence/source lifecycle, не новая graph DB. [Источник](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L30) | ARCH04/05/07; source correction/revoke invalidate. |
| AIS-CLIENT-005B | Live video intake P2 после Graph + Owner foundation; consent/stop/reconnect/async fallback. [Источник](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L31) | Deferred separate runtime spike. Current async upload не live duplex; camera/source review fix не создаёт live agent. |
| AIS-MATCH-006 / MATERIAL-008 | Matching/material supplier later after verified scope/evidence/graph; no automatic orders. [Источник](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L32) | WEB26 проверяет directory; WEB13/27 не превращают Devices в Supplies. |
| AIS-CORRECTION-009 | Independent corpus/holdout и review corrections. [Источник](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L148) | ARCH05 measurements acceptance; professional review и measured/calibrated units. |
| AIS-STREAM-010 / SPATIAL-011 / PROVIDER-012 / OWNER-3D-013 | Existing interface/schema queue, later provider/3D; no new CAD. [Источник](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AISTROYKA_PLAN_AMENDMENT_2026-09-23.md#L110) | Preserve contracts and2D fallback; это не prerequisite быстрых UX repairs. |
| AIS-RULE-015 / MEM-016 / RECON-017 | Source-aware completeness/private retrieval/tender reconciliation; текущая очередь после pilot/evidence/graph. [Источник](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/roadmap/AI_DIGEST_RECONCILIATION_2026-10-13.md#L13) | ARCH04/05/07 foundations; не открывать параллельную AI platform. |

## 5. Открытые PR и historical registry

Root подтвердил fresh GitHub main == local SHA. Финальная сверка metadata и changed filenames всех шести PR сохранена в `audit-v2/consolidated/pr-overlap-recheck.json`: все OPEN/DRAFT, merged=false. Полные diff и качество изменений этой сверкой не проверены. При передаче в реализацию снова проверить state/head/base/merge_sha и смысловой overlap. Точная принадлежность #446 уточнена ниже.

| Работа | Учитывать в V2 | Правило |
|---|---|---|
| #446 private report media resolver / source binding | ARCH04/05/07; WEB11/12 | Fresh metadata/filenames подтверждают resolver и два теста; durable result/completion этим не доказан. Согласовать actual diff и owner; не расширять этот PR молча до persistence. |
| #447 private RPC | ARCH07/09; private originals/share | Сверить действующие grants/RLS и migration receipts. Public smoke closure не заменяет RPC hardening. |
| #448 / #449 quantities stage2a | ARCH04/05; WEB12/17 | Fresh metadata: base #449 совпадает с head #448, это stack. Сверить actual diff, source units и совместимость API/decoders; не исполнять как независимые ветки. |
| #450 / #451 roadmap docs | Crosswalk/ARCH09 | Documentation pending не меняет runtime или released features. Canonical IDs сверить после merge. |
| #353 daily-log persistence из historical DAG | WEB25 | Старое TODO не означает отсутствие current implementation; проверить existing source и PR diff. |
| #431/#432/#435 publication/gallery foundation | WEB12/23/31 | Сохранить уже реализованные gallery, selected publication, expected_version,409. Старый successful device run не current V2 test. |
| #350 historical planning | Amendment/AI later sequence | Не принимать historical main/deploy date этого docs PR за current truth. |

`ACTIVE_WORK_REGISTRY.csv` содержит наблюдения2026-10-11/12; его строки с [requirement_id/pr/head/merge](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/04ec74bf955c29799ab535c043a33c1f9296c309/docs/tasks/ACTIVE_WORK_REGISTRY.csv#L1) нужно обновлять, а не использовать как свежую GitHub выдачу. Старые74 mixed PR и новый root open-count не являются количеством неработающих функций.

## 6. Порядок исполнения внутри неизменного канона

1. Fresh preflight и bounded security/current pilot checks. Параллельно исправить локальные task render/navigation blockers и public CSS defects с root evidence.
2. Восстановить contractor daily loop: onboarding→project→task→report; определить typed state и route contracts на этих первых features.
3. Замкнуть evidence/document review/upload/source/AI durable chain, продолжая current PRs.
4. Проверить owner/customer handoff, приглашение, safe publication/decisions/handover и revoke; current pilot expansion остаётся отдельным gated release.
5. Закрыть supporting screens, localization/a11y и telemetry; выполнить exact-head release evidence без переобозначения old closure как current PASS.

Любой пункт может быть IMPLEMENTED/PARTIAL/PR_ONLY/PLANNED/BLOCKED по новой сверке; этот crosswalk не закрывает product phase.
