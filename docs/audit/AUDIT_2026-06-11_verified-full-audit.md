# Подтверждённый аудит Aistroyka — 2026-06-11

Аудит выполнен с прямым доступом к репозиторию (ветка `main`, HEAD `e58a129`), базе Supabase
(`vthfrxehrursfloevnlp`), команде Vercel (`team_Lp5ObDjuOVC1Y0650tGhEPLe`) и GitHub.
Отчёт сверяет гипотезы предварительного web-research-отчёта с фактическим состоянием проекта.

## Сводка: гипотезы → факты

| # | Гипотеза предварительного отчёта | Вердикт |
|---|---|---|
| 1 | RLS-дыры, утечка финансов клиенту (P0) | **Опровергнута.** RLS включён на всех ~130 таблицах public; финансы изолированы на уровне таблиц и политик (см. ниже) |
| 2 | `service_role` в клиентском коде (P0) | **Опровергнута.** Ключ только в server-only конфиге (`lib/config/server.ts`), без `NEXT_PUBLIC_`; `lib/supabase/server.ts` дополнительно отклоняет service_role JWT с 403 |
| 3 | `output: 'standalone'` ломает Vercel (P0) | **Опровергнута.** Уже условный: включается только при `NEXT_PRIVATE_STANDALONE` (cf:build), Vercel собирает обычный билд |
| 4 | npm вместо bun из-за lock-детекции (P1) | **Частично.** npm в `apps/web/vercel.json` — явный выбор, а не сбой детекции. Но корневой `package-lock.json` был битым — и именно он ломал деплои (см. «Корневая причина») |
| 5 | CANCELED из-за частых пушей (P1) | **Подтверждена исторически** (старый проект `aistroyka-web`, эпоха PR #12). На активном проекте `aistroyka-web-web-v7jq` проблема — ERROR, не CANCELED |
| 6 | Long-lived ветка PR #12 (P1) | **Устарела.** PR #12 смержен 2026-05-03 (306 файлов, +21 754). Актуальный риск — 9 «зависших» draft-PR от cursor[bot] (см. ниже) |
| 7 | Supabase advisors: RLS/search_path/FK (P1) | **Закрыта владельцем.** Security advisors: **0 замечаний** (закрыты в PR #75). Performance: 271 INFO-замечание (90 неиндексированных FK, 181 неиспользуемый индекс), 0 WARN |
| 8 | Токены вне Keychain/Keystore (P1) | **Опровергнута.** iOS: `ios/Shared/Sources/Shared/KeychainHelper.swift` + `AuthService`. Android: `EncryptedSharedPreferences` в `android/shared/.../SessionStore.kt` |
| 11 | OpenNext/Cloudflare конфиг (P1) | **В порядке.** `wrangler.toml`: `nodejs_compat`, compatibility_date 2024-12-30, wrangler ^4.67, Node-runtime |

## Корневая причина ERROR-деплоев на Vercel (подтверждено и исправлено)

Последний зелёный production-деплой — `c1862bd` (PR #74). Все последующие деплои из `main`
(`f2f3267`, `e58a129`) и PR #76 падали с ERROR на шаге `next build`:

```
⨯ Failed to load next.config.js
[Error: No prebuild or local build of @parcel/watcher found. Tried @parcel/watcher-linux-x64-glibc.]
```

Цепочка: `next.config.js` → `next-intl/plugin` (next-intl 4.8.3 имеет жёсткую зависимость
`@parcel/watcher`) → нативный платформенный бинарь. В **корневом** `package-lock.json` для
`@parcel/watcher` была зафиксирована единственная платформа `@parcel/watcher-darwin-x64`
(лок генерировался на macOS и был рассинхронизирован — это же блокировало `npm ci`, см. PR #50).
Vercel ставит зависимости по корневому локу (`installCommand: cd ../.. && npm install`) на
linux-x64 → бинаря нет → конфиг не загружается. Ошибка воспроизведена локально байт-в-байт.

Дополнительно лок содержал ещё один дефект: запись `apps/web/node_modules/next` (симлинк,
создаваемый postinstall-скриптом `link-next-if-workspace.cjs`) при перегенерации поверх
симлинка превращается в пустой объект `{}` без версии, что валит любой следующий
`npm install` ошибкой `npm error Invalid Version:`.

**Исправлено в этом коммите:**
1. Корневой `package-lock.json` перегенерирован на linux: все 13 платформенных бинарей
   `@parcel/watcher` зафиксированы; запись `apps/web/node_modules/next` приведена к валидной
   link-форме `{"resolved":"node_modules/next","link":true}`.
2. После перегенерации лока всплыл второй блокер: `@ts-expect-error` в
   `apps/web/lib/public/contact-lead-submit.ts` становился «unused» (позиция type-ошибки
   плавает между patch-версиями `@supabase/supabase-js`). Заменён на стабильный каст
   `insert(row as never)` с комментарием.

**Верификация:** полный пайплайн Vercel выполнен локально с чистого состояния и прошёл:
`npm install --include=dev` → `npm run build:contracts:npm` → `npm run build:web:npm`
(next build завершился успешно, все маршруты собраны). `bunx tsc --noEmit` и eslint —
зелёные, bun-путь не затронут.

**Правило на будущее:** корневой `package-lock.json` регенерировать только на linux
(или в CI), не коммитить лок, сгенерированный на macOS поверх живого `node_modules`
с симлинком next.

## База данных (Supabase) — проверено напрямую

**Изоляция финансовых данных от клиента — подтверждена на уровне БД:**
- RLS включён на всех таблицах схемы `public` (проверено по `pg_tables.rowsecurity`).
- Внутренние финансы (`project_cost_items`) — SELECT только через
  `is_internal_tenant_reader_for_tenant`; портальные пользователи не имеют доступа.
- `payments`, `pricing_rules` — политика `deny_all (false)`, доступ только service_role.
- Клиентские сметы (`customer_estimates`, `customer_estimate_items`) видны порталу только
  в статусах `sent/approved/rejected/expired`; в таблицах нет колонок себестоимости/маржи —
  только клиентские `unit_price/total_price` (разделение по таблицам, а не по колонкам).
- Функции политик (`app_private.*`) — `SECURITY DEFINER` с зафиксированным `search_path`,
  проверяют членство по `tenants.user_id` / `tenant_members` / `project_stakeholders`
  через `(select auth.uid())`. **`user_metadata` в политиках не используется** —
  вектор подделки роли отсутствует.

**Advisors:** security — 0 замечаний. Performance — 271 INFO (0 WARN): 90 FK без покрывающего
индекса (41 таблица) и 181 неиспользуемый индекс (95 таблиц, в основном `idx_fkfix_*` из
прошлой волны ремедиации; часть осознанно удалялась в PR #66–70). Рекомендация: сверить
пересечение списков «unused» и «unindexed FK» перед следующей волной добавления/удаления
индексов; форсировать не нужно — уровень INFO.

## Ветки и PR

- PR #12 (`feat/platform-owner-cabinet`) — **смержен** 2026-05-03; рекомендация о дроблении
  относится к будущим фичам (PR #75 «mega sprint» снова был гигантским).
- **Актуальный риск:** 9 открытых draft-PR от cursor[bot] (#18, #27, #29, #30, #31, #33,
  #40, #45, #50, #53) с описаниями багов, часть — security. Выборочная сверка с main:
  - изоляция upload-sessions рабочих (#27/#30) и cron-secret (#45) — соответствующий код
    в main присутствует (исправления переносились отдельными PR);
  - **#50 (Telegram identity linking) — паттерн в main сохраняется**:
    `apps/web/app/api/v1/auth/telegram/route.ts:125` всё ещё резолвит
    `currentUser?.id ?? identityRow?.user_id`, т.е. валидный виджет-payload «несвязанного»
    Telegram-аккаунта неявно привязывается к текущей сессии без явного linking-флоу
    (конфликт уже занятой личности возвращает 409 — закрыт только этот случай).
    Требуется триаж: либо подтвердить осознанность поведения, либо добавить отказ/явный флоу.
  - Действие по остальным: пройти список, закрыть устаревшие, перенести живые фиксы.

## Vercel-гигиена

- В команде три проекта: активен `aistroyka-web-web-v7jq`; `aistroyka-web` и
  `aistroyka-web-web` — устаревшие дубли, продолжают плодить шумные деплои/статусы.
  Рекомендация: отключить Git-интеграцию или удалить неактивные проекты.
- Авто-отмена при частых пушах: при необходимости «чистых» статусов добавить в
  `apps/web/vercel.json` `{"github": {"autoJobCancelation": false}}` (не применено —
  поведенческое решение за владельцем).

## Триаж draft-PR от cursor[bot] (выполнен, см. вторую/третью ревизию ветки)

Каждое заявление ботовских PR сверено с фактическим кодом main:

| PR | Заявление | Вердикт | Действие |
|---|---|---|---|
| #50 | Неявная привязка Telegram к активной сессии | Был жив | **Исправлено в этой ветке** (409/403 + тесты) |
| #53 | `create_analysis_job` зовётся сессионным клиентом при отозванном EXECUTE | Был жив (upload-роуты, `lib/supabase/rpc.ts`) | **Исправлено в этой ветке**: RPC всегда через service-role внутри `lib/api/engine.ts#createAnalysisJob`, fail-closed без ключа + тесты |
| #33b | Bearer-only запросы падают на cookie-клиенте: `reports/[id]/analysis-status`, `projects/[id]/reports`, `activation/status`, `devices/unregister` | Был жив (все 4 роута) | **Исправлено в этой ветке**: переведены на `createClientFromRequest` |
| #33a / #29 | Android-манифесты не регистрируют `ManagerApplication`/`WorkerApplication` (краш на холодном старте) | Был жив | **Исправлено в этой ветке**: `android:name` добавлен в оба манифеста |
| #33c | AI-роуты analyze-image/analyze-video-daily без tenant-auth | Закрыт ранее | Закрыть PR как superseded |
| #33d | `/api/v1/sync/changes`: ошибки change-log трактуются как пустая дельта (`change-log.repository.ts` возвращает `[]` при error) | Был жив | **Исправлено в этой ветке**: throw в репозитории → 503 `sync_changes_unavailable` в роуте + тесты. Изменение контракта безопасно: мобильные клиенты кидают ApiError на ≥400 и ретраят без сдвига курсора |
| #33e | iOS+Android: start-shift выбрасывал ответ сервера и слал локальный ключ даты как `day_id` (uuid FK → создание отчёта ломалось) | Был жив на обеих платформах | **Исправлено в этой ветке**: `startDay` декодирует `worker_day.id`, клиенты шлют `day_id` только если это UUID (легаси-ключи не отправляются) |
| #33f | iOS: делегат фоновой загрузки финализировал не тот object_path (полный photoItemId vs prefix(8), потеря uploadPath из зависимостей) | Был жив | **Исправлено в этой ветке**: точный путь персистится при планировании, делегат использует его; легаси-фоллбек выровнен по имени файла |
| #31 | iOS-менеджер: гонки фильтров/устаревшие данные | Не верифицируемо чтением кода | Ручная проверка на симуляторе |
| #18 | Subscription-gate redirect внутри try/catch + нет исключения для stakeholder | Был жив: `redirect()` бросает NEXT_REDIRECT, локальный catch его проглатывал — гейт был мёртв | **Исправлено в этой ветке** (redirect вынесен из try/catch). ⚠️ После мержа гейт впервые реально включится в проде: убедитесь, что пилотные workspace в `billing_pilot_workspaces`, либо выставьте `SUBSCRIPTION_GATE_DASHBOARD=pilot`. Stakeholder без tenant'а гейтом не задевается (`tenantId=null`) |
| #27/#30/#45 | Изоляция upload-sessions, cron-secret | Закрыты ранее | Закрыть PR как superseded |
| #40 | Runbook описывает прод-деплой как push-triggered | Док расходится с заявлением PR | Решить, какое поведение актуально, и закрыть PR |

## Остаточные рекомендации (без изменений в этом PR)

1. Дозакрыть триаж: #31 (iOS-менеджер, нужен симулятор) — затем закрыть все ботовские draft-PR (#18, #27, #29, #30, #31, #33, #40, #45, #50, #53) как superseded/triaged. Примечание: iOS-код этой ветки компилирует ios-ui-smoke на PR; Android-сборка в CI запускается только вручную (workflow_dispatch) — прогоните `:AiStroykaWorker:assembleDebug` перед релизом.
2. Согласовать судьбу двойного лок-набора (bun.lock + package-lock.json): npm-путь нужен
   Vercel, bun — CI/Cloudflare; зафиксировать в CI проверку согласованности корневого лока
   (`npm ci --dry-run` на linux) чтобы рассинхрон не возвращался.
3. Performance-advisors: спланировать волну FK-индексов/чистки unused-индексов (INFO, не срочно).
4. Удалить/заархивировать неактивные Vercel-проекты.
