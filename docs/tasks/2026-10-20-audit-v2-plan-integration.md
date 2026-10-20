# Task — включение V2 аудита в существующий план

## Task name
Complete audit-to-canonical-roadmap integration, 2026-10-20. [Draft PR #453](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/453) — OPEN / draft.

## Branch
`docs/aistroyka-audit-v2-plan-2026-10-20`, isolated worktree from fresh source baseline `04ec74bf955c29799ab535c043a33c1f9296c309`.

## Goal
Сделать полный повторный аудит частью уже используемого плана: одна очередь, existing Phase/AIS, все критерии и понятное продолжение в Cursor.

## Scope (what this task WILL do)

- Перенести полный текст отчёта, 97 пакетов, 73 findings, 406 AC, 243 будущих проверки, design brief и frozen snapshots.
- Добавить одну primary Phase каждому пакету, existing requirements и separate release scopes; сохранить source history.
- Обновить canonical phase pointers, amendment, START_HERE/context/status/dashboard, task/handoff/index; зарегистрировать один реальный PR после публикации.
- Проверить counts, DAG, criteria presence, ссылки, source hashes и docs-only diff.

## Out of scope (what this task will NOT do)

- Изменять продуктовый код, схемы/данные, CI/build config, роли, billing или выпускать приложение/макеты.
- Отмечать исправления implemented/verified/released, переоткрывать уже delivered модули, создавать 97 параллельных работ.

## Files allowed to change

`START_HERE.md`, `PROJECT_CONTEXT.md`, `STATUS.md`, `PROJECT_DASHBOARD.md`; canonical roadmap/amendment/current execution state; `docs/roadmap/AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md`; `docs/roadmap/product-experience-audit-2026-10-19/**`; этот task и task index/ACTIVE_WORK_REGISTRY; handoff и handoff index. Все изменения — документация/данные плана.

## Files / areas NOT allowed to change

Application source, tenant/auth/middleware, account/billing gates, production/Cloudflare/Supabase/CI configuration, migrations, native build/store/distribution. Customer-finance semantics и historical frozen source audit остаются неизменны.

## Required checks

- Документная integrity validation — [результат](../roadmap/product-experience-audit-2026-10-19/VALIDATION.md).
- Git diff --check и documentation-only path allowlist.
- Fresh GitHub main/PR source comparison; local preflight. CLI remote refresh CHECK_UNAVAILABLE в текущей среде, не подменён PASS.
- Application lint/typecheck/tests/build/i18n: NOT_RUN / not applicable to a docs-only change; обычные PR CI остаются обязательными по правилам репозитория.

## Completion criteria

97 unique mappings; все 73 finding связаны; original 406/243 сохранены; hard/conditional links и ограничения CON/IOS30/WEB30 верны; существующая Phase нумерация и AIS IDs сохранены; переносимый полный материал; scoped Draft PR доступен для review.

## Handoff requirements

[2026-10-20-audit-v2-plan-integration.md](../handoff/2026-10-20-audit-v2-plan-integration.md), STATUS и реестр указывают фактический PR и наблюдённый первый HEAD `4f1792223917ce9a49e010dc9ea740e1539cdd59`; строка реестра является датированным snapshot, current HEAD обновлять через GitHub перед действием. Статус защищённого review/CI/merge указывается отдельно от готовности документации.

## Rollback notes

До merge — закрыть только этот docs PR, сохранив исходный архив. После возможного будущего merge — обычный reviewed revert конкретных docs commits. Данные продукта не изменены; reset/force-push не требуется.
