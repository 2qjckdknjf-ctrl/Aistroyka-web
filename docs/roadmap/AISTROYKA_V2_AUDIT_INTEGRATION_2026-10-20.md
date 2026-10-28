# AISTROYKA — включение полного V2 аудита в действующий план

**20 октября 2026 · docs-only · 97 подчинённых пакетов · Phase 0–13/AIS IDs сохранены.**

Главный план остаётся [AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE](AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md), дополнения — [существующий amendment](AISTROYKA_PLAN_AMENDMENT_2026-09-23.md). Аудит App Design Intelligence, наблюдения Product Design и дизайн-задание MagicPath теперь входят в него через точные phase-specific ссылки и единый полный [backlog](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md). Отдельный конкурирующий roadmap не вводится.

## 1. Что именно добавлено

| Объём | Сохранено в плане |
|---|---|
| 97 пакетов | 33 web, 30 iOS, 13 Android, 9 архитектурных, 4 общих backend-контракта, 8 публичного сайта |
| 73 находки | Полный текст, источник, counterevidence, ограничения, связи с задачами; 33 CONFIRMED / 36 REFINED / 4 NEW |
| 406 критериев приёмки | Наблюдаемые условия результата; ни один не отмечен автоматически выполненным |
| 243 будущих проверки | Source/contract/runtime/recovery/a11y сценарии; это план, не выполненные тесты |
| Зависимости | 197 hard edges, 6 условных release links; циклов нет в frozen DAG |
| Дизайн | 23 предлагаемых фрейма, 9 семейств, общие состояния, 3 переходных сценария; MagicPath canvas ещё не создан |
| История | Два полных frozen JSON, полный отчёт/план, сохранённые original IDs и SHA |

[Состав пакета](product-experience-audit-2026-10-19/README.md), [все 97 соответствий](product-experience-audit-2026-10-19/CANONICAL_MAPPING_RU.md), [машинная карта](product-experience-audit-2026-10-19/canonical-mapping.json), [отчёт](product-experience-audit-2026-10-19/AUDIT_REPORT_RU.md), [дизайн-задание](product-experience-audit-2026-10-19/MAGICPATH_DESIGN_BRIEF_RU.md).

## 2. Иерархия и правила против дублирования

1. Существующая Phase/AIS requirement задаёт продуктовый смысл и release gate. V2 ID — конкретная недостающая доработка или проверка внутри неё. M00–M08 из аудита — направления работ, не новые фазы.
2. У каждого V2 пакета одна основная Phase; secondary phases — области влияния. Это классификация, не новый обязательный dependency и не разрешение обходить текущий DAG/gates.
3. Где нет точного специализированного AIS-ID, карта честно использует широкий existing parent и `BROAD_PARENT_INFERRED`. Поддерживающие IOS-MGR/IOS-WKR/IOS-CUST/AND-MGR/AND-WKR/DOCS/NOTIF/A11Y/I18N IDs сохраняются с указанием источника.
4. Перед реализацией читать свежие main, PR diff, current HEAD, локальные сохранённые ветки и runtime proof. Метаданные PR или совпадение названий не доказывают завершённость. Найденное пересечение дополняет существующий срез; второй параллельный backend не создавать.
5. Customer iOS, portal/gallery/publication, Graph persistence, async Vision/request_key, manual intake и daily-log уже имеют реализации и/или доказательства. По ним сначала определять конкретный оставшийся acceptance gap. Историческое PARTIAL/MISSING не переопределяет свежий delivery факт.
6. До старта назначить одного фактического owner и reviewer среза. `suggested_owner` и effort — ориентиры компетенции/сложности. 97 пакетов не означают 97 PR или сумму независимых календарных оценок.
7. В ACTIVE_WORK_REGISTRY хранить реальный PR/branch/наблюдённый HEAD. Все 97 proposed пакетов туда отдельными якобы открытыми работами не переносить.

## 3. Привязка к основным фазам

