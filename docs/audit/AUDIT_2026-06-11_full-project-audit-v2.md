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

## Заключение

Критических и высоких рисков на текущем `main` не выявлено. Все находки первой ревизии
исправлены и в проде; остаток — управляемая гигиена уровня P2/P3.
