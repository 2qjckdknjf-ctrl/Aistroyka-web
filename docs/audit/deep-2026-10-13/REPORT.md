# Аудит AISTROYKA и очередь доработки

Проверка от 13 октября 2026 года охватывает текущий код AISTROYKA, планы в репозитории, последние требования открытого PR #350 и объединённый план ObraPrecioAI/AISTROYKA версии 2.6. Основа кода — `e0c9f51a1a8d7b582ed2bc354e09ecbe8cb10bcc`. Проект работоспособен на текущем main, но полная продуктовая готовность остаётся открытой: сохранение результатов анализа отчётов, проверка выводов человеком, пространственная цепочка доказательств и новые контуры количеств ещё не завершены.

## Текущий код и публикация

Свежий workspace preflight вернул CURRENT_BASELINE. Исходная рабочая папка была чистой; изменения выполняются в `fix/deep-audit-remediation-2026-10-13`. Сохранённые старые папки и `sources/` проекта не менялись.

Staging, `aistroyka.ai` и `www.aistroyka.ai` отвечают успешным health с `buildStamp.sha7=e0c9f51`, соответствующим main. Последний PR #445 объединён, required check SUCCESS. [Снимок runtime](runtime.json) подтверждает публикацию исходной основы; изменения этой ветки ещё не опубликованы.

На исходном снимке GitHub оставались 74 открытых PR и шесть issues; новые PR этой работы учитываются отдельно в registry. Все 74 HEAD имеют отдельную историю относительно main; это не означает, что все их функции отсутствуют. [Инвентарь PR](open-prs.json) сохраняет SHA, основу и изменённые файлы. Старые смешанные стеки требуют сравнения конкретного поведения; широкое объединение восстановит также устаревшие изменения.

## Сверка планов

[Реестр планов](plans.csv) фиксирует версии и контрольные суммы 97 локальных документов планирования и связанных ссылочных материалов, пяти последних версий из PR #350 и объединённого плана версии 2.6. [Таблица требований](requirements.csv) связывает исходную матрицу завершения, новые продуктовые требования PR #350 и задачи C/O/A/I/V этапа 2а с реализацией и остатком.