| Existing Phase | Пакетов с основной привязкой | Смысл включения |
|---|---:|---|
| 0 — Live Truth Verification | 4 | [V2-IOS-01](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-01), [V2-WEB-22](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-22), [V2-CON-02](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-con-02), [V2-WEB-29](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-29) |
| 1 — Manager Daily Control Center | 31 | [V2-ARCH-01](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-01), [V2-ARCH-04](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-04), [V2-WEB-01](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-01), [V2-ARCH-02](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-02), [V2-ARCH-06](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-06), [V2-CON-04](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-con-04), [V2-WEB-05](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-05), [V2-IOS-10](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-10), [V2-IOS-15](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-15), [V2-AND-09](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-09), [V2-IOS-17](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-17), [V2-IOS-18](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-18), [V2-IOS-20](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-20), [V2-IOS-21](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-21), [V2-IOS-23](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-23), [V2-WEB-02](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-02), [V2-WEB-03](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-03), [V2-WEB-04](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-04), [V2-WEB-06](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-06), [V2-WEB-07](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-07), [V2-WEB-08](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-08), [V2-WEB-15](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-15), [V2-WEB-26](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-26), [V2-WEB-33](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-33), [V2-ARCH-03](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-03), [V2-WEB-13](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-13), [V2-WEB-14](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-14), [V2-WEB-18](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-18), [V2-WEB-27](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-27), [V2-WEB-28](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-28), [V2-WEB-32](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-32) |
| 2 — Owner / Customer Portal | 5 | [V2-IOS-24](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-24), [V2-IOS-26](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-26), [V2-IOS-27](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-27), [V2-WEB-10](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-10), [V2-WEB-23](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-23) |
| 3 — Decision Requests | 3 | [V2-IOS-25](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-25), [V2-WEB-09](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-09), [V2-WEB-24](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-24) |
| 4 — Customer Estimates / Commercial Approvals | 1 | [V2-WEB-17](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-17) |
| 5 — Change Orders | 0 | Самостоятельные V2 пакеты не добавлены; существующая фаза сохранена. Связанные пакеты: V2-WEB-24. |
| 6 — Proof Pack | 14 | [V2-CON-03](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-con-03), [V2-AND-03](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-03), [V2-AND-04](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-04), [V2-AND-07](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-07), [V2-IOS-04](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-04), [V2-IOS-05](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-05), [V2-IOS-06](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-06), [V2-IOS-13](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-13), [V2-IOS-14](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-14), [V2-AND-08](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-08), [V2-IOS-19](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-19), [V2-WEB-12](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-12), [V2-WEB-16](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-16), [V2-WEB-25](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-25) |
| 7 — AI Daily Digest | 3 | [V2-ARCH-05](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-05), [V2-IOS-22](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-22), [V2-WEB-11](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-11) |
| 8 — Punch List / Defects | 0 | Самостоятельные V2 пакеты не добавлены; существующая фаза сохранена. Связанные пакеты: V2-WEB-08, V2-WEB-24. |
| 9 — Handover Pack | 1 | [V2-WEB-31](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-31) |
| 10 — Telegram Bot Layer | 0 | Самостоятельные V2 пакеты не добавлены; существующая фаза сохранена. |
| 11 — Contractor Directory | 0 | Самостоятельные V2 пакеты не добавлены; существующая фаза сохранена. Связанные пакеты: V2-WEB-26. |
| 12 — Monetization / Packaging | 10 | [V2-PUB-01](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-01), [V2-PUB-02](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-02), [V2-PUB-03](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-03), [V2-PUB-04](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-04), [V2-PUB-05](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-05), [V2-PUB-06](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-06), [V2-PUB-07](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-07), [V2-PUB-08](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-08), [V2-WEB-21](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-21), [V2-WEB-30](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-30) |
| 13 — Production Hardening Final | 25 | [V2-ARCH-07](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-07), [V2-ARCH-09](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-09), [V2-AND-01](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-01), [V2-AND-02](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-02), [V2-CON-01](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-con-01), [V2-IOS-02](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-02), [V2-IOS-03](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-03), [V2-AND-05](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-05), [V2-AND-06](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-06), [V2-IOS-07](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-07), [V2-IOS-08](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-08), [V2-IOS-09](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-09), [V2-IOS-11](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-11), [V2-IOS-12](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-12), [V2-IOS-16](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-16), [V2-AND-10](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-10), [V2-AND-11](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-11), [V2-AND-12](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-12), [V2-ARCH-08](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-08), [V2-IOS-28](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-28), [V2-IOS-29](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-29), [V2-WEB-19](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-19), [V2-WEB-20](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-20), [V2-AND-13](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-13), [V2-IOS-30](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-30) |


Каждое число — количество **unique primary packages**, всего 97. Фазы без новых самостоятельных аудиторских пакетов сохраняются как части существующего продукта. Подробные основания и ограничения каждого соответствия находятся в полной карте; старые canonical поля frozen JSON не изменялись.

## 4. Архитектурные владельцы и обязательные уточнения

