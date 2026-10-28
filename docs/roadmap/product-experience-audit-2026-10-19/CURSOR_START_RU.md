# Cursor — продолжить AISTROYKA по существующему плану

Используй текущий main и действующую очередь. Аудит 19 октября интегрирован 20 октября в существующие Phase 0–13; V2 IDs уточняют эти требования.

## Маршрут чтения

1. [AGENTS](../../../AGENTS.md), [START_HERE](../../../START_HERE.md), [STATUS](../../../STATUS.md), [PROJECT_CONTEXT](../../../PROJECT_CONTEXT.md).
2. [Active work registry](../../tasks/ACTIVE_WORK_REGISTRY.csv), [current execution state](../CURRENT_EXECUTION_STATE_2026-10-11.md), [existing execution DAG](../AISTROYKA_100_PERCENT_EXECUTION_DAG_2026-10-03.md).
3. [Canonical roadmap](../AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md), [amendment](../AISTROYKA_PLAN_AMENDMENT_2026-09-23.md), [V2 integration](../AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md).
4. [97 mappings](CANONICAL_MAPPING_RU.md) → один пакет в [полном плане](MEGA_PLAN_RU.md) → findings/source/API contracts/состояния/AC/тесты. Дизайн: [MagicPath brief](MAGICPATH_DESIGN_BRIEF_RU.md).

## Исполнимое поручение

Обнови remote/main и открытые PR, выполни `python3 scripts/ops/workspace_preflight.py --refresh`. При продолжении existing PR проверь его свежий HEAD и resume preflight согласно START_HERE. Не трактуй CHECK_UNAVAILABLE как PASS; для разработки нужен подтверждённый baseline. Сохрани dirty/ahead/local salvage, не делай reset/force-push.

Первый рекомендуемый небольшой срез — **V2-WEB-01** (Create Task render loop), existing AIS-PILOT-001, Phase 1. Сначала проверь, не закрыт ли он актуальным кодом/PR. Если закрыт, зафиксируй source/runtime доказательство и возьми следующий применимый acceptance gap; повторную реализацию не создавай. Если открыт — повтори meaningful repro, сделай минимальную поправку, проверь отсутствие loop и корректное открытие/закрытие Create Task, затем scoped PR/task/handoff.

Не исполняй все 97 пакетов одной командой и не создавай 97 PR. На каждый срез выбери owner, precise scope, общие contract dependencies и применимый release gate. Suggested owners/estimates не являются назначениями или обещанным сроком.

## Неподвижные границы

Текущий contractor-ops-only пилот, iOS primary; Android deferred. Customer/AI/commercial отдельны. Existing Customer/Graph/intake/publication/daily-log переиспользуются. `/owner` platform surface не становится Customer route. Customer не получает internal costs/margin/contractor financial state. Account-first и 7-day zero-drift остаются действующими.

CON-01 outcome/dedup, CON-02 bootstrap, CON-03 media/revision, CON-04 только reports collection имеют одного backend owner. AND-09 зависит от CON-04; IOS-19 — только inbox/list/count slice. IOS-17 и manual WEB-12 не ждут CON-04. AI area WEB-12 ждёт ARCH-05 отдельно; WEB-30 — только проверка PUB-01…08. Полный IOS-30 не блокирует независимый core slice Customer/AI задачами.

Не меняй frozen tickets/findings JSON и не копируй исторические PASS на новый build. Веди Implemented → Verified → Released отдельно, указывай сборку/роль/среду/артефакт/проверяющего. Документация/макет/нажатие кнопки не доказывают сохранность и доступность результата получателю.

Итог каждого среза: что изменено, почему, какой точный acceptance закрыт, что проверено/NOT_RUN/BLOCKED, remaining risk, ссылка на existing/new scoped PR и следующий шаг. Merge/deploy/DB/store следуют существующему защищённому процессу и соответствующим разрешениям проекта.
