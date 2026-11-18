# Аудит опыта продукта → действующий план AISTROYKA

**97 пакетов доработки включены как детализация существующих Phase 0–13/AIS требований.** Новых верхнеуровневых эпиков и новых AIS-ID это изменение не создаёт. Начинать с [единой точки продолжения](../AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md).

| Документ | Назначение |
|---|---|
| [Полная карта 97 пакетов](CANONICAL_MAPPING_RU.md) / [JSON](canonical-mapping.json) | Primary/secondary Phase, existing requirements, release scope, основания и ограничения |
| [Полный план доработки](MEGA_PLAN_RU.md) | Все 97 карточек, реализация, 406 критериев, 243 будущих проверки, зависимости и rollback |
| [Полный отчёт](AUDIT_REPORT_RU.md) | Все 73 finding, причины, целевая структура и архитектура, границы доказательств |
| [Дизайн-задание MagicPath](MAGICPATH_DESIGN_BRIEF_RU.md) | 23 предлагаемых фрейма, 9 семейств, общие состояния и 3 сценария; canvas не создан |
| [Public walkthrough](PUBLIC_WALKTHROUGH_RU.md) | Исторические шаги и наблюдения 19 октября; снимки доступны в исходном ZIP |
| [Старт Cursor](CURSOR_START_RU.md) | Репозиторный маршрут чтения и один исполнимый срез |
| [Контекст исходного аудита](AUDIT_CONTEXT_RU.md) | Исторический контекст 19 октября; новые entrypoints и эта интеграция имеют приоритет |
| [Tickets snapshot](tickets.snapshot.json) / [Findings snapshot](findings.snapshot.json) | Полные неизменённые исходные данные, включая исходные platform details |
| [Свежая сверка main/PR](source-recheck-2026-10-20.json) | Точечный snapshot 20 октября; перед реализацией обновить |
| [Проверка интеграции](VALIDATION.md) | Полнота, уникальность, DAG и переносимость документации |
| [Проверка сопоставления](INTEGRATION_REVIEW_RU.md) / [проверка переноса](PORTABILITY_REVIEW_RU.md) | Независимая проверка документации; не GitHub approval или runtime PASS |
| [Исходный архив](ARCHIVE_REFERENCES.md) / [manifest](SOURCE_MANIFEST.json) | Точные ссылки на исторические доказательства и контрольные суммы |

## Даты и приоритет документов

Аудит выполнен 19 октября на `04ec74bf955c29799ab535c043a33c1f9296c309`; интеграция — 20 октября. Frozen JSON скопирован byte-for-byte, включая незаполненные тогда canonical поля у 43 native пакетов. Полная привязка добавлена **отдельным overlay**, поэтому историю аудита можно воспроизвести. Существующий master roadmap и последующие source-linked execution facts определяют статус реализации. Эта папка описывает требуемую доработку/проверку, а не подтверждённое отсутствие каждого модуля.

97 пакетов: 33 WEB + 30 IOS + 13 ANDROID + 9 ARCH + 4 CONTRACT + 8 PUBLIC. 73 findings: 33 CONFIRMED, 36 REFINED, 4 NEW; это классификация повторного аудита, не 73 подтверждённых production дефекта. 197 hard dependencies и 6 условных release links сохранены; M00–M08 — рабочие направления внутри существующего плана.

## Правила использования

До разработки: fresh main/PR/HEAD/local salvage → existing requirement/module → недостающий результат → выбранный V2 acceptance. Требование, уже доставленное в main, не переоткрывать целиком. Owner в frozen tickets пустой; suggested_owner — компетенция, не назначенный человек. Оценки не складывать в обещанный календарный срок: общие контракты учитываются один раз, WEB-30 только проверяет PUB-01…08.

Текущий пилот `contractor-ops-only`, iOS primary. Все 13 Android-пакетов deferred по действующему решению, Customer/AI/commercial — отдельные срезы. IOS-30 описывает всю программу iOS; core gate содержит только применимые core проверки. Owner=platform owner, tenant owner и Customer/stakeholder остаются разными access scopes. Account-first/billing и 7-day zero-drift gates не изменяются.

Это изменение документации; ни исправления продукта, ни свежие native/device/runtime PASS, ни публикация макетов/merge/deploy/DB/store им не подтверждаются.