| Общая область | Один владелец реализации | Потребители и граница |
|---|---|---|
| Durable operation outcome / dedup | V2-CON-01, owner соответствующего backend writer | Клиенты хранят intent/key/body/owner и показывают результат/reconciliation; общей DB+Storage+AI транзакции не обещается |
| Worker bootstrap / `/me` allow-list | V2-CON-02 + ARCH-07 policy | Четыре согласованных профиля fixtures, платформенные модели auth/recovery |
| Media identity, revision, purpose, correction | V2-CON-03 | Existing report_before/report_after; correction append сохраняет reportId; локальные файлы/preview — ответственность клиента |
| Reports inbox collection | V2-CON-04 | Только GET `/api/v1/reports`, pagination/filter/count; source finding AND-017. Не все коллекции продукта |
| SYNC-CONTRACT / REPORT-POLICY | V2-ARCH-04, backend sync/reports owners | Swift/Kotlin применяют согласованный контракт; без параллельных несовместимых правил |
| Persisted AI completion | V2-ARCH-05 | Canonical executor/result с lease/source revision/human review; CON-01 это не дублирует |
| Capabilities и navigation | V2-ARCH-01 + ARCH-07 | Общий semantic route contract; API/RLS проверяют права независимо от видимости кнопок |
| Read models/cache | V2-ARCH-06 | environment + app/audience + principal + tenant + resource; callback generation проверяется отдельно |

**Условные связи:** AND-09 требует CON-04; IOS-19 требует его только для inbox/list/count, работа над review detail может идти раньше. IOS-17 и ручной WEB-12 не получают искусственной зависимости от CON-04. В WEB-12 лишь AI-result slice зависит от ARCH-05. WEB-30 — `INTEGRATION_VALIDATION_ONLY` поверх PUB-01…08; не реализует и не оценивает их повторно. CON-05 help остаётся условной идеей за пределами 97 пакетов.

Android 401 допускает один согласованный auth refresh/replay с теми же owner/body/key; timeout/5xx не превращаются в слепую повторную мутацию. Correction обычного Worker report не переименовывается в AIS-CORRECTION-009, который относится к AI/model evaluation lineage. `/owner` в текущем приложении — platform owner surface; исторические route-примеры Phase 2 не являются инструкцией переназначить его Customer.

## 5. Порядок доработки и независимые релизы

| Срез | Следующий результат | Минимальное доказательство выхода |
|---|---|---|
| Baseline / малые исправления | Свежие исходники/PR; task create loop WEB-01; PUB-01…04; scope диагностики WEB-22 | Before/after на текущем build, точечная meaningful проверка, точная область изменения |
| Contractor core / iOS | Одна назначенная задача → сохранённый draft/media → submit → Manager review → correction того же reportId | Нужные contract fixtures + restart/offline/timeout/owner-switch + cross-role readback на включённых платформах |
| Навигация и структура | Настоящие entity links, complete list/scope, project capabilities, честные menu/search, supporting screens | Возврат контекста, denied/unknown fallback, loading/empty/error; доступность изменённых действий |
| Customer | Только опубликованные разрешённые версии, документы, решения, revoke/conflict | Отдельный Customer path и negative finance/access checks; existing portal и iOS targets переиспользуются |
| AI | Durable result/source revision, reviewed observations, честные unknown/error/cancel states | Current lease/result/lineage, server projection и human review; не только завершённый job или toast |
| Public / commercial | Hero/CTA/pricing/help/contact intent; truthful subscription activation и агрегаты | Визуальные/functional сценарии, утверждённые обещания/условия; billing gates остаются прежними |
| Android | Сохранён полный план 13 пакетов для D2 | `DEFERRED_BY_DECISION`; возобновление после iOS readiness и актуального решения scope, без Customer Android |

Для **первой небольшой реализации** рекомендован V2-WEB-01: повторить изолированный repro на свежем HEAD, проверить existing PR overlap, исправить registration callback, подтвердить отсутствие render loop и корректное открытие Create Task. Не начинать с переписывания архитектуры целиком. Отдельные PUB исправления могут идти параллельно при разных owner/файлах.

Далее первый вертикальный core slice выбирает только нужные части ARCH-04/07, CON-01/02/03 и iOS/Manager consumers. Полная архитектурная программа не должна стать искусственной предпосылкой для независимого подтверждённого исправления. Сам source audit не даёт нового разрешения на чувствительные внешние действия; продолжать в уже согласованном workflow проекта.

