# AISTROYKA — полный аудит текущего состояния проекта

**Дата:** 2026-06-30  
**Язык отчёта:** русский  
**Текущий repo HEAD на момент аудита:** `2b4c4e537dee181f7db25ebddb34f4b1e2951afe`  
**Последний `CURRENT_PROJECT_TRUTH_INDEX.md`:** 2026-06-26, SHA `2fe776f298d4a94eccfa8bc5745968692b77fb0f`

---

## 1. Цель аудита

Этот отчёт фиксирует текущее состояние проекта AISTROYKA по трём осям:

1. что уже реально сделано в коде и документации;
2. что ещё остаётся незавершённым или частично реализованным;
3. какие есть текущие риски, блокеры и расхождения между документацией и текущим состоянием репозитория.

Отчёт опирается на:

- актуальную roadmap;
- `docs/CURRENT_PROJECT_TRUTH_INDEX.md`;
- phase closure / reconciliation docs;
- текущее состояние кода в `apps/web`, `ios`, `android`;
- свежую локальную валидацию на текущем HEAD.

---

## 2. Executive verdict

### Итог

**AISTROYKA — это уже большой реальный продукт, а не лендинг или набор набросков.**

На текущем HEAD в репозитории присутствуют:

- 26 public pages;
- 68 dashboard/cabinet pages;
- 259 маршрутов `app/api/v1/**/route.ts`;
- 300 web test-файлов;
- 81 Swift-файл iOS;
- 30 Kotlin-файлов Android.

Это подтверждает, что проект уже содержит:

- полноценный public website;
- развитые внутренние кабинеты/офисы ролей;
- большой backend/API слой;
- живой AI runtime;
- серьёзный iOS-контур;
- Android-контур в более ранней зрелости;
- реальный deploy/CI/ops pipeline.

### Общий статус

Самая честная формулировка текущего состояния:

> **Сильный pilot/public candidate с большим объёмом реально завершённой работы, но ещё не безусловный full production/GA across all surfaces.**

Это совпадает с последним формальным product verdict:

- **Phase 13 = CONDITIONAL YES**, а не broad enterprise GA.

---

## 3. Что зафиксировано в последней roadmap

Последняя актуальная roadmap (`docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md`) описывает AISTROYKA как:

> AI-powered construction trust and control platform.

Ключевой продуктовый фокус:

- evidence;
- schedule;
- documents;
- approvals;
- customer decisions;
- estimates / change approvals;
- AI daily control.

### Главный инвариант всей системы

Через всю roadmap проходит обязательное правило:

## **Customer Finance Isolation**

Заказчик / owner / stakeholder **не должен** видеть:

- internal costs;
- margin;
- profitability;
- budget pressure;
- contractor/subcontractor prices;
- internal overruns;
- internal finance AI signals.

Допустимы только customer-facing commercial artifacts:

- estimate;
- additional estimate;
- change order;
- approved amount;
- decision request;
- payment schedule;
- shared commercial document.

Это — главный security/product invariant проекта.

---

## 4. Website / public surface

## Что уже сделано

Public website реален и достаточно широк:

- homepage;
- platform/features/pricing/contact;
- публичные продуктовые и маркетинговые страницы;
- мультиязычная public surface;
- pilot-first CTA copy;
- qualitative capability messaging вместо фейковых масштабных метрик.

Homepage уже приведён к более честной коммуникации:

- убраны synthetic `500+`, `12K+`, `8K+`, `45K+`;
- сохранён pilot-first positioning;
- AI и product story встроены в public shell.

## Что ещё не доведено

Несмотря на сильный public shell, есть заметные пробелы:

1. **Legal pages ещё placeholder-level**
   - `terms` и `privacy` не являются полноценным production-grade legal content.

2. **Public API page пока демонстрационная**
   - содержит mock-oriented examples, а не полноценную developer-ready public API presentation.

3. **Public AI surfaces mostly mock/demo**
   - публичный AI demo — это simulator;
   - публичная copilot surface — mock UI.

### Вывод по website

Public website уже можно считать **реальной продуктовой внешней оболочкой**, но ещё не полностью “закрытым” внешним production layer из-за legal/compliance и mock-heavy AI marketing surfaces.

---

## 5. Кабинеты / офисы / role-based workspaces

Под “офисами” в контексте проекта фактически существуют следующие рабочие контуры:

- contractor / manager office (`/dashboard`);
- stakeholder / customer portal (`/portal`);
- platform owner office (`/owner`);
- operator / admin office (`/admin`).

## 5.1 Contractor / Manager office

Это самая сильная и зрелая часть web-продукта.

Внутри dashboard уже присутствуют:

