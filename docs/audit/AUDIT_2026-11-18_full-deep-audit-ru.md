# AISTROYKA — полный глубокий аудит (2026-11-18)

- **Дата:** 2026-11-18, 19:00–20:00 (Europe/Madrid, UTC+1).
- **База:** `origin/main` = `f6f56b8387bb3704361991cf05ef6fce26f2bba2` (PR #487, 2026-10-30 23:45 +01:00). После этого коммитов в `main` нет.
- **Runtime:** production `aistroyka.ai` и staging `staging.aistroyka.ai` обслуживают `buildStamp.sha7 = f6f56b8` (deploy 2026-10-30, Deploy Cloudflare Staging/Production — `success`).
- **Метод:** локальная валидация шагов `ci-check.yml`, live HTTP-проверки (только чтение, без авторизации), GitHub Actions/PR (только чтение), чтение кода и документации. Живая БД, деплой, миграции и store-загрузки не выполнялись.
- **Заменяет как текущий снимок:** `docs/audit/AUDIT_2026-06-30_full-project-current-state-ru.md` (исторический, отстаёт на 754 коммита).

---

## 1. Итоговый вердикт

**Код в `main` в хорошем состоянии; production сейчас неработоспособен из-за потери базы данных.**

| Контур | Вердикт |
|---|---|
| Сборка / тесты / lint / типы / i18n | **PASS** — все шаги CI Check воспроизведены локально |
| Production runtime | **P0 АВАРИЯ** — Supabase-проект `vthfrxehrursfloevnlp` не резолвится в публичном DNS (NXDOMAIN); БД, Auth и все API с данными недоступны ~10 дней |
| Публичный сайт | Работает (статические/маркетинговые страницы 200), но legal-страницы — черновик, открыта dev-страница `/smoke` |
| Кабинеты (contractor / admin / platform-admin / portal) | Код есть и закрыт гейтами; без БД вход и данные недоступны |
| Безопасность | RLS на всех public-таблицах, гейты owner/platform работают; **Next.js 15.5.12 с известными critical/high advisories**; stakeholder-гейт fail-open |
| AI | Код существенно реализован; live доказан только async image vision (2026-10-12); video/Gemini live — нет |
| Мобильные | iOS Manager/Worker/Customer source-complete; Android — тонкий scaffold; распространение в сторах **NO-GO** |
| План | Phase 13 — CONDITIONAL YES (2026-06-16); очередь 2026-10-23 в основном закрыта кодом; 97 V2-пакетов — все `PROPOSED`/`NOT_RUN`; внешние OWNER_GATE открыты |
| Процесс / документация | Активность остановилась 2026-10-30; 74 открытых PR (59 draft), 457 remote-веток, ~2462 md в `docs/`, указатели частично устарели |

---

## 2. P0 — авария production: база данных недоступна

### Факты

- `GET https://aistroyka.ai/api/v1/health` и staging → HTTP 503:
  `{"ok":false,"db":"error","supabaseReachable":false,"serviceRoleConfigured":true,"buildStamp":{"sha7":"f6f56b8"},"reason":"error code: 1016"}`.
  `1016` — ошибка Cloudflare «Origin DNS error».
- `vthfrxehrursfloevnlp.supabase.co` (значение `NEXT_PUBLIC_SUPABASE_URL` в `apps/web/wrangler.toml`) возвращает **NXDOMAIN** через Google DNS (`dns.google`) и Cloudflare DNS (`cloudflare-dns.com`); другие хосты (`supabase.com`, `api.supabase.com`) резолвятся — это не ограничение сети аудитора.
- Плановые workflow на `main` падают ежедневно:
  - **GDPR Deletion Processor** — последний success 2026-11-08 10:07, первый failure 2026-11-09 10:54 (Madrid). Ответ cron-tick: `503 {"ok":false,"error":"Failed to list tenants","error_code":"cron_tick_error"}`.
  - **AI Phase 5 SLO (staging)** — последний success 2026-11-08 14:10, первый failure 2026-11-09 16:56 (Madrid).
- Значит, авария началась между **2026-11-08 14:10 и 2026-11-09 10:54 (Madrid)** и длится ~10 дней.

### Последствия

- Вход (Supabase Auth), кабинеты, portal, мобильные клиенты, AI-задания, Stripe-webhook ingestion (запись в БД) — не работают.
- **Запросы на удаление данных (GDPR) не обрабатываются** — комплаенс-риск.
- Публичные страницы отдают 200, поэтому внешне сайт «жив», а реальная функциональность нет. Мониторинга/алерта, поднявшего аварию, не обнаружено: падения scheduled workflow никто не обработал.

### Что не установлено

Статус проекта в Supabase (пауза, удаление, перенос, блокировка за оплату) не проверен: доступ к Supabase MCP / Dashboard не предоставлен. По AGENTS.md новый проект создавать нельзя — нужно восстановить именно `AISTROYKA` (`vthfrxehrursfloevnlp`, eu-central-1). Paused `aistroyka-release1` — только холодный бэкап.

### Действия владельца (по порядку)

1. Supabase Dashboard → проект `vthfrxehrursfloevnlp`: определить состояние (paused / deleted / billing). Восстановить/снять с паузы; при удалении — восстановление из бэкапа через поддержку Supabase.
2. После восстановления: `GET /api/v1/health` = 200 на staging и production; вручную запустить **GDPR Deletion Processor** и убедиться в обработке накопленной очереди.
3. Только после этого — свежий `migration_receipts_preflight.py` против истории миграций (до любого apply).
4. Завести алерт на падения scheduled workflow и на `health != 200` (сейчас `smoke-staging.sh` считает 503 допустимым — см. §6).

---

## 3. Свежая валидация (2026-11-18)

Все шаги `.github/workflows/ci-check.yml`, воспроизведённые локально (Bun 1.2.15, Node 22):

| Шаг | Результат |
|---|---|
| Python boundary tests (preflight, migration receipts, published evidence, prod deploy, deployed commit, AI live proof, customer portal payload, stakeholder finance) | 8/8 PASS (`test_workspace_preflight.py`: 2 падения только из-за глобального `url.insteadOf` VM; с `GIT_CONFIG_GLOBAL=/dev/null` — 11/11 PASS) |
| `validate-npm-lock.cjs` | PASS |
| `bun install --frozen-lockfile` | PASS |
| Workerd private original transport | PASS |
| SQL-контракты PGlite (7) | 7/7 PASS |
| Native PostgreSQL race contracts (5) | 5/5 PASS (`engine: native_postgres`, живая БД не затронута) |
| `i18n:check` (1592 ключа) и `I18N_CHECK_ALL=1` (3901 ключ) | PASS, ru/es/it = en |
| `bun run lint` | PASS |
| `tsc --noEmit` | PASS |
| `bun run test` | **509 файлов / 2967 тестов PASS** |
| `release:check` | `PASS_WITH_WARNINGS` (0 fail, 7 warn — нет Stripe/AI/push/E2E/Supabase CLI env) |
| `cf:build` | PASS (с placeholder anon key — проверяет сборку, не подключение) |
| GitHub CI PR #178 (`check`, Workers Builds, Vercel, security review) | PASS |

Live (без авторизации):

| Проверка | Результат |
|---|---|
| `/ru`, `/en`, login, register, pricing, terms, privacy | 200 |
| `/ru/dashboard`, `/ru/portal`, `/ru/owner` (гость) | 307 → login |
| `/api/v1/projects`, `/api/v1/portal/projects`, `/api/v1/users`, `/api/v1/system/metrics` | 401 |
| `/api/v1/owner/users`, `/api/v1/platform/users` | 403 |
| `aistroyka.com`, `www.aistroyka.com` | 301 → `https://aistroyka.ai` с путём и query |
| `security_headers.sh` prod/staging | FAIL только на `api-health` (503); сами заголовки PASS |
| `smoke-prod.sh` | FAIL (health 503) |
| `/ru/smoke`, `/en/smoke` | **200 — dev-страница открыта** (см. §5) |

---

## 4. Масштаб кода на `main`

| Метрика | Значение |
|---|---|
| Страницы `[locale]` | 112 (public 29, dashboard 68, + auth/owner/platform-admin/invite/share/smoke) |
| API-маршруты | 356 (`/api/v1` — 326) |
| Тестовые файлы web | 511 (+9 Playwright e2e specs) |
| Миграции Supabase | 218 |
| Таблицы в миграциях / с RLS | 150 / 149 (оставшаяся — артефакт схемы `app_private`) |
| Swift / Kotlin файлов | 150 / 30 |
| GitHub workflows | 19 |
| `docs/**/*.md` | ~2462 (223 файла прямо в корне `docs/`) |
| Коммитов с 2026-06-30 | 754 |

---

## 5. Публичный сайт

### Хорошо

- V4.1 home + V4.3 inner pages, 27/29 страниц с metadata; sitemap и robots есть.
- Фейковых метрик (`MOCK_METRICS`, `500+`, `12K+`) и `Request demo`/`Book demo` в UI нет.
- Цены только из `apps/web/lib/public/pricing-catalog.ts`: Starter €49, Pro €149; Business/Enterprise — `monthlyAmount: null`, «по запросу».
- `.com` → `.ai` redirect корректен.

### Проблемы

| P | Проблема | Где |
|---|---|---|
| **P1** | **Legal-черновики в production.** `/privacy` и `/terms` показывают «Черновик — требуется утверждение юриста» во всех 4 локалях; страницы в sitemap. Блокирует store-публикацию и коммерческий запуск | `app/[locale]/(public)/privacy|terms/page.tsx`, `messages/*/public.privacy|terms.placeholder*`; owner-gate в `docs/06_PRIVACY_LEGAL_STATUS.md` |
| **P1** | **Dev-страница `/[locale]/smoke` открыта в production**: комментарий «DEV ONLY… Remove or protect before production», показывает сессию и позволяет вызвать произвольный RPC. Привилегий сверх обычного anon/session не даёт (RLS действует), но это открытый отладочный инструмент | `app/[locale]/smoke/page.tsx` (guard только на admin-host в `host-routing.ts`) |
| P2 | Mock `/ai-demo` и `/copilot` в sitemap (помечены как demo) | `lib/seo/public-paths.ts` |
| P2 | `robots.ts` не закрывает locale-варианты `/[locale]/dashboard|admin|login`, `/smoke`, `/portal`, `/platform-admin`, `/share` | `app/robots.ts` |
| P2 | Тонкий контент `/cases/[slug]`, `/docs/[slug]` (вне sitemap) | `(public)/cases`, `(public)/docs` |

---

## 6. Кабинеты и маршрутизация

| Кабинет | Состояние |
|---|---|
| `/dashboard` (contractor ops) | ~52 страницы; тонкие page → клиенты/API; проекты, задачи, отчёты, approvals, AI, uploads, workload, daily reports, contractors, client/*; Manager-панели Stage2a quantities, RULE-015 completeness, RECON-017 findings, preproject extraction |
| `/admin` (tenant admin) | 14 страниц; AI, governance, jobs, operator, system, trust, push |
| `/platform-admin` + `/owner` | 5 + 1 (redirect); `noindex`; owner-gate (host/IP/secret/session/rate-limit/audit) |
| `/portal` (stakeholder) | в `(dashboard)/portal`; API `/api/v1/portal/*` (17 маршрутов, 13 с тестами) |
| invite / share / auth | реальные; share proof pack; auth login/register/forgot/reset/telegram |

Проблемы:

| P | Проблема | Где |
|---|---|---|
| **P1** | **Stakeholder-гейт fail-open** в двух местах: при ошибке определения роли middleware пропускает запрос, layout ставит `portalOnly = false`. AGENTS.md требует fail-closed. Данные остаются под RLS, но stakeholder при сбое получает contractor-навигацию | `middleware.ts` (~184–186, комментарий `fail-open`), `app/[locale]/(dashboard)/layout.tsx` (~110–115) |
| P2 | Почти нет `loading.tsx` (2 из 112 страниц) | `app/[locale]/**` |
| P2 | Hardcoded EN (~86 строк в 14 файлах): platform-admin testing/console, operator workbench, `SupportClient`, `DashboardUploadsClient`, `DemoProjectCard`, store-лейблы invite | `components/**`, `app/[locale]/invite/accept` |
| P2 | `smoke-staging.sh` принимает 503 health как PASS — маскирует аварию БД | `apps/web/scripts/smoke-staging.sh` |

---

## 7. Backend, безопасность, БД

### Хорошо

- RLS включён на всех public-таблицах из миграций. `SECURITY DEFINER` встречается в 40 файлах миграций; гранты private-helper функций проверяются PGlite/native контрактами (`verify_private_helper_grants_postgres.mjs` PASS). Поштучный аудит `search_path` каждой definer-функции в этот проход не выполнялся.
- Stripe webhook проверяет `stripe-signature`; cron (`cron-tick`, `schedule-reconcile`, `jobs/process`) требует `CRON_SECRET`.
- Owner/platform API: `requirePlatformOwnerApi`; live — 403 без авторизации.
- Customer-finance isolation: проверки `test_customer_portal_payload.py`, `test_stakeholder_finance_sanity.py` PASS.
- Migration receipts guard (`docs/ops/VERIFIED_DB_MIGRATION_RECEIPTS.md`, 11 источников / 10 remote IDs) и его тесты PASS.

### Проблемы

| P | Проблема | Где / доказательство |
|---|---|---|
| **P1** | **Next.js `15.5.12` с открытыми advisories** (`npm audit --omit=dev`: 1 critical, 5 high, 1 moderate). Для `next`: critical RCE в Image Optimization (AVIF/SVG), SSRF в rewrites/Server Actions, DoS Server Actions, cache poisoning. `images` в `next.config` не настроен (оптимизатор по умолчанию). Применимость к OpenNext/Workers не подтверждена, но доступен патч той же ветки `15.5.29` | `apps/web/package.json` (`"next": "^15.1.0"`), `bun.lock` |
| P1 | Остальные high: `zod` 3.25.76 (memory exhaustion), `sharp` 0.34.5 (libvips/libheif CVE), `postcss` 8.5.6, `nanoid` 3.3.11, `source-map-js` | `npm audit` |
| P1 | **Account-first billing слой не на `main`**: в миграциях только `accounts` и `account_members`; `account_subscriptions`, `account_entitlements`, `tenant_entitlement_projections`, `entitlement_resolution_drift`, `resolveEffectiveEntitlements`, `ENTITLEMENT_RESOLUTION_SOURCE` в коде отсутствуют (есть только в docs/`commits_not_in_main_2026-06-20.json`). AGENTS.md и `PROJECT_CONTEXT.md` описывают их как существующие — расхождение документации с кодом; 7-day shadow gate фактически не может стартовать | `apps/web/supabase/migrations`, `apps/web/lib/platform/plan-fit/*` |
| P2 | Тестовое покрытие privileged API: `platform/*` 22 маршрута — 0 colocated route-тестов, `owner/*` 10 — 0 (owner-гейт покрыт 11 тестами в `lib/platform-owner`), `admin/*` 38 — 7, `billing/*` 8 — 1, `help/*` 5 — 0. Всего 268 из 326 `/api/v1` маршрутов без colocated-теста | `apps/web/app/api/v1/**` |
| P2 | Заглушки API: SCIM `501`, legacy `/api/projects/[id]/jobs/[jobId]/trigger` `501`, `/api/v1/users` — всегда пустой список («scaffold») | соответствующие `route.ts` |

---

## 8. AI

| Компонент | Код | Тесты | UI | Live |
|---|---|---|---|---|
| Провайдеры OpenAI → Anthropic → Gemini, circuit breaker | да | да | косвенно | image OpenAI — 2026-10-12 |
| Fallback + `X-AI-Fallback-Reason`, отказ от degraded в `runOneJob` | да | да | copilot/admin | `fallback_count=0` (2026-10-12) |
| Copilot (stream, threads) | да | да | web + iOS | не доказан `--require-live` |
| Async vision (`request_key`, `ai_analysis`, human review) | да | да | **нет web-панели review** | image job — да; human review live — нет |
| Video (Gemini) | да (`VIDEO_NOT_IMPLEMENTED` удалён) | да | нет | **нет** (OWNER_GATE) |
| Construction Graph lineage | да | да | нет панели | нет; **invalidate-on-revoke отсутствует** |
| Stage2a quantity/commercial A01–A05 | да | да | `ProjectQuantitiesPanel` | Worker fixture — OWNER_GATE |
| RULE-015 / RECON-017 / CLIENT-005A | да | да | панели в project detail | DDL applied; product live не доказан |
| STREAM-010 / MEM-016 lexical | да | да | API only | нет |

Запрет из AGENTS.md сохраняется: без `bash scripts/smoke/ai_live_provider.sh --require-live` exit 0 нельзя заявлять AI LIVE / LEVEL 4. Сейчас live-проверка невозможна в принципе — БД недоступна.

---

## 9. Мобильные приложения

| Приложение | Состояние |
|---|---|
| iOS Manager (41 swift + UITests) | login, dashboard, projects/analytics, tasks, reports review, team, AI/copilot, documents, notifications; en/ru/es/it — 486 ключей |
| iOS Worker (47 + UITests) | login/QR, today, tasks, camera evidence, daily report, resubmit, issues, messages, documents, offline/sync/push; 349 ключей |
| iOS Customer (10 + UITest) | login, home, project detail (progress, requests, estimates, handover, docs, published photos), intake CRUD; 104 ключа |
| Android Manager / Worker | тонкие scaffold (3–4 экрана), FCM в Worker; **Android Customer нет** (по решению — deferred) |

Проблемы:

| P | Проблема |
|---|---|
| **P1** | Store distribution **NO-GO**: TestFlight и Google Play — `OWNER_ACTION_REQUIRED` (сертификат/ASC API/Play service account/`APPROVE_*_UPLOAD`); плюс legal-черновики блокируют публикацию |
| P1 | Physical device smoke не закрыт (Customer gallery 2026-10-12: 0 tests, UI Automation readiness) |
| P2 | `ManagerV43Preview.isEnabled` (только env/arg) обходит мутации create project / invite с ложным успехом — риск, если флаг попадёт в не-UITest сборку (`ProjectsListView.swift`, `TeamOverviewView.swift`) |
| P2 | Мёртвые `*PlaceholderView.swift` в Manager; неиспользуемый `https://api.aistroyka.ai` в `android/shared/.../Config.kt`; iOS fallback `http://localhost:3000` без xcconfig |
| Инфо | Часть readiness-доков устарела: `ios/ExportOptions-AppStore.plist` уже есть, Android `targetSdk/compileSdk` уже 35 |

---

## 10. Roadmap и план

| Phase / AIS | Статус |
|---|---|
| Phase 0–12 | PARTIAL по полному acceptance (код по большинству есть; Phase 11 Contractor Directory — не начат) |
| Phase 13 | DONE — CONDITIONAL YES для пилотных критериев (2026-06-16) |
| AIS-CORRECTION-009, RULE-015, RECON-017, STREAM-010, MATERIAL-008 draft | DONE (первые срезы) |
| AIS-EVID-002 / VISION-003, GRAPH-004, CLIENT-005A, MEM-016 | PARTIAL (код да; live/Graph promotion/invalidate-on-revoke/hybrid — нет) |
| AIS-CLIENT-005B, SPATIAL-011/012, OWNER-3D-013, MATCH-006, MATERIAL-008 purchasing | NOT STARTED (PLANNED) |
| V2 (97 пакетов, 406 AC) | 97 × `PROPOSED` / `NOT_RUN`; 13 Android — DEFERRED_BY_DECISION |

Следующее по плану (локально): Graph invalidate-on-revoke, web-панель vision human review, CLIENT-005A Graph promotion, первый V2 bug slice (V2-WEB-01), SHA-пины оставшихся GitHub Actions.

### Внешние / OWNER_GATE блокеры

1. **Восстановление Supabase-проекта** (новый, P0, блокирует всё ниже).
2. Legal: Privacy/ToS/Cookie утверждены юристом.
3. iOS TestFlight/App Store и Google Play upload-гейты.
4. Billing: account-first слой ещё не в `main` → 7-day shadow zero-drift не начат.
5. Live Gemini video + Worker upload→job→review fixture.
6. Physical device smoke / UI Automation.
7. Назначенные owners/reviewers и consented gold corpus; доступ к данным поставщиков (MATERIAL).

---

## 11. Процесс и документация

| P | Проблема |
|---|---|
| P1 | **Разработка остановилась 2026-10-30** (19 дней без коммитов), авария БД не замечена ~10 дней — нет операционного дежурства/алертов |
| P2 | 74 открытых PR (59 draft; по месяцам: июнь 5, июль 14, август 26, сентябрь 28, ноябрь 1); реестр: 60 `RECONCILE_BACKLOG`, 14 `VALIDATION_EVIDENCE` |
| P2 | 457 remote-веток |
| P2 | Устаревшие указатели: `PROJECT_CONTEXT.md` (2026-10-03), `PROJECT_DASHBOARD.md` (2026-10-11), `STATUS.md` (2026-10-30 tip `ff7d0894`, «следующее: Manager UI completeness/recon» уже сделано в #485/#486), очередь 2026-10-23 в mega roadmap описывает #446–#449/#453 как PR_ONLY |
| P2 | ~2462 md в `docs/`, 223 в корне — разовые CICD/CF/DEPLOY-отчёты рядом с каноническими документами |
| P2 | AGENTS.md / PROJECT_CONTEXT описывают account billing слой, которого нет в коде (§7) |

---

## 12. Приоритетный план действий

| # | Действие | Кто | Приоритет |
|---|---|---|---|
| 1 | Восстановить Supabase `vthfrxehrursfloevnlp`; подтвердить health 200; прогнать GDPR processor | владелец | **P0, немедленно** |
| 2 | Алерты: падение scheduled workflow, health ≠ 200; `smoke-staging.sh` — 503 = FAIL | агент + владелец | P1 |
| 3 | Обновить `next` до `15.5.29` (и `zod`, `sharp`, `postcss`, `nanoid`); полный CI + `cf:build` + staging smoke | агент | P1 |
| 4 | Закрыть `/[locale]/smoke` в production (404 вне dev или owner-only) | агент | P1 |
| 5 | Stakeholder-гейт fail-closed в middleware и dashboard layout + тесты | агент | P1 |
| 6 | Юридические тексты Privacy/Terms | владелец/юрист | P1 |
| 7 | Сверить AGENTS.md/PROJECT_CONTEXT с фактом account billing (или вернуть слой отдельным PR по плану) | агент + владелец | P1 |
| 8 | Обновить STATUS / PROJECT_DASHBOARD / Truth Index после восстановления БД | агент | P2 |
| 9 | Route-тесты для `platform/*`, `owner/*`, `admin/*`, `billing/*` | агент | P2 |
| 10 | Semantic review 74 PR и gated-архивация веток (dry-run → approval) | агент + владелец | P2 |
| 11 | Web-панель vision human review, Graph invalidate-on-revoke (по очереди плана) | агент | P2 |
| 12 | Store-гейты, device smoke, live AI fixtures | владелец | после P0 |

---

## 13. Ограничения аудита

- Supabase Dashboard/MCP недоступен (доступ отклонён) — причина NXDOMAIN не установлена.
- Авторизованные live-сценарии (вход, кабинеты с данными, AI live gate) невозможны: БД недоступна, учётных данных нет.
- `cf:build` и `release:check` выполнены с placeholder anon key.
- iOS/Android сборки не запускались (нет Xcode/Android SDK в VM); мобильный аудит — по исходникам и документам.
- Применимость Next.js advisories к OpenNext/Cloudflare Workers не проверялась эксплуатационно.
