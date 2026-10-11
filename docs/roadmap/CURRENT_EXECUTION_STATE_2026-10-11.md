# AISTROYKA — актуальная сверка выполнения, 2026-10-11

Это сверка датированных TODO с реальным main и runtime, не новая продуктовая очередь и не объявление 100% готовности. Источник кода — origin/main. Проверенный runtime после #417: staging/production 35fa334. [Канонический mega roadmap](AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md), [операционный отчёт](../reports/2026-10-11-operational-closure.md).

| Контур | Уже сделано | Остаётся доказать / развить |
|---|---|---|
| A1 video authz | #386 merged; anonymous video 401 на обоих hosts; scoped tests есть | Полная матрица revoked/cross-tenant/live media в общей portal-проверке |
| A2/A3 stakeholder/daily log | Foundation/security код и миграции уже в main/live history; B2 persist уже есть | Не повторять; отдельный живой сценарий по AC при расширении pilot |
| A4/A5 approvals/summary | Реализация в main; профильные tests ранее PASS | Полный UX/evidence smoke отдельно от unit tests |
| A6 / DB runtime tail | Intake/RPC/lifecycle/private helpers/timestamp/FK indexes применены и проверены | Исторический migration drift — отдельный audit, не broad apply |
| A7 finance isolation | Production blocking stakeholder sanity PASS: stakeholder role, costs/estimate deny, portal denylist | Полный invitation → revocation, media/share, exports и AI-summary proof ещё шире этого smoke |
| B2 daily-log draft persist | Cabinet persistThenConfirmFieldDailyLog уже в main | Не переписывать старый PR353 срез |
| Customer iOS C1/C2 | Отдельный target/auth/list/detail/intake и project hints в main | Физический device smoke, push/offline/revocation и distribution отдельно |
| AIS-CLIENT-005A | Ручные draft CRUD/edit/submit/withdraw и DB lifecycle; live API PASS | Async text/photo/video → reviewed draft scope extraction этим не реализован и не доказан |
| AIS-CLIENT-005B | План live camera/voice intake | После Graph/Owner readiness, consent/provider/session/budget gates; не стартовать по одному факту CRUD |
| Vision E2 | Async lifecycle/request_key в main, live 4-arg RPC service-only, retry races PASS в изоляции | Полный live upload → job → source-linked result сценарий |
| Graph E3 | Persistence код и live schema присутствуют | Полный lineage/spatial/human-review сценарий; наличие таблиц не закрывает graph AC |
| AI E1 | Canonical provider smoke без fallback на проверенном runtime | Один vision вызов не закрывает все AI capabilities/evals; fresh hard audit до нового scope |
| ROMA F2 | #407 advisory schema срез merged | Не объявлять advisory enforcement или certification |
| Android D1/D2 | #408 D1 audit merged; первый pilot Android deferred | D2 только после установленной iOS readiness/dependency проверки |
| G/H delivery/truth | #415/#416/#417 protected merges, DB applied, stage/prod smoke, новые receipts и registry | Обновлять dated evidence; не принимать старые локальные папки за baseline |

Порядок следующей работы: fresh semantic/hard audit существующих security/AI PR (включая #200 image auth и legacy worker boundaries), затем полный portal/device scenario и недостающая AIS-CLIENT-005A extraction поверх существующего intake/evidence/Vision/Graph. Проверить все существующие реализации/PR/dirty salvage до новой ветки. 75 старых открытых PR требуют semantic review; три дополнительных exact duplicates закрыты, ветки сохранены.

Старый DAG 2026-10-03 и историческая requirement matrix сохраняют первоначальную постановку, но их TODO не доказывают отсутствие target, API, schema или кода сегодня. Реестр содержит реальный PR HEAD отдельно от merge SHA. Customer finance isolation, contractor-ops-only pilot, legal/device/store/billing/shadow gates сохраняются. Автономность не заменяет физические, временные или юридические свидетельства.
