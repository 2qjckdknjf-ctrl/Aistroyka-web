# AISTROYKA — дополнение к плану, 2026-09-23

> Последняя корректировка: 2026-10-07 (вечер). Актуальные дополнения по сигналам 7 октября — в последнем разделе; прежние task IDs, очереди и gates сохраняются.

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

## Construction feedback и Supply intelligence — 2026-10-02

**AIS-CORRECTION-009 — P1 contract/storage slice, расширяет AIS-EVID-002/VISION-003/GRAPH-004.**
После текущих pilot/security gaps добавить durable corrections в существующие review flows. Отдельная UI-система и training model сейчас не нужны.
CorrectionEvent: tenant/project, prediction_id/version, source media/evidence refs, room/element/work-package IDs (или unresolved), work type, domain (vision/progress/scope/estimate/supply), proposed result, accepted/rejected/edited result, reason code/comment, reviewer/role, timestamps, model/package version и source lineage. Связать с decision/superseded version, не перезаписывать original prediction.
Human correction — кандидат evaluation signal, не согласие на training/provider transfer. Disagreements, revoked corrections, missing reason и uncertainty сохраняются.
AC: duplicate submit/retry идемпотентен; cross-project/revoked membership запрещены; units/currency/version фиксируются; original source и correction lineage воспроизводимы; stale source вызывает revalidation. “Не наблюдается на видео” не означает “не выполнено” без coverage evidence.

**Construction Eval Corpus:** tenant-isolated storage с access/retention/delete policy; real pilot media/PII не хранить в git. Offline ROMA получает sanitized/synthetic export с dataset digest, frozen split и provenance. Vision eval покрывает progress/defects/scope/quantity uncertainty, source timestamp/region и human review; held-out проекты не используются для tuning. Сбор разрешённых review данных раньше, training/promotion — отдельный reviewed slice.

**AIS-MATERIAL-008 — proactive Supply Agent:**
Observer читает approved schedule, requirements, inventory и supplier updates; считает need-by date с lead time/buffer и выявляет shortage/delay/price change. Только разрешённые read/search/compare и draft cart/order proposal; commitment/payment/communication через gates.
Сохранять lineage: proposal/alternatives/version, source price/lead time, schedule constraint, manager choice/reason, approved terms, actual delivery/cost. Actual costs — защищённые internal данные. Отсутствующее actual delivery не выдумывать; cheapest не означает best без delivery/spec constraints. Schedule/stock/version change делает proposal stale, rerun идемпотентен. Предпочтение одного manager не универсальное правило; обучение отдельно от evaluation.

**Graph foundation:** stable IDs для space/element/work item/material/quantity/price/contractor/schedule/evidence/issue/change, units/version/provenance и protected relations. Findings ссылаются на объекты и источники; собственного CAD не строить, future BIM/CAD imports через adapters.
Customer/intake/Graph/live порядок и finance isolation сохраняются. Baseline 23 сентября исторический; main на 2026-10-02: 0e3b1ede624183ac5e5d47ab3f72ad739553ebb7. Перед implementation проверить актуальные main/open PR/deployed evidence; deployment этим docs update не проверялся.

## Streaming Evidence и пространственный Graph — 2026-10-03

| ID | Очередь / зависимости | Deliverable |
|---|---|---|
| AIS-STREAM-010 | P1 interface/fixtures после evidence contracts; live UX после app/Graph | Provider-neutral SpeechProvider: stream start/partial/final, segment timestamps, language, confidence при наличии, cancel/reconnect/error. Синхронизировать audio/video capture clock и SourceEvent IDs; partial transcript provisional, final/versioned. |
| AIS-SPATIAL-011 | Расширение AIS-GRAPH-004, P1 schema/fixtures | Spatial entities project/building/floor/zone/room + wall/floor/ceiling/door/window/MEP/equipment; geometry reference/type, coordinate frame/origin/units, position/dimensions uncertainty, calibration/source/revision и связи work/material/schedule/evidence/issues/documents. Не строить отдельную spatial DB/CAD. |
| AIS-SPATIAL-PROVIDER-012 | Interface после spatial schema; backend LATER | SpatialModelProvider import/extract/create/modify/validate/export, capability/version support. Unsupported methods честно unavailable. IFC/BIM/vendor adapters выбираются отдельным spike; FORMAS/Tavus не approved dependencies. |
| AIS-OWNER-3D-013 | FUTURE после Graph + Owner foundation | Read-only room/element visualization с progress/issues/evidence. 3D — проекция Graph; проверенные status/time/source доступны, неизвестное не рисуется как завершённое. Проверка devices/performance/accessibility и 2D/list fallback перед внедрением. |

