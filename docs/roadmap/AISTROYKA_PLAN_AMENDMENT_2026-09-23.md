# AISTROYKA — дополнение к плану, 2026-09-23

> Последняя корректировка: 2026-09-26. Актуальные уточнения и порядок работ — в разделе за 2026-09-26 ниже; предыдущие gates сохраняются.

Статус: PLANNED. Документ задаёт backlog, не подтверждает готовность функций.
Канонический продуктовый план: [Mega roadmap](AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md).
Реализация новых пунктов начинается с повторной сверки main, открытых PR и runtime.

## Что установлено
Проверенная main: 25b33d841189b31ff43538762b72a4f7024d701f.
Есть web Owner/Customer portal, отдельные Manager/Worker mobile и contractor field daily log draft→confirm.
Отдельный Customer mobile target в предыдущем аудите не найден: перед созданием проверить актуальные targets и незамерженные ветки.
Наличие кода и старые записи DEPLOYED не доказывают текущий production/device readiness.
Видеопайплайн, daily log и будущий live intake — разные сценарии с общими доменными сущностями.

Текущий pilot остаётся contractor-ops-only. Customer backlog не расширяет его scope; перед включением customer surfaces требуется отдельный проверенный release slice.

## Порядок и задачи
Приоритет означает порядок разработки, не разрешение deployment.

| ID | Приоритет / зависимость | Результат и критерии приёмки |
|---|---|---|
| AIS-PILOT-001 | P0, первый шаг | Сверить main/staging/production SHA и текущие pilot gates; воспроизвести tenant/project authorization видео API; закрыть подтверждённые дефекты отдельным PR. Негативные проверки чужого tenant/project, отозванного membership и customer finance projection обязательны. |
| AIS-OWNER-001 | P0, после security | Проверить существующий портал end-to-end: приглашение, доступ только к своим проектам, прогресс, опубликованные фото/видео, документы, вопросы/decisions, согласование коммерческих изменений. Отзыв доступа действует и на media/share URLs; internal costs/margin отсутствуют в API, экспортах и AI-summary. |
| AIS-OWNER-002 | P1, после portal contracts | Customer/Owner iOS: самостоятельный клиентский интерфейс на общих auth/network/domain contracts. Сначала ADR по target/distribution после inventory; Manager/Worker не объединять. Минимум: проекты, timeline/progress, evidence, документы, approvals, связь по проекту. Loading/empty/offline/error, push deep links и session revocation проверены; device smoke нужен отдельно от сборки. Android parity позже. |
| AIS-EVID-002 | P1, после pilot | Общая цепочка field observation → source media/time → finding → work package → reviewed result. Переиспользовать daily log draft→confirm и proof packs. Повтор job не создаёт дубликаты; оригинал доступен только разрешённым ролям; неизвестное не становится подтверждённым фактом. |
| AIS-VISION-003 | P1, после evidence | Асинхронный анализ загруженного видео/чертежа: jobs, status/retry/cancel, source timestamps/regions, findings с uncertainty и human review. Различать вывод AI и подтверждённую работу. Ошибка provider оставляет восстановимый draft; размеры из изображения без калибровки не объявлять точными. |
| AIS-CLIENT-005A | P1, после Owner contracts и evidence | Async клиентский intake до проекта: текст/фото/видео → observations/rooms/zones/work items → draft scope. Изолированный owner-bound intake workspace до project creation. Пользователь редактирует/отклоняет/подтверждает draft; повтор подтверждения идемпотентен. Не создавать автоматически сметы, договоры или назначения. |
| AIS-GRAPH-004 | P1, после evidence/vision | Construction Graph связывает помещения, элементы, work packages, drawings, findings, evidence, решения, коммерческие версии и подрядчика. Intake draft IDs мигрируют без дублирования; provenance, версионирование, tenant boundaries и отзыв доступа сохраняются. Внутренние финансы остаются отдельной защищённой проекцией. |
| AIS-CLIENT-005B | P2, после graph + Owner iOS | Live AI Video Intake в приложении заказчика: кнопка «Показать объект AI», камера+голос, уточнения, draft scope, human confirmation. Feature flag off по умолчанию; запись только с явным согласием, stop/cancel/reconnect, deny camera/mic и fallback к async. Scoped ephemeral session, серверные provider credentials, лимиты длительности/стоимости. Tool calls не обходят owner/project policy. |
| AIS-MATCH-006 | P2, после подтверждённого scope/graph | Contractor matching по подтверждённым компетенциям и portfolio evidence. Объяснимые причины, отсутствие выдуманных рейтингов; выбор человеком, отдельные согласия на передачу данных. Не считать наличие directory готовым marketplace. |
| AIS-MATERIAL-008 | LATER, после pilot/graph | Materials/supplier intelligence как часть work packages: quantity/source/confidence, availability/price timestamp, lead time, delivery/consumption/residuals. Нет отдельного marketplace и автоматических закупок в текущем scope. |

