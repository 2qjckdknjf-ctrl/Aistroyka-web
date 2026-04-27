# Closure Sprint A — индекс артефактов release discipline

**Проект:** Aistroyka (монорепозиторий AISTROYKA)  
**Назначение:** одна точка входа по документам закрытия Workstream A (дисциплина релиза).

| Документ | Содержание |
|----------|------------|
| [CLOSURE_A_RELEASE_RECONCILIATION.md](./CLOSURE_A_RELEASE_RECONCILIATION.md) | Согласование: канонический путь деплоя (Cloudflare GHA), миграции, смоук, Vercel как вторичный контур, rollback на уровне репозитория |
| [CLOSURE_A_RELEASE_VALIDATION.md](./CLOSURE_A_RELEASE_VALIDATION.md) | Контракт проверок: CI, миграции, локальные команды, контактный поток (дизайн валидации) |
| [CLOSURE_A_RELEASE_READINESS.md](./CLOSURE_A_RELEASE_READINESS.md) | Поведение `npm run release:check` / `scripts/release-readiness-check.mjs`: секреты, сценарии PASS/FAIL, отчёты |
| [CLOSURE_A_RELEASE_POST_AUDIT.md](./CLOSURE_A_RELEASE_POST_AUDIT.md) | Пост-аудит сессии: что осмотрено, что осталось на оператора, шаблон комментария для борда |

**Связанные материалы (вне префикса):** [`docs/ENVIRONMENT-VARIABLES.md`](../ENVIRONMENT-VARIABLES.md), [`scripts/release/check-env-config.sh`](../../scripts/release/check-env-config.sh), [`.github/workflows/apply-migrations.yml`](../../.github/workflows/apply-migrations.yml).