**Streaming AC:** consent и deny mic/camera, noisy/multilingual RU/ES terminology fixtures; partial/final ordering, silence/reconnect, duplicates, clock drift и unknown speaker/location. Speech timestamp ↔ video frame/source ↔ object/observation сохраняются; transcript не превращается в verified work автоматически. Confidence unavailable остаётся null. Worker walkthrough и Customer intake имеют разные auth/data projections.
Interactive AI-guided capture позднее предлагает дополнительный ракурс/деталь, не подтверждает качество работы. Несущая стена, безопасность/разрешение демонтажа не определяются по ответу заказчика или видео: draft question с требованием профессиональной проверки. Recording/retention и ephemeral session/egress/budget gates из AIS-CLIENT-005B обязательны.
Speech provider eval: строительная речь/шум, timestamps, terminology errors, RU/ES, latency p50/p95, reconnect/completion и total cost; доступность/цены/API проверить официально. Текущий provider не менять по дайджесту.

**Spatial AC:** неизвестные размеры/геометрия explicitly unresolved; нельзя извлечь точный масштаб без calibration. Проверять coordinate systems/units/revisions, renamed rooms, overlapping zones и import source lineage. Extraction — draft с review/corrections AIS-CORRECTION-009; uncertainty не теряется при export.
Будущая mutation “сместить стену” — versioned proposal → geometry/quantity estimate → schedule/commercial impact draft → approval, не автоматическое изменение baseline, заказов или internal/customer finance projections. Cost geometry links не раскрывают contractor margin.
Owner 3D status основан на reviewed evidence и coverage; отвергнутый/stale prediction не выдаётся за progress. Новая UI-фича не опережает базовый Owner portal/iOS. Async intake → Graph → live порядок сохраняется; текущие pilot gates действуют.

## Evidence / Graph / QA contracts — сигналы 4–6 октября, записано 2026-10-07

PLANNED. Дополнение AIS-EVID-002, AIS-VISION-003, AIS-GRAPH-004, AIS-CORRECTION-009, AIS-STREAM-010 и AIS-SPATIAL-011/PROVIDER-012. OpenSpace/BIMlogiq — непроверенные research references; интеграция, покупка, собственный Revit/BIM editor этим планом не утверждены. Specialist-agent архитектура продолжается через существующий orchestrator/skills; сначала fresh module audit.

### AIS-EVID-002 — Evidence Quality Gate / Capture Completeness
Versioned requirements по work type/element: обязательные детали/ракурсы, timestamp/freshness, coverage, пригодность изображения/локализации, source provenance. Completeness содержит denominator/requirement version и missing items; confidence отдельно, unavailable = null.
Capture quality verdict отделён от construction verdict. Хорошее фото не доказывает качество работ; плохое фото не доказывает дефект. При нехватке — INSUFFICIENT_EVIDENCE + конкретные recapture instructions, например показать примыкание трапа/порог; нельзя сертифицировать скрытую гидроизоляцию по общей фотографии.
AC: missing/blurred/stale/duplicate/conflicting captures, неверный объект и partial coverage; targeted recapture не требует опасного доступа/разборки. Human review/corrections сохраняют исходную observation и версии. Связать timestamp/partial/final с AIS-STREAM-010, не выдавать transcript за verified work.