Связь со старым roadmap: Owner = фазы 2–5; Evidence/Vision = 6–9; matching = расширение 11. Фазы 0–13 и их release gates не отменены. Async intake допускает временную draft-модель; live intake зависит от полноценного Graph. Это уточняет прежнюю укрупнённую последовательность AIS-PILOT → AIS-EVID → AIS-VISION → AIS-GRAPH → AIS-CLIENT.

## Runtime и проверка
Provider-neutral adapter для live/audio/video/tool-use; runtime выбирается отдельным spike после Graph.
Упомянутые в переписке версии Gemini и benchmarks не проверены и не являются утверждённой зависимостью.
Spike должен подтвердить официальные API, доступность, регионы/retention, мобильную задержку, качество русского языка, reconnect, цену на успешный intake и ограничения consent. Не добавлять SDK только по новости.

Для каждого slice: Requirement → AC → Test/Observation → Evidence → independent Verdict, см. [ROMA assurance](../roma/ROMA_EXECUTION_ASSURANCE_PLAN_2026-09-23.md).
Метрики: доля подтверждённых observations с источником, corrections/rejections, completion/reconnect rate, latency p50/p95, cost/confirmed scope; цели фиксируются после baseline.

## Задание Cursor
Прочитай AGENTS.md, PROJECT_CONTEXT.md, STATUS.md, Mega roadmap и этот документ.
Начни AIS-PILOT-001: сопоставь каждый пункт с кодом, открытым PR и свежим evidence; выдай IMPLEMENTED / PARTIAL / MISSING / BLOCKED.
Не переписывай уже существующие portal/daily-log модули. Первый implementation PR — минимальный подтверждённый security/contract gap.
Перед следующим slice зафиксируй requirements, AC, зависимости, команды проверки, evidence SHA и handoff. Этот документ не разрешает merge/deploy/store upload.

## Уточнение Customer/AI Digest — 2026-09-24
Статус PLANNED; уточнение AIS-OWNER-002, AIS-EVID-002, AIS-GRAPH-004 и фазы 7 AI Daily Digest, без новой параллельной фичи.

**Owner AI Report:** field evidence + verified progress + issues + approved commercial changes → draft weekly/daily summary → project human review → публикация в Customer App/portal.
AC: каждое утверждение/количество связано с разрешённым источником и периодом; unfinished/unknown не считается completed; delays требуют проверенного baseline schedule. Отчёт отличает факт, AI interpretation и pending decision. Человек исправляет/отклоняет draft; новая версия источников помечает draft/report stale и требует повторной проверки. Повтор публикации идемпотентен, есть version/audit trail.
Финансовый раздел показывает только customer-approved commercial totals и согласованные change orders; никакого внутреннего бюджета, costs/margin или прогноза финансов подрядчика. Customer projection применяется ДО LLM context assembly; post-filter недостаточен. Проверки foreign project, revoked access, media URLs, exports, notification preview и AI-summary leakage обязательны.

**Spatial context:** observation связывается с project → floor → room/zone → element → work item; drawing revision и source timestamp/region сохраняются. Неизвестное местоположение явно unresolved; нельзя выдумывать этаж/элемент. Пользователь подтверждает и исправляет привязку; graph поддерживает переименование/перенос без потери source lineage.
Live intake по-прежнему после Graph; async intake может пользоваться draft IDs. Существующий contractor-ops-only pilot не расширяется этим планом.

Reference из переписки: OpenSpace visual-agent/owner-report pattern. Заявленные сроки релиза, проценты готовности отчёта и экономия времени не проверены и не являются нашими KPI. Нового construction продукта или отдельной подсистемы не создавать.

