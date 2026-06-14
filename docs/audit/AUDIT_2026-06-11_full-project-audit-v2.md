# Полный аудит проекта Aistroyka — ревизия 2 (2026-06-11, после мержей #77–#81)

Свежий сквозной аудит на текущем `main` (HEAD `ccc9830`) с прямым доступом к репозиторию,
Supabase (`vthfrxehrursfloevnlp`) и GitHub. Это вторая ревизия: первая (`AUDIT_2026-06-11_verified-full-audit.md`)
сопровождала исправления; здесь — состояние проекта **после** их мержа в прод.

## Итоговая оценка

Проект в хорошем состоянии. **P0/P1-проблем не найдено.** Прод зелёный (Vercel READY,
Cloudflare staging→prod success), security-advisors Supabase — 0 замечаний, изоляция
финансовых данных подтверждена на уровне БД. Остаток — P2/P3 гигиена (стейл-ветки,
точечный тех-долг типизации, отложенные перф-индексы).

## 1. Безопасность — web (P-нет критичных)

- **RLS / финансовая изоляция — подтверждено повторно.** Все таблицы `public`
  (~130) имеют `rowsecurity=true`; выборочно перепроверены `tenant_concurrency`,
  `tenant_settings`, `ai_provider_health` (миграции без inline-RLS) — RLS и политики
  навешаны отдельными миграциями. `project_cost_items`/`payments`/`pricing_rules`
  закрыты от портала; сметы видны клиенту только в клиентских статусах.
- **Supabase security advisors: 0 замечаний.**
- **Bearer vs cookie клиент:** 188 route-handler'ов используют `createClientFromRequest`
  (Bearer-совместимы), 50 — cookie-only `createClient()`. Разбор cookie-only: это
  admin-/tenant-/dashboard-маршруты (браузер, корректно). Мобильно-вероятные
  (`workers/[userId]/*`, `media/[mediaId]/annotations|comments`, `projects/[id]/workers`)
  — **уже** на `createClientFromRequest`. `projects/[id]/poll-status` остаётся cookie-only,
  но это web-dashboard-маршрут (в iOS/Android не вызывается — grep пуст), а доступ
  скоупится через RLS на session-клиенте. Не дыра.
- **Секреты в клиенте:** в 219 client-компонентах нет ссылок на `service_role`/`eyJ…`;
  переменных `NEXT_PUBLIC_*KEY/SECRET` (кроме anon/publishable) нет. service_role JWT
  отклоняется на сервере (`lib/supabase/server.ts`).
- **Защита от утечки сметы клиенту**, BOLA-проверки по tenant — выборка из ~15 v1-роутов
  показала единый паттерн `getTenantContextFromRequest → requireTenant` ДО доступа к данным.

## 2. Качество кода (P2)

- **Типобезопасность:** 40 точек `as any`/`@ts-expect-error`/`as never` в `lib`/`app`
  (вне тестов). Большинство — обход типов SDK Supabase для методов вне сгенерированных
  типов: `auth.verifyOtp`/`unlinkIdentity` (`app/api/v1/auth/{telegram,methods}/route.ts`),
  таблица `processed_stripe_events` не в Database-типах (`app/api/v1/billing/webhook/route.ts`),
  `cookieStore.set(... as any)` (`lib/supabase/server.ts:99`). Логических дыр нет — это
  typing-escape'ы. **Рекомендация P2:** до-генерировать типы БД (`processed_stripe_events`,
  `contact_leads`) через `generate_typescript_types`, чтобы убрать касты в billing/auth.
- **Молчаливые catch:** ~112 catch-блоков в `lib`. Выборка (`lib/cockpit/savedViews.ts`
  → `return []` при parse-ошибке локального стейта) — осознанные UI-фоллбеки, не
  маскировка data-layer (тот класс багов закрыт в sync/changes ранее). **Рекомендация P3:**
  при следующем проходе по data-репозиториям убедиться, что ни один `return []`/`null`
  не скрывает ошибку запроса к БД (как было в `getChangesAfter`).
- **CI-гейты:** `ci-check.yml` гейтит `i18n:check` + lint + `tsc --noEmit` + tests + `cf:build`
  + новый `validate-npm-lock.cjs` — полноценный набор.

## 3. Зависимости

- `npm audit` (prod): **0 high/critical**, 2 moderate. Приемлемо; закрыть в плановом
  обновлении (не форсить `--force` — ломающие мажоры).

## 4. Мобильные приложения