| Источник | Что сохраняется | Как использовать сейчас |
|---|---|---|
| Mega roadmap от 6 мая | Продуктовые фазы и обязательная изоляция финансов подрядчика | Действующая продуктовая политика |
| Master Readiness от 21 августа | Порядок сертификации, release gates, deferred scope | Gates действуют; исходные SHA и NOT STARTED относятся к августу |
| План и матрица от 3 октября | Требования и критерии приёмки | Исторические MISSING/TODO сверять с текущим кодом |
| Current Execution State и hard audits 11–12 октября | Фактические внедрения и инженерные зависимости | Основа продолжения; снимки runtime обновлены этим аудитом |
| [PR #350](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/350), HEAD `b5e84774` | Уточнения до 13 октября, реестр AI разборов, AIS-RECON-017 | Последние требования; PR остаётся документационным и открытым |
| Объединённый workflow версии 2.6 | Отдельные продукты, количества/цены, контракты этапа 2а | C01–C03 завершены как аудит и спецификации; runtime задач не следует из наличия схем |

Customer iOS, ручной intake, Graph persistence, async image jobs и ROMA advisory уже существуют. Старые записи «нет target», «Graph отсутствует» и «нет intake» устарели. Их повторное создание не требуется. Grow OS установлен как существующий репозиторий Growth OS; общая инженерная платформа не является ещё одним модулем Construction Graph.

## Подтверждённые ошибки и хвосты

| Приоритет | Проблема | Основание и последствие | Состояние |
|---|---|---|---|
| P1 | Фото разрешалось по tenant/project без доказательства вложения в отчёт | `resolve-ai-media-image.ts`: неподключённый media и смешанная пара media/upload проходили; legacy URL заменял недоступный источник | Исправлено в этой ветке |
| P1 | Путь другого проекта той же компании принимался после проверки project claim | Подписанный storage path мог противоречить project_id строки; удалённый task и конфликт task/day теряли исходное основание | Исправлено в этой ветке |
| P1 | Результат анализа фото отчёта теряется | `ai-analyze-media.ts` ожидает `analyzeImage`, но не сохраняет AnalysisResult; тест «idempotent» допускает два provider calls | Открыто; следующая реализация после безопасного source contract |
| P1 | Анализ отчёта отмечается успешным без аналитического результата | `ai-analyze-report.ts` — явный sentinel/no-op | Открыто; успех очереди нельзя считать готовностью AI-отчёта |
| P1 | Асинхронный video executor отсутствует | `runOneJob.ts` явно возвращает Video processing not implemented yet; синхронный daily-video API не закрывает job lifecycle | После durable image result и human review |
| P1 | Preproject AI intake не завершён | Ручной customer-intake существует; owner-bound workspace, extraction/review/promote ещё нужны | После Owner/evidence/Graph dependencies |
| P1 | Новые количества, цены и строки заказа отсутствуют | В AISTROYKA не найдены реализации QuantityRevision/WorkSpecification; customer_estimate_items остаётся SQL основой без полного line CRUD | C04/C05 → A01/A02/A03/A04/A05 |
| P1 | Trusted price отказ в ObraPrecio обходится fallback | На свежем PR #63 HEAD 05e4bbee три hermetic reproducer случая expired/prohibited/FR снова получили own_price_found после trusted отказа | Исправление O04 остаётся открытым; второй репозиторий здесь не изменялся |
| P2 | Dimension guard ObraPrecio уже исправлен в текущей ветке | PR #63 теперь 05e4bbee; confirmed-room-dimensions нормализует cm/mm и требует confirmed inputs; обе capture ветки используют helper; 24 hermetic unit cases PASS | Не повторять старый C01 unit/default defect; legacy template factors и полная C04 parity требуют новой проверки |
| P2 | Предупреждения React и изображения в сборке | 47 warnings в 34 файлах скрываются lint --quiet, но видны при Next/Cloudflare build | [Инвентарь предупреждений](build-warnings.json); отдельный анализ эффектов/изображений, без слепой правки dependency arrays |
| P2 | Служебные функции имеют лишний доступ из Data API | Живые advisors и определения показывают EXECUTE для anon у 12 SECURITY DEFINER функций | PR #447 подготовлен, 27 PGlite и 27 native PostgreSQL checks PASS; hosted apply открыт |
| P2 | Статусы, registry и truth snapshot устарели | STATUS указывает #444/активный #445 после объединения; snapshot августа содержит прежние SHA | Новый аудит даёт текущую основу; исторические файлы не переписываются как новые доказательства |
| P2 | Устройства и полные пользовательские пути требуют отдельной приёмки | Старый physical gallery имел UI initialization timeout; текущий unit/build PASS не проверяет camera/OAuth/push/offline/store | Сохраняются существующие device/distribution gates |

Правило источника теперь проверяет точную пару media/upload в одной записи вложения до signing. Raw image_url не заменяет источник отчёта. Старые самостоятельные previews и project-prefixed media сохраняются при корректной привязке. Worker days без project_id поддерживаются; исчезнувший task/day и конфликт проектов дают отказ.

## База данных

Активный проект — `vthfrxehrursfloevnlp`. Свежая история содержит 200 записей. Receipt preflight проверил 11 исходных файлов и десять remote IDs: VERIFIED_RECEIPTS_DO_NOT_REPLAY. [История](migration-history.json) содержит только метаданные. Историческая полная parity не следует из этого узкого результата.

Живой `ai_analysis.media_id` остаётся NOT NULL, а job_id ссылается на другой контур analysis_jobs. Поэтому upload-session-only результат нельзя сохранить туда выдуманным media ID. Нужен явно проверенный контракт хранения, точного execution lease, повторной проверки источника после provider I/O, current actor/account eligibility, повторов и human review. Уже применённые SQL не переписываются.

[Advisors](database-advisors.json) показывают четыре INFO о RLS без политики и по 12 WARN об EXECUTE для anon/authenticated. Закрытые служебные таблицы без client policies могут быть намеренным запретом. Authenticated EXECUTE некоторых membership helpers нужен политикам и API. У trigger functions прямого клиентского вызова быть не должно. `project_belongs_to_tenant` доступен anon и возвращает существование пары project/tenant без caller check; его публичное разрешение нужно убрать. Другие четыре проверенных boolean helpers используют auth.uid и не превращаются в доказанную эскалацию лишь из-за advisor warning. [Описание проверки Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

## Проверки

| Проверка | Результат |
|---|---|
| Исходные web/contracts unit tests | 484 файла, 2798 тестов PASS |
| Воспроизведение новых source defects до исправления | 9 негативных/совместимых случаев FAIL, 2 PASS |
| Resolver и media-handler после исправления | 3 файла, 53 теста PASS |
| Полный набор после исправления | 485 файлов, 2809 тестов PASS |
| Исходные lint и i18n | PASS |
| Текущие iOS Manager/Worker/Customer simulator Debug сборки | Все три BUILD SUCCEEDED на основе e0c9f51, signing disabled; UI/device/store этим не проверены |
| SQL grant срез PR #447 | 27 PGlite + 27 native PostgreSQL checks PASS в required CI 38374397506 |
| C04 вычислительное ядро | 24 сценария, включая 40 независимых синтетических сеток; 485 файлов / 2822 tests, lint/typecheck PASS на отдельной ветке |
| Cloudflare/OpenNext сборка до и после исправления | PASS |
| Runtime health staging/apex/www | Три успешных ответа, SHA MATCH |
| Hosted schema/advisors/history | Read-only; бизнес-данные и схема не изменялись |

Первый локальный прогон имел пять ошибок subprocess: Node выбирал `/usr/local/bin/python3` другой архитектуры. Прогон с `PATH=/usr/bin:$PATH` проверил те же сценарии без изменения тестов. Это ошибка локального инструментария, а не пять найденных продуктовых дефектов. Сборка, unit tests и health не заменяют полный browser/device/eval сценарий.

## Выполненные срезы доработки

[PR #446](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/446) закрывает source binding; required CI 38376541933 PASS на code/doc HEAD ce0317cf (предыдущий code HEAD 520b7750 также PASS). [PR #447](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/447) убирает лишний прямой RPC доступ; required CI 38374397506 PASS на d3b37133, включая native PostgreSQL. Оба остаются draft/не объединены; source/runtime/migration статусы различаются.

[PR #448](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/448) содержит первый C04 срез: точные rational area unions/deductions/stage intersections, seam intervals, stable element counts, material/waste/pack quantities и exact normalized-price line arithmetic. Исходный commit b7fbbc78, required CI 38376370707 PASS. Вместе три среза проверены на локальном integration commit 83faa042: 486 файлов / 2833 tests, Cloudflare build и 27 isolated SQL checks PASS; integration branch не опубликована и не меняет main. [Документ с объёмом и остатком](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/blob/b7fbbc78efee836dbbc8223c3c7e97a225b70cbc/docs/roadmap/STAGE2A_C04_QUANTITY_ENGINE_2026-10-13.md) находится в этой отдельной ветке. Это pure core, без новых API/UI/hosted storage и без статуса verified. C04 и C05 остаются открытыми целиком.

## Очередь полной доработки

1. Доставить исправление источников через PR/required CI/независимый review и проверить опубликованный SHA. Отдельно убрать лишние SQL grants, сохранив необходимые authenticated membership helpers и рабочие triggers.
2. Реализовать durable report-media результат. Переиспользовать текущий AIService/queue; определить связь platform job, attachment и source revision, хранение upload-only, atomic lease fencing, retry без второго AI-вызова после записи, внутренний read projection и review. Проверить isolated SQL races и один реальный Worker-upload/result/retry/review цикл.
3. Закрыть human correction/source lifecycle и Graph lineage. Затем video/cancel и reviewed owner-bound preproject extraction. Customer получает только разрешённую проекцию до формирования LLM context.
4. Развивать этап 2а: C04: первый executor и точная финансовая арифметика реализованы в PR #448; далее adapters/parity и явные commercial rules; C05 независимые эталоны и утверждённые допуски; A01 хранение, A02 Manager, A03 Worker, A04 review, A05 коммерческие строки. Цены и количества проверяются отдельно. Obra O04 и legacy template/quantity parity — отдельные срезы второго продукта; confirmed-room-dimensions guard уже есть на 05e4bbee.
5. После основной цепочки — completeness/rules, один takeoff evaluation и AIS-RECON-017. Retrieval, live intake, 3D, sensors, matching и supply сохраняют зависимости последнего плана. Store/legal/billing shadow gates требуют своих реальных доказательств.

Полная готовность проекта остаётся открытой. Число зелёных тестов не является процентом завершения roadmap; оценки качества автоматических замеров нельзя назначить без независимых данных и утверждённых допусков.
