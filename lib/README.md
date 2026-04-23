# Устаревший каталог `lib/` в корне репозитория

Этот каталог **не участвует** в канонической сборке веб-приложения Aistroyka (рабочий корень Next.js — `apps/web`).

- **Канон:** весь код приложения — в `apps/web/lib/`; из исходников под `apps/web` используйте алиас `@/lib/...` (см. `apps/web/tsconfig.json`, `paths`: `@/*` → `./*`).
- **Не добавляйте** сюда новую бизнес-логику, API-хелперы и клиенты Supabase для продукта.
- Контекст и план «без ломки»: [`docs/final/CLOSURE_A_ARCH_DRIFT_INVENTORY.md`](../docs/final/CLOSURE_A_ARCH_DRIFT_INVENTORY.md), [`docs/final/CLOSURE_A_ARCH_DRIFT_REMEDIATION.md`](../docs/final/CLOSURE_A_ARCH_DRIFT_REMEDIATION.md).
