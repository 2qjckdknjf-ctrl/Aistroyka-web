# Closure Sprint A — контракт `release:check` (readiness script)

**Проект:** Aistroyka  
**Скрипт:** [`scripts/release-readiness-check.mjs`](../../scripts/release-readiness-check.mjs)  
**Команда (корень репо):** `npm run release:check` (= `node scripts/release-readiness-check.mjs`)  
**Дата фиксации:** 2026-03-23  

---

## 1. Зачем нужен скрипт

Быстрая сводка готовности к релизу: обязательный Supabase-контур, безопасность debug-флагов в production, cron, наличие build/test в `package.json`, опциональные Stripe / AI / push. Результат пишется в **игнорируемый** каталог `reports/release-hardening/` (см. корневой `.gitignore`).

---

## 2. Откуда берутся переменные окружения

Перед проверками скрипт **подмешивает** файлы (только если переменная ещё **не** задана в `process.env`):

1. `apps/web/.env.local`
2. `apps/web/.env`

Итог:

| Сценарий | Поведение |
|----------|-----------|
| Чистый `process.env` (например `env -i … node scripts/release-readiness-check.mjs`) и **нет** `.env*` | Три обязательных ключа Supabase считаются отсутствующими → **FAIL** |
| Локально есть `apps/web/.env.local` с ключами | Они подхватываются → блок `env_*` может стать **PASS**, если значения непустые |
| CI передаёт секреты в env workflow | То же: подстановка из файлов не нужна |
| Переменная уже в окружении процесса | Файлы её **не перезаписывают** |

---

## 3. Жёсткие FAIL (без них не будет `PASS`)

Проверяются непустые строки:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Интерпретация для локальной разработки:** отсутствие этих переменных — **ожидаемый FAIL**, а не признак «сломан код». Для релизного gate скрипт нужно гонять в окружении, где секреты реально заданы (CI job с secrets или машина с заполненным `.env.local`).

---

## 4. Зависимость от `NODE_ENV`

| Условие | Дополнительные правила |
|---------|-------------------------|
| `NODE_ENV !== production` (в т.ч. не задан) | `debug_surface` → **PASS** («Not production»); `cron_config` → **PASS** («N/A») |
| `NODE_ENV=production` | Включаются проверки debug/diag (`DEBUG_AUTH`, `DEBUG_DIAG`, `ENABLE_DIAG_ROUTES`, `ALLOW_DEBUG_HOSTS`) и cron (`REQUIRE_CRON_SECRET`, `CRON_SECRET`) — см. исходник скрипта |

То есть **без секретов** и **без production** вердикт обычно **FAIL** только из-за трёх Supabase переменных; остальные ветки в dev дают PASS/WARN.

---

## 5. WARN и опциональные интеграции

Даже при **PASS** (все обязательные env на месте) возможен итог **`PASS_WITH_WARNINGS`**:

- Чеклист storage (заглушка-предупреждение)
- Не настроены Stripe, AI, push — по желанию оператора

---

## 6. Код выхода и артефакты

| Вердикт | `process.exit` |
|---------|----------------|
| `FAIL` | `1` |
| `PASS` или `PASS_WITH_WARNINGS` | `0` |

Файлы отчёта:

- `reports/release-hardening/release-readiness-check.json`
- `reports/release-hardening/release-readiness-check.md`

---

## 7. Связь с другими gate

- **CI / Cloudflare deploy:** обязательные секреты для workflow описаны в [`CLOSURE_A_RELEASE_RECONCILIATION.md`](./CLOSURE_A_RELEASE_RECONCILIATION.md); это **не** то же самое, что три переменные выше (хотя в проде они должны быть согласованы с Worker).
- **Проверка env по режимам bash:** [`scripts/release/check-env-config.sh`](../../scripts/release/check-env-config.sh) (`deploy-staging`, `deploy-production`, `migrations`, `pilot-smoke`) — ортогональный слой для GHA/оператора.

---

## 8. Краткая матрица «с секретами / без»

| Окружение | Типичный вердикт | Смысл |
|-----------|------------------|--------|
| Пустой env, нет `.env*` | **FAIL** (3× env_*) | Норма для «голой» машины; локальный gate — `build` / `lint` / `test` |
| Заполнены три Supabase ключа | **PASS** или **PASS_WITH_WARNINGS** | Готовность по контракту скрипта; WARN — опциональные сервисы |
| `NODE_ENV=production` + опасные debug-флаги без allowlist | Возможен **FAIL** на `debug_surface` | Защита от утечки диагностики в прод |

См. также таблицу локальных команд в [`CLOSURE_A_RELEASE_VALIDATION.md`](./CLOSURE_A_RELEASE_VALIDATION.md) §3.