Подтверждено в предыдущих раундах и не регрессировало: токены в Keychain (iOS) /
EncryptedSharedPreferences (Android); Application-классы зарегистрированы; `worker_day.id`
и object_path фоновых загрузок исправлены (#77), generation-guard'ы фильтров (#79);
Android instrumented smoke зелёный (#80). **Не покрыто кодом:** ручной UX/краш-чек на
симуляторе/устройстве — требует живого прогона.

## 4b. Дизайн-аудит трёх поверхностей (web / iOS / Android)

**Сквозная палитра — выровнена почти полностью (проверено по значениям):**
- accent `#F5C518`, success `#34c759`, warning `#ff9500`, error `#ff3b30`, surface
  `#1F2937` — идентичны в web-токенах (`apps/web/app/design-tokens.css`), iOS
  (`ManagerSemanticColors.swift`) и Android (`AiStroyka*Theme.kt`).
- **Два расхождения (P3, решение за брендом):** фон — web `#040a18` vs мобильные `#0B0F19`;
  info — web `#007aff` vs мобильные `#3B82F6`.

**Соблюдение токенов:**
- Web: `check:design` чист; raw-цветов в компонентах нет; 274 aria-атрибута; `<img>` без
  `alt` — 0; токены покрывают типографику/отступы/радиусы/анимации, включая
  `--aistroyka-touch-min: 44px`.
- iOS Manager: хардкоды цветов только в файле токенов (корректно); **исправлено в этой
  ревизии:** 9 мест в Views/ использовали системные `.red/.green/.orange` мимо токенов —
  заменены на `ManagerSemanticColors.error/.success/.warning` (вкл. `ErrorStateView`).
  Фиксированных размеров шрифта нет (Dynamic Type соблюдён).
- Android: хардкоды цветов только в Theme-файлах (корректно), экраны на `MaterialTheme`.

**Остаток (P2/P3, не исправлялось):**
1. **iOS Worker без своей токен-системы** — использует системные цвета/`.orange` напрямую;
   рекомендация: вынести семантические цвета в `ios/Shared` (общий пакет для Manager и
   Worker; заодно закроет `InlineStatusViews.swift:44`).
2. Ручной WCAG 2.2 AA-проход (фокус, клавиатура, контраст на солнце для рабочих) — только вживую.

## 5. Гигиена репозитория и инфраструктуры (P2)

- **Стейл-ветки: ~40 незакрытых веток** на remote — `cursor/*` (закрытые ботовские PR),
  `fix/drop-redundant-indexes-batch1..7`, `docs/*`, `feat/platform-owner-cabinet` (смержена),
  `develop`. **Рекомендация:** удалить смерженные/устаревшие, оставить `main` + активную.
- **Vercel-дубли:** `aistroyka-web-web` (жжёт build-минуты на каждый пуш) и `aistroyka-web`
  (мёртв) — удалить в Dashboard (из CI-среды недоступно: у MCP только read/deploy,
  `api.vercel.com` вне network-allowlist).
- **Performance advisors:** 271 INFO (90 FK без индекса, 181 неиспользуемый индекс) —
  без изменений; уровень INFO, форсить не нужно при текущем объёме данных (3 tenant'а).
- **Cloudflare worker:** 3.92 MiB gzip — в пределах Paid-лимита (10 MiB), запас ~2.5×.

## Рекомендации (приоритизировано)

**P2 (плановый спринт):**
1. До-генерировать Database-типы (`processed_stripe_events`, `contact_leads`) → убрать
   `as any` в billing/auth-вебхуках.
2. Почистить ~40 стейл-веток и 2 Vercel-дубля.
3. Закрыть 2 moderate npm-vuln в плановом обновлении.

**P3 (по случаю):**
4. Пройтись по data-репозиториям на предмет `return []/null` поверх ошибок запроса.
5. Ручной WCAG 2.2 AA + краш-чек мобильных на устройстве.
6. Перф-индексы под RLS-колонки — когда вырастет объём данных.

## 6. Дополнение (2026-06-14): data-masking в error-path + Vercel

**Vercel-гигиена — закрыто пользователем, проверено:** в команде остался ровно один проект
`aistroyka-web-web-v7jq` (рабочий). Оба дубля (`aistroyka-web-web`, `aistroyka-web`) удалены.

**Целевой поиск багов класса `getChangesAfter`** (ошибка БД маскируется под пустое/нулевое
значение в `catch`/`if (error)` и используется как легитимный ответ). Найдено и
**исправлено в этой ревизии — sync-подсистема:**
- `lib/sync/change-log.repository.ts#getMaxCursor` и
  `lib/sync/sync-cursors.repository.ts#getCursor` возвращали `0` при ошибке запроса.
  Последствия: `getMaxCursor`→`0` давал ложный `cursor_ahead` (лишний ре-bootstrap);
  `getCursor`→`0` **молча отключал anti-rollback защиту device-mismatch**. Обе функции
  теперь `throw` на ошибке (а `0` — только при честном отсутствии строк), роут
  `/api/v1/sync/changes` читает оба курсора под единым `try`→503 `sync_changes_unavailable`
  (как уже сделано для `getChangesAfter`). +4 теста.

**Найдено, НЕ исправлялось — требуется решение владельца (компромисс fail-closed vs throw,
затрагивает authz/billing-семантику):**
| Место | Класс | Поведение при ошибке БД | Рекомендация |
|---|---|---|---|
| `lib/authz/authz.repository.ts#getPermissionsForRoleName`, `#getUserScopes` | authz | `[]` → доступ запрещён (fail-closed) | безопасное направление, но маскирует сбой; рассмотреть throw→500 или отдельный лог-алерт |
| `lib/domain/project-members/project-members.repository.ts#getMembership`/`isProjectMember` | authz | `null`/`false` → не участник (fail-closed) | то же; на ошибке владелец проекта временно «теряет» owner-права |
| `lib/domain/org/org.repository.ts#hasOrgAdminRole` | authz | `false` → запрет (fail-closed) | то же |
| `lib/platform/billing/entitlements.service.ts#getEntitlements` | billing | `null` → откат к дефолтным лимитам тарифа | **потенциально опасно**: сбой чтения может СНЯТЬ кастомный лимит; рассмотреть throw |
| `lib/platform/ai-usage/ai-usage.repository.ts` (budget/spent reads) | billing | `0`/синтетика → может обойти бюджет-гейт | **потенциально опасно для спенда**; решить fail-closed (блок AI при сбое чтения биллинга) vs текущее |

LOW-risk (маскировка в презентационных/ops/телеметрия-репозиториях) — приемлемая
деградация, в отчёт занесена, не трогалось.

## Заключение

Критических и высоких рисков на текущем `main` не выявлено. Находки первой ревизии и
sync-подсистемы исправлены и в проде; остаток — управляемая гигиена P2/P3 плюс пять
authz/billing error-path решений, вынесенных на владельца (см. §6).
