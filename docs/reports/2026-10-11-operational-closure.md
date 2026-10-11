# Операционное продолжение AISTROYKA — 2026-10-11

После явного разрешения владельца закрыт прежний DB apply хвост и устранены ошибки, обнаруженные при применении. Проверенный runtime после #417: staging/production HTTP 200, buildStamp.sha7 = 35fa334; [health evidence](operational-closure-2026-10-11/post-atomic-deploy-health.json). Каноническая папка — AISTROYKA-main-clean; источник кода определяется свежим origin/main.

## Что реально изменено

- Live intake создан вместе с lifecycle guard атомарно; клиентские terminal inserts и недопустимые переходы запрещены, retries/content/service maintenance сохранены.
- Live create_analysis_job принимает p_request_key; obsolete 3-arg overload отсутствует, default покрывает legacy calls; EXECUTE только service_role. PostgREST cache проверен отрицательным вызовом с несуществующей media (P0002), без создания live AI job.
- #415 (2e2f07da) переместил пять внутренних helpers в app_private, сохранив OIDs и policy/trigger bindings. Исправлена SQL-ссылка projectless grant; anon/PUBLIC execute снят, нужные authenticated policy paths работают.
- #416 (76579633) закрепил pg_catalog для daily-log timestamp и добавил два intake FK indexes. Mutable search-path warning исчез; два новых uncovered FK findings устранены. Existing security-definer warnings (12 для каждой роли) и legacy performance findings остаются для отдельной semantic review; не заявляется полное отсутствие всех advisors.
- #417 (35fa3347) исправил реальную production secret-edit гонку: reviewed code + existing provider secrets публикуются одной операцией, temporary file private/cleaned, omitted bindings preserved. Artifact stamp теперь из checkout HEAD; full staged SHA ancestors принимаются корректно. Root dependency locks не менялись.

## Проверки

38 sequential SQL, 26 native PostgreSQL 17.10/PostgREST 14.5 checks (три сценария по 40 concurrent requests), 97 application Vitest checks, 6 timestamp/FK checks, 6 deploy-boundary checks и 7 receipt-guard tests PASS. Required CI для #415/#416/#417 SUCCESS. Native isolation использовала реальные affected-table definitions/constraints/indexes/dependency helpers с синтетическими пользователями и данными; unrelated policies/triggers/Auth service не клонировались.

Live authenticated API cycle: create/edit/submit/withdraw, retries, запреты terminal transitions PASS; точные owned synthetic rows удалены и отсутствие проверено. [Evidence](operational-closure-2026-10-11/live-intake-cycle.json). Anonymous video 401 на обоих hosts ([negative](operational-closure-2026-10-11/video-anonymous-negative.json)). Это не заменяет весь Customer device/portal scenario.

#417 staging run 38129701520: deploy, pilot smoke, Playwright E2E PASS. Production run 38129925528: atomic deploy, security headers, pilot smoke и stakeholder finance sanity PASS. Canonical AI gate step SUCCESS и live provider result без fallback подтверждены; job-level continue-on-error не используется как единственное доказательство. [Production provider evidence](operational-closure-2026-10-11/production-provider-evidence.json).

## Защита от повторной работы

Пять проверенных SQL sources уже применены под четырьмя remote IDs; исходный timestamp сам по себе не означает pending apply. [Receipt map](../ops/DB_MIGRATION_RECEIPTS_2026-10-11.json) + read-only guard сверяют hashes/project/remote names, блокируют replay (exit 3) и changed source (exit 1). Bulk apply блокируется; remote history не удалялась и не ремонтировалась. Полная историческая сверка остаётся отдельной задачей.

Read-only blob audit охватил 78 прежних open PR. #281/#289/#293 закрыты после совпадения каждого изменённого файла с main; remote branch HEADs проверены и сохранены ([closure evidence](operational-closure-2026-10-11/duplicate-closure.json)). Все 75 оставшихся old open PR присутствуют в обновлённом реестре. head_sha теперь означает PR HEAD, merge_sha — integration commit. Dirty/protected источники, credentials/signing assets и приватные архивы не удалялись.

Обновлены STATUS, START_HERE, dashboard, current-focus и handoff. [Актуальная сверка плана](../roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md) отличает manual intake CRUD от недостающего AI scope extraction, наличие graph/schema от полного live сценария и API proof от physical-device/store readiness. Проект целиком и DAG 100% не объявлены завершёнными. Следующие security/AI semantic review и реальные product gates перечислены в этой сверке.