- onboarding;
- ops overview;
- manager actions;
- AI operating center;
- recent projects;
- intelligence section;
- project/worker/report/approval/upload/device/AI/support/help surfaces.

Это не “несколько экранов”, а большой внутренний operational cockpit.

## 5.2 Stakeholder / Customer office

Portal действительно существует как отдельная customer/stakeholder surface:

- корневой `/portal` редиректит на список проектов;
- список проектов грузится через реальный `/api/v1/portal/projects`;
- есть project/progress/proof/documents/estimates/decisions/change-orders API surface.

Portal выглядит уже как рабочий customer-facing contour, а не как декларация в docs.

## 5.3 Owner office

Owner office тоже реален, и самое важное — он жёстко защищён:

- host allowlist;
- IP allowlist;
- optional secret-header gate;
- session freshness;
- rate limits;
- DB audit trail;
- grant-based authorization;
- denial/security alert logging.

Это показывает, что owner surface строился как high-risk privileged contour, а не как обычная страница.

## 5.4 Operator / Admin office

Внутри admin есть реальный **Operator Workbench**:

- diagnostics;
- leads;
- anomalies;
- jobs;
- flags;
- smoke checks;
- runtime health operations.

Это полноценный operator back-office, а не stub.

### Вывод по кабинетам/офисам

Кабинеты и role-based workspaces — одна из самых сильных сторон текущего состояния AISTROYKA.

---

## 6. Security и customer-finance isolation

Это одна из самых зрелых зон проекта.

По текущей документации и тестовой матрице уже подтверждены гарантии:

- owner не может ходить в manager cost routes;
- owner не видит internal cost overrun / budget summary;
- owner не получает internal finance AI signals;
- proof/share surface не раскрывает internal finance;
- owner digest отделён от manager-internal finance content;
- stakeholder live sanity уже закрывался как PASS.

### Вывод

Главный product/security invariant roadmap — **customer finance isolation** — проведён в проекте системно и является сильной стороной текущего состояния.

---

## 7. Backend / API / platform

## Что уже сделано

Backend/API контур у проекта большой и реальный:

- канонический API живёт под `/api/v1/*`;
- health endpoint контрактно валидируется через shared contracts;
- в проекте присутствует большое количество доменов: projects, portal, owner, admin, worker, sync, billing, AI, reports, tasks, help, integrations.

### Что ещё незавершено

Есть несколько явно незакрытых или staged участков:

1. **SCIM**
   - endpoint присутствует, но фактически возвращает `501`.

2. **Billing checkout readiness**
   - readiness layer есть, но route semantics сами признают, что это readiness/placeholder path, а не fully live provider flow.

3. **System metrics**
   - при ошибках может возвращаться placeholder payload.

### Вывод

API/platform слой уже явно production-shaped, но всё ещё содержит несколько честно обозначенных stub/placeholder контуров.

---

## 8. Billing / Accounts / RBAC

## Что уже сделано

В проекте проведена существенная архитектурная работа:

- additive accounts layer над tenants;
- `accounts`, `account_members`, `tenants.account_id`;
- RLS и additive account foundation;
- pilot billing readiness architecture;
- sandbox/provider adapter abstractions;
- staged billing rollout approach;
- сильный RBAC route topology.

## Что ещё не закрыто

Billing/accounts migration пока выглядит как **staged transition**, а не финальный state:

- live billing не globally enabled;
- dashboard access logic всё ещё anchored в tenant-scoped billing state;
- account-first entitlement resolution ещё gated;
- часть account-billing future описана в docs, но не является финальным runtime truth текущего web app.

### Вывод

Billing/accounts/RBAC — продуманный и уже серьёзно проработанный контур, но именно billing/account cutover пока нельзя считать завершённым.

---

## 9. AI runtime

## Что уже сделано

AI runtime у проекта реальный и живёт в `apps/web`, а не в отдельном python backend:

- canonical AI routes в web app;
- copilot routes;
- AI services;
- observability and smoke scripts;
- health-level AI configuration signals;
- live-provider gate documented как canonical validation path.

## Что ещё не закрыто

1. Public AI presentation ещё partly mock/demo.
2. Video-analysis path в async AI engine всё ещё не завершён.
3. Live-AI claims по проектным правилам нельзя делать по route presence alone — только по canonical live gate evidence.

### Вывод

AI в проекте реален и не декоративен, но не every AI path fully complete.

---

## 10. Mobile

## 10.1 iOS

iOS — главный mobile contour проекта.

Сильные признаки зрелости:

- отдельные Manager и Worker apps;
- shared Swift package;
- real tab shell у Manager;
- AI/project views у Manager;
- offline queue / upload / background flows у Worker;
- UITest / smoke infrastructure;
- documented E2E paths.

