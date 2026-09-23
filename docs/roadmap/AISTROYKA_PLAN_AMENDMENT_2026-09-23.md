# AISTROYKA — дополнение к плану, 2026-09-23

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