## Action/Approval contract — 2026-09-25
Статус PLANNED; дополнение AIS-OWNER-001/002, фаз 3–5/9 и существующих release gates. Общий PresenceProof contract: ROMA-AUTH-002 в ROMA execution plan.

**AIS-APPROVAL-003 (P1, после access/decision contracts):** явное подтверждение привязано к project/tenant, environment, action, resource/version, artifact SHA или digest коммерческого документа, actor, expiry. AI готовит draft/evidence, человек подтверждает конкретную версию. Для выбранных значимых действий policy требует fresh auth: change order/additional work, contractor selection, customer payment approval (только если этот workflow уже предусмотрен), acceptance of handover. Это не добавляет payment execution или юридическую квалификацию электронной подписи.
UI показывает условия, scope, сумму/валюту и версию до подтверждения. Смена суммы/контрагента/версии делает прошлое согласие невалидным; право actor на проект перепроверяется сервером, nonce одноразовый, retries идемпотентны. Отказ/истечение auth сохраняет draft без side effects. AC: чужой проект/отозванный доступ/replayed proof/изменённый документ отвергаются; audit не раскрывает внутренние финансы подрядчика.

**Release integration (после общего enforcement ADR):** owner approval deploy конкретного SHA не даёт права на migration, RLS/auth-provider change или credential rotation. Каждая операция имеет собственный action/resource binding и текущие CI/reviewer/owner gates; недоступный fresh-auth механизм блокирует требующее его действие. Docs update не меняет существующий deploy workflow.

**Construction MCP/API adapters — WATCH / LATER:** drawings, estimating, suppliers, BIM, accounting, documents — кандидаты интеграции, не новые фичи текущего pilot. До подключения: inventory существующих API, CapabilityManifest/lifecycle, sandbox compatibility, egress/customer-finance boundaries и ROMA evidence. Новый tool/version default DENY; MCP transport не доказывает доверие. Отдельного Bluebeam SDK/коннектора по новости не добавлять; claims о внешнем продукте не проверены.
Customer App → async intake → Graph → live сохраняется; contractor-ops-only pilot не расширяется.

## Materials Supply — уточнение 2026-09-26
AIS-MATERIAL-008 остаётся LATER после pilot и Construction Graph. Реализовать как persistent domain agent в существующем Materials контуре, а не отдельный marketplace или только поиск товаров.

Inputs: graph work packages, утверждённые quantities/units/specifications, schedule/dependencies, delivery location и approved supplier sources.
Цикл: requirement → supplier search/availability/alternatives/price/lead time → versioned proposal → Manager approval → отдельно разрешённый order workflow.
Агент отслеживает изменение stock/price/delivery/schedule и создаёт новое предложение; не меняет согласованный заказ автоматически. Price/availability имеют source URL/API, fetched_at, currency/taxes/shipping, validity и confidence; неизвестное остаётся unknown. Альтернативы требуют проверки технической совместимости человеком.
Задачи наблюдения используют scoped AgentIdentity, approved package/runtime, aggregate budget, разрешённые triggers, TTL, pause/revoke и audit. Нет бесконечного polling; rate limits, backoff, dedupe и incident escalation обязательны.

AC:
- Изменение schedule/цены/количества/поставщика инвалидирует затронутую версию approval; новый proposal с diff и evidence.
- Supplier page/API — недоверенный input, не инструкция агенту; только разрешённые egress hosts и поля.
- Повтор event/restart не создаёт duplicate proposal/order/message; неизвестный outcome требует reconciliation.
- Внешние запросы поставщикам, follow-ups, встречи и сообщения требуют отдельного явного разрешения на коммуникацию; разрешение мониторинга его не заменяет.
- Orders/payments/cancellation — только через существующие capability/risk/approval/PresenceProof gates. Первый slice исключительно read/draft с fixtures, без реальных заказов.
- Manager видит внутренний procurement контекст; Customer получает только специально разрешённые commercial projections, не supplier costs/margin.
- KPI: актуальность подтверждённых availability/lead-time данных, proposal acceptance/correction, delay detection, стоимость на reviewed proposal; baseline перед целями.

Microsoft supplier-review pattern — непроверенный reference из дайджеста, не новая vendor dependency. Customer App/Graph/Live порядок и contractor-ops-only pilot остаются без изменений.