### Вердикт по iOS

Source-level зрелость высокая.

## 10.2 Android

Android контур существует реально:

- Manager app;
- Worker app;
- shared layer;
- Compose UI;
- push support на Worker;
- instrumented smoke path.

Но Android явно тоньше и менее зрелый, чем iOS.

### Вердикт по Android

Android не отсутствует, но всё ещё находится в более ранней продуктовой зрелости относительно iOS.

## 10.3 Distribution / stores

Самый важный mobile verdict сейчас:

## **Mobile pilot distribution = NO-GO**

Основные блокеры:

- iOS owner-action requirements;
- App Store / TestFlight prerequisites;
- Android / Google Play prerequisites;
- pilot accounts / legal / metadata readiness;
- отсутствие полного signed upload evidence на обеих платформах.

### Вывод по mobile

Mobile codebase уже реальный, особенно на iOS, но distribution/store readiness пока не закрыта.

---

## 11. Deploy / CI / Ops

## Что уже сделано

У проекта реальный release pipeline:

- PR CI with install / lint / typecheck / test / release checks / `cf:build`;
- Cloudflare Workers staging/prod deploy chain;
- pilot smoke;
- stakeholder finance sanity;
- production security-headers smoke;
- documented runtime topology.

## Что остаётся риском

1. Documentation truth drift relative to latest HEAD.
2. Supabase migrations and repo↔remote alignment остаются чувствительным operational point.
3. AI live-provider validation в deploy chain всё ещё не самый жёсткий possible gate.
4. Часть post-deploy confidence still depends on secrets/ops hygiene.

### Вывод

Ops/CI/deploy discipline у проекта сильная и уже выглядит production-minded, но не полностью “безопасна по умолчанию” во всех углах.

---

## 12. Свежая локальная валидация на текущем HEAD

Во время этого аудита были выполнены свежие проверки на текущем репозитории.

### Успешно

- scoped i18n check;
- web lint;
- contracts build.

### Не полностью успешно

1. **Release readiness check**
   - локально не проходит полностью без нужных env/secrets;
   - это прежде всего ops/config limitation, но она реальна.

2. **Web test suite**
   - после сборки contracts пакет тестов почти зелёный;
   - остаётся 1 failing suite (`AISignalLine.test.ts`) из-за parser/transform failure around JSX;
   - это не похоже на широкий продуктовый regression, но это всё ещё незелёный текущий state.

---

## 13. Главные текущие проблемы

Ниже — наиболее важные проблемы по текущему состоянию проекта.

### P0/P1-like

1. **Truth/docs drift**
   - последний `CURRENT_PROJECT_TRUTH_INDEX.md` уже не соответствует текущему HEAD.

2. **Mobile distribution remains NO-GO**
   - код есть, store/distribution readiness нет.

3. **Current web suite not 100% green**
   - остаётся один test-suite/parser failure.

### Product/completeness

4. **Legal pages placeholder-level**
5. **Public AI surfaces mostly mock/demo**
6. **Dev-only smoke page остаётся в app tree**
7. **Billing/account cutover ещё не завершён**
8. **Owner API verification thinner than portal API verification**

---

## 14. Финальный verdict

## Строгий итог

### Что можно утверждать честно

- AISTROYKA — уже большой реальный продукт;
- web platform и role-based offices/cabinets сильно продвинулись;
- customer finance isolation — одна из лучших и самых зрелых частей проекта;
- iOS source-level contour серьёзный;
- deploy/CI/ops discipline реальна и не декоративна.

### Что нельзя утверждать без оговорок

- что весь проект полностью закрыт;
- что public/legal/compliance layer finished;
- что billing/account migration полностью завершена;
- что mobile distribution/store readiness готова;
- что текущий HEAD полностью “green everywhere” без замечаний;
- что historical docs автоматически равны current truth без revalidation.

## Финальная формулировка

> **Проект находится в сильном состоянии для pilot/public candidate и содержит очень большой объём уже реально сделанной работы, но по состоянию на 2026-06-30 ещё имеет ряд незакрытых product, ops и release gaps, из-за которых его нельзя безоговорочно называть полностью завершённым full-production state across all surfaces.**

---

## 15. Следующий логичный шаг

Если нужен следующий шаг после этого отчёта, рационально делать одно из трёх:

1. **P0/P1 remediation plan**
   - что чинить в первую очередь.

2. **Web production-hardening checklist**
   - что закрыть, чтобы честно поднять уверенность по web contour.

3. **Mobile pilot readiness closure plan**
   - что именно нужно закрыть по iOS/Android/store/distribution.