**Текущие обязательные ограничения:** `contractor-ops-only`; iOS primary; Android first-pilot deferred; Customer, AI и commercial gates отдельны. Полный dependency set IOS-30 — gate всей iOS программы, не требование закончить Customer/AI перед каждым core fix. Account-first/entitlement semantics, customer-finance isolation, protected release chain и **7-day zero-drift** требования сохраняются. Временные, physical-device, legal/store и runtime доказательства не заменяются планом или unit-тестами.

## 6. Свежая сверка существующих PR и AI-разборов

20 октября GitHub main и локальная чистая исходная ветка совпали с `04ec74bf955c29799ab535c043a33c1f9296c309`. CLI `workspace_preflight.py --refresh` вернул **CHECK_UNAVAILABLE** из-за недоступного configured proxy; локальный preflight — CURRENT_BASELINE, независимая свежая GitHub сверка SHA выполнена. Это не выдаётся за успешный CLI refresh или за проверку runtime. Перед реализацией выполнить preflight в рабочем окружении с доступным remote.

| Existing PR | Состояние на момент сверки | Что учитывать в плане |
|---|---|---|
| [#446](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/446) | OPEN / draft; private report media scope resolver + tests | Сопоставить media/source permissions; durable AI completion этим PR/списком файлов не подтверждено; actual diff проверить перед реализацией |
| [#447](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/447) | OPEN / draft; DB migration/CI/test work | Не считать apply/runtime proof; сверить receipts до будущих миграций |
| [#448](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/448) | OPEN / draft; quantity core | Existing material/quantity capability; не дублировать в UI пакете |
| [#449](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/449) | OPEN / draft; quantity commercial, stacked on #448 | Сохранить base dependency; не переносить как независимую готовую реализацию |
| [#450](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/450) | OPEN / draft; AI Scout 15.10, один документ | Workflow provenance, independent checks, evidence completeness/Graph dedup — уточнения existing requirements |
| [#451](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/451) | OPEN / draft; AI Scout 18.10, один документ | Material SearchFetch/PriceSearch и CAD sandbox — existing MATERIAL/SPATIAL/provider future scope; сторонний trading scope не импортируется |
| [#452](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/452) | OPEN / draft; AI Scout 20.10, один документ | Timecoded video retrieval/source permissions — existing MEM/VISION/GRAPH, не новый production rollout |

Exact HEAD/base/changed files и время наблюдения: [source recheck](product-experience-audit-2026-10-19/source-recheck-2026-10-20.json). Прочитаны scout документы на exact HEAD; их vendor/benchmark claims не превращаются в проверенные продуктовые факты. Эти семь PR — целевая проверка пересечений, а не исчерпывающий semantic review всех старых PR. Полученные 80 строк поиска не выдаются за гарантированный полный текущий реестр.

## 7. Что Cursor читает и обновляет

[START_HERE](../../START_HERE.md) → [STATUS](../../STATUS.md) → [реестр](../tasks/ACTIVE_WORK_REGISTRY.csv) → current execution state/DAG → эта интеграция → строка package в карте → полная карточка → source refs/условные зависимости. [Готовый старт](product-experience-audit-2026-10-19/CURSOR_START_RU.md).

На один срез зафиксировать: primary existing requirement, V2 acceptance IDs, текущий код/PR, owner, exact HEAD, applicable release scope, before state, intended result, проверки, rollback и следующий handoff. Реализация, проверка и доставка — разные стадии. **Все 97 packages остаются PROPOSED в исходном аудите; текущие новые проверки NOT_RUN; Android execution deferred.** Перенос документации не повышает ни один продуктовый статус.

При завершении обновить существующую task/handoff/registry запись и только подтверждённые acceptance результаты. Не переписывать frozen snapshots; актуальный execution ledger хранить в живых task/handoff и при необходимости расширить отдельным tracked overlay.

## 8. Приёмка этой интеграции

Проверить 97 уникальных primary mappings, существование указанных requirements, полноту всех 73 finding links, 406/243 criteria/checks, 197/6 dependency links, отсутствие циклов, portable Markdown links, неизменность frozen hashes, docs-only diff и отсутствие переименований Phase/AIS. Результаты: [VALIDATION](product-experience-audit-2026-10-19/VALIDATION.md). Task: [integration task](../tasks/2026-10-20-audit-v2-plan-integration.md); handoff: [continuation](../handoff/2026-10-20-audit-v2-plan-integration.md).