### SpatialEvidence / EvidenceProvider — расширение AIS-SPATIAL-011 и PROVIDER-012
P0 data contract, P1 phone/video vertical slice после shared evidence foundations; остальные sensors LATER.
SpatialEvidence: tenant/project_id, capture_id, captured_at/received_at/timezone/clock uncertainty, space_id, element_ids/work_item_ids, optional contractor/schedule refs, source type/provider/version, coordinate system/units/calibration, geometry_ref, protected media_refs, observations/lineage, localization status, confidence/method, completeness/requirement version, analysis model/version, human verdict/reviewer/revision и retention/access policy.
Source: phone/video/360/drone/scanner/BIM/future sensor. BIM/model reference отличается от measured field capture и имеет revision/as-designed/as-built status. Unknown spatial link/geometry остаётся unresolved, а не guessed precise coordinate. Capture immutable; correction создаёт revision/supersedes link.
EvidenceProvider capability interface: capture/ingest/localize/timestamp/extractGeometry/extractObservations с supported/unsupported declarations, async job/cancel/idempotency/error и raw-to-normalized provenance. Не каждый provider умеет каждую операцию; server importer не обязан иметь camera capture. Normalized Graph независим от vendor.
AC: unsupported method возвращает явный результат; units/coordinate/revision mismatch, clock skew, renamed room, duplicate import и partial upload не теряют lineage. Tenant-safe refs, consent/retention, archive/delete и geometry uncertainty обязательны. Phone/video first; 360/drone/scanner/BIM adapters только отдельным spike с actual data/license/security evidence.

### Agent Graph Views — AIS-GRAPH-004 access contract
Graph хранит operational truth и protected references, не копирует passport/bank/contacts/raw media во все contexts. Contact_ref защищён отдельным profile access; derived summaries сохраняют classification.
Owner — customer-safe project projection; Supply — procurement-safe; Worker — assigned-work projection; остальные specialists — task-specific least privilege. Серверная projection/filter до передачи LLM, включая retrieval, tool responses, caches и exports. Role/tenant/project/assignment changes invalidate cached views.
AC: guessed refs, cross-tenant joins, revoked membership, indirect financial inference и tool bypass запрещены. Owner не получает contractor costs/margin/internal state. DataScope/DataFlowTrace из ROMA фиксируют allowed recipients/purpose; missing telemetry не clean privacy PASS.

### AIS-CORRECTION-009 — Construction Eval Corpus
Corrections/improvement, regression, hidden project holdout, adversarial и отдельно future authorized new-building canary. Split по объекту/связанному пространству/серии captures ДО обработки кадров; frames одной ванной не делить между tuning и holdout. Related duplicates и temporal leakage проверять.
Protected holdout хранится вне git/agent-readable workspace; consent/legal access, sanitization, retention/delete и label confidence/disagreement обязательны. Scope of consent не означает training permission. Frozen rubric различает real defect, insufficient evidence и uncertainty. Candidate prompt/capture/rule/model version не меняется во время eval.
AC: улучшение на corrections без hidden-project confirmation не promotion; verifier не автор candidate/rubric, regression/holdout coverage и per-work-type errors доступны reviewer. Canary на объекте только после product/runtime authorization; unsafe findings требуют специалиста, не automated acceptance.

### AIS-RULE-015 — Construction Rule Registry
P0 schema/review workflow, P1 один bounded QA/QC work type после Evidence Gate + Graph links, до автоматических construction verdicts.
Versioned ConstructionRule: id/version/status, jurisdiction/location, effective dates, work/element type, applicability/preconditions, typed condition/units, tolerance с provenance, severity, required evidence, source_document/revision/clause, verification method (deterministic/manual/expert/AI-assisted), reviewer/approval и supersession.
Document/spec extraction создаёт proposed rule → квалифицированная human verification → approved immutable registry version. Source доступен по разрешённой ссылке; AI не выдумывает норму, threshold или jurisdiction. Contract/project specs и statutory requirements помечены отдельно; conflict/unknown applicability блокирует conclusion и требует review.
AC: unsupported measurement, missing angles/scale, stale rule/source, contradictory jurisdiction и hidden work → INSUFFICIENT_EVIDENCE/BLOCKED по Outcome Contract, не PASS. Проверенные нарушения → FAIL с source/evidence; ABSTAIN не completion. Фото само по себе не доказывает нормативное соответствие/безопасность. No visual enforcement of precise dimensions without calibration; профессиональная проверка остаётся там, где необходима.
QA Agent получает identity/capability/GraphView/EvidenceRequirements/ToolSet/OutcomeContract; ROMA независимая проверка, policy/privacy FAIL overrides functional PASS.

### Coding handoff / порядок
Intent Ingest и machine-readable design constraints описаны в общем ROMA плане (2026-10-07); использовать актуальные approved design/render packages, localization/accessibility и отдельные Manager/Worker apps. Customer iOS/Owner report/live intake остаются прежними backlog/dependencies.
Cursor: fresh baseline/pilot/module audit → existing evidence/async vision + shared contract fixtures → phone/video SpatialEvidence/provider slice + completeness → Graph views → один reviewed rule pilot и project holdout → async intake/Graph/customer gates → future live/sensor integrations. Новые contracts не означают реализованную функцию или расширение contractor-ops-only pilot.

## Construction Memory / Skills — сигналы 7 октября, дополнение 2026-10-07 (вечер)

PLANNED; extends AIS-EVID/GRAPH/SPATIAL contracts, не новый customer rollout.

### AIS-MEM-016 — Construction Memory / multimodal retrieval
P0 contract/benchmark, P1 один evidence-search slice после authorized Evidence + Graph Views; retrieval не опережает current pilot/module audit.
Use GROW-RETRIEVAL-011 interface, independent product credentials/index namespace. Source text/doc clause/photo/video time segment/audio transcript/drawing → normalized evidence refs и Graph entity/work-package/room links. Graph остаётся operational truth; similarity только candidate relevance, не progress/quality/measurement verdict.
Запрос по комнате/гидроизоляции возвращает разрешённые source refs/snippets/time spans, modality, capture/source/model revisions, freshness/coverage и unresolved location. AI summary с source attribution; no evidence → honest insufficient result. Before/after pair требует explicit linkage, не similarity inference.
AC: server-side tenant/role/project-safe filtering до search/rerank/LLM, revoked source/delete cascade across vector/chunk/cache, partial indexing/model upgrade/coordinate revision и poisoned document; Owner projection не включает contractor costs/margin/private media. Retrieved text untrusted, egress policy до внешнего embedding/rerank. Real client media benchmark только после explicit data authorization; synthetic/sanitized first.
EmbeddingGemma 2 candidate claims/license/modalities/hardware verify before spike; existing baseline/hybrid recall/privacy/cost compare, no production vendor choice by news. Local mode не proof no telemetry/network leakage.

### Construction skills — existing registry, без дублирования
Версионировать MeasureWall/Area/Length, MaterialQuantity, NormalizeUnit и PriceSearch в существующем Skill Registry после audit. Bind input/algorithm/output/evidence/calibration/units/version/verification refs; MCP adapter не расширяет permissions.
Geometry from confirmed dimensions or approved calibrated adapter; deterministic area/length/waste/coverage/pack rounding, source product spec and product compatibility. Missing thickness/coverage/input → question, no invented number. PriceSearch returns normalized regional dated offers/source evidence with ambiguity/IVA/shipping/unit handling; model не financial authority.
AC: unit conversion, openings, unknown scale, waste boundaries, pack size/rounding, conflicting product specifications и stale region prices. Output draft проходит professional review; tools не делают safety certification, orders или baseline mutation. Independent checks link Requirement→AC→Evidence→Verdict; estimated quantity отличается от measured actual consumption.
AIS-MATERIAL-008 Supply Agent использует эти skills после прежних Graph/pilot gates, external messages/orders separately authorized. Spatial retrieval не включает 360/BIM vendor интеграцию автоматически.
