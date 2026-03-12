# Отчёт: Platform Expansion — Enterprise-ready AI construction platform

**Дата:** 2026-03-11  
**Цель:** Перевести продукт из состояния «хороший SaaS-сайт + кабинет» в foundation для enterprise-ready AI construction platform: AI Copilot layer, Integrations/API readiness, Enterprise trust, Workflow automation positioning, Platform monetization readiness.

---

## 1. Результаты аудита платформенной готовности

### Текущая архитектура web app
- **Next.js 15** App Router, `[locale]` с группами `(public)`, `(dashboard)`, `(auth)`. Публичные страницы изолированы в `(public)` с общим layout (header + footer). Dashboard и auth не затрагивались.
- **API:** Существующие маршруты под dashboard (projects, tasks, reports, worker, billing, admin, health). Отдельный `POST /api/contact` для лид-формы. Публичного developer API нет — позиционирование «planned / enterprise access» на странице /api честно это отражает.

### Публичные страницы (до расширения)
- Корень, features, solutions, ai-construction-control, ai-demo, mobile, pricing, about, contact, faq, privacy, terms, cases, cases/[slug], docs, docs/[slug], projects-showcase, platform, security.

### Dashboard information architecture
- Без изменений: dashboard (overview), projects, tasks, workers, reports, uploads, devices, ai; admin-разделы; billing, team, portfolio. Tenant logic и Supabase не менялись.

### API routes
- Не менялись. Готовность к integrations/API: в продукте есть внутренние API (v1); для внешних партнёров страницы /api и /integrations задают направление (API-first, tenant-safe, event-driven) и статусы (planned / in progress / available).

### Supabase data model
- Не менялся. Все новые страницы — статический контент и i18n; лид-захват ведёт на существующую форму /contact.

### Блоки для AI positioning
- Уже были: ai-demo (mock симулятор), ai-construction-control, разделы про human-in-the-loop. Добавлена страница **Copilot** с capabilities, interaction patterns, mock assistant UI и секцией human-in-the-loop.

### Готовность к API, docs portal, partner page, automation layer, admin enterprise
- **API:** Страница /api описывает направление и честно указывает «enterprise and early-access»; код-примеры — mock.
- **Docs portal:** /docs и /docs/[slug] уже есть; контент статический.
- **Partner/integration:** Добавлены /integrations и /partners с категориями и CTA.
- **Automation/workflow:** Добавлена /workflows с примерами сценариев и benefits.
- **Admin enterprise:** Существующие admin-страницы не менялись; enterprise-позиционирование вынесено на публичную /enterprise.

### Внутренний план перед изменениями
1. Добавить i18n-ключи для всех новых страниц (en, ru, es, it).
2. Создать страницы: /copilot, /integrations, /api, /workflows, /enterprise, /implementation, /partners в `(public)`.
3. Перестроить навигацию: primary nav — Platform, Solutions, Features, Pricing, Enterprise; остальное — в footer и в мобильном меню (блок «More»).
4. Обновить sitemap, оставить единые паттерны карточек и CTA.
5. Все CTA вести на /contact (единая точка лид-захвата).
6. Не вводить новые API и не менять middleware/auth/dashboard.

---

## 2. Новые страницы

| Путь | Назначение |
|------|------------|
| `/copilot` | AI Copilot: hero, capabilities (7), interaction patterns (5), mock assistant UI (chat + project summary + risk highlights + action items), human-in-the-loop секция. CTA: Request demo, Explore platform. |
| `/integrations` | Hero «Connect Aistroyka with your construction stack». Категории: ERP, BIM, docs, storage, email, analytics, mobile, API — с статусами planned / in progress / available. Секция Architecture (API-first, tenant-safe, event-driven). CTA: Discuss enterprise integration, Request custom workflow. |
| `/api` | Hero «Build on top of Aistroyka». Блок позиционирования (API для enterprise / early-access; публичная программа планируется). Доступ через API: projects, tasks, reports, users/roles, AI insights, attachments, workflow triggers. Developer experience: auth, REST/webhooks, versioning, sandbox. Mock code examples. CTA: Request API access, Talk to enterprise team. |
| `/workflows` | Hero «Automate construction workflows». Примеры: issue→notify, task overdue→escalate, missing evidence→request, report→AI summary, risk threshold→alert. Benefits: faster reactions, less manual follow-up, accountability, predictable control. CTA: Request demo. |
| `/enterprise` | Hero «Enterprise construction operations platform». Секции: multi-project governance, multi-role access, auditability, security, AI oversight, tenant isolation, integrations, implementation support. Enterprise readiness: role-based access, scalable architecture, reporting consistency, operational transparency. CTA: Contact sales, Enterprise demo. |
| `/implementation` | Hero «How Aistroyka is implemented». Фазы: Discovery, Setup, Data structure, Team onboarding, Pilot launch, Scale rollout. Пояснение сроков и потребностей клиента. CTA: Plan implementation, Request onboarding consultation. |
| `/partners` | Hero «Partner with Aistroyka». Типы: Implementation, Technology, Consulting, Industry. Benefits: joint projects, integration services, enterprise delivery, ecosystem growth. CTA: Become a partner. |

Все страницы реализованы в `app/[locale]/(public)/...`, с `generateMetadata` и `generateStaticParams` по локалям (ru, en, es, it).

---

## 3. Архитектура навигации

### Primary navigation (header, desktop)
- **5 пунктов:** Platform → /platform, Solutions → /solutions, Features → /features, Pricing → /pricing, Enterprise → /enterprise.
- Справа: кнопка «Request Demo» → /contact, кнопка «Log in» → /login.

### Mobile menu
- Те же 5 пунктов primary.
- Блок **«More»:** Copilot, Integrations, API, Workflows, AI Demo, AI Control, Mobile, Security, Docs, Cases, About, Contact, FAQ.
- Ниже: Request Demo, Log in.

### Footer
- **Product:** Platform, Solutions, Features, Pricing, Enterprise.
- **Resources:** Copilot, Integrations, API, Workflows, AI Demo, Docs, Cases, Security, Showcase.
- **Company:** About, Contact, Implementation, Partners, FAQ.
- **Legal:** Privacy, Terms.

Навигация не перегружена в хедере; полный набор разделов доступен в футере и в мобильном меню.

---

## 4. Reusable components

- **Новые:** только `CopilotMockUI` (клиентский компонент на странице /copilot) — mock chat + summary cards + risk highlights + action items.
- Остальные страницы используют существующие паттерны: карточки с `rounded-[var(--aistroyka-radius-card)]`, `border`, `bg-[var(--aistroyka-surface)]`, кнопки `btn-primary` / `btn-secondary`, ссылки `Link` из `@/i18n/navigation`. Отдельные marketing section components не вводились; консистентность обеспечена за счёт общих токенов и классов.

---

## 5. Product positioning

- На новых страницах используется B2B/enterprise язык: construction operations visibility, field reporting discipline, AI-assisted control, execution transparency, risk detection, accountability, portfolio-level governance.
- **Copilot:** «AI assists, humans decide»; все рекомендации reviewable и auditable.
- **API:** честное позиционирование — доступ для enterprise и early-access; публичная программа планируется.
- **Integrations:** статусы planned / in progress / available без фальсификации готовности.
- **Workflows:** акцент на быстрой реакции, меньшем ручном контроле, ответственности и предсказуемом контроле.
- **Enterprise / Implementation / Partners:** упор на governance, audit, security, phased implementation, партнёрские типы и выгоды.

Слайды «магического AI» нет; AI представлен как управленческий инструмент с человеческим контуром.

---

## 6. Lead capture

- **Единая точка входа:** /contact (существующая форма: имя, email, компания, сообщение; `POST /api/contact`).
- На каждой новой странице добавлены CTA:
  - **Copilot:** Request demo, Explore platform.
  - **Integrations:** Discuss enterprise integration, Request custom workflow.
  - **API:** Request API access, Talk to enterprise team.
  - **Workflows:** Request demo.
  - **Enterprise:** Contact sales, Enterprise demo.
  - **Implementation:** Plan implementation, Request onboarding consultation.
  - **Partners:** Become a partner.
- Все CTA ведут на /contact; отдельные лид-формы и source/page tracking в этом этапе не добавлялись. При появлении таблицы leads или аналитики можно расширить форму (например, скрытое поле `source` или query-параметр `?source=enterprise`).

---

## 7. Риски и TODO

### Риски
- **API page:** Тексты описывают «planned / enterprise access». При открытии публичного API нужно обновить копирайт и убрать или смягчить формулировки про «planned».
- **Integrations:** Статусы категорий (planned / in progress / available) зашиты в коде; при изменении дорожной карты нужно обновлять конфиг или вынести в CMS/конфиг.

### TODO
- При появлении бэкенда Copilot — заменить mock UI на реальный чат/виджет.
- Добавить опциональный query-параметр `source` на /contact для аналитики (enterprise, api, integrations, implementation, partners, copilot, workflows).
- При необходимости — mega menu в десктоп-хедере для блока «More» вместо только футера и мобильного меню.
- Вынести статусы интеграций и фазы implementation в данные (JSON/конфиг), чтобы править без правок разметки.

---

## 8. Изменённые и добавленные файлы

### Изменённые
- `apps/web/messages/en.json` — в `public` добавлены nav (copilot, integrations, api, workflows, enterprise, implementation, partners) и полные секции copilot, integrations, api, workflows, enterprise, implementation, partners.
- `apps/web/messages/ru.json` — то же для русской локали.
- `apps/web/messages/es.json` — добавлены компактные ключи для новых страниц (избежание MISSING_MESSAGE).
- `apps/web/messages/it.json` — то же для итальянской локали.
- `apps/web/components/public/PublicHeader.tsx` — PRIMARY_NAV (5 пунктов), SECONDARY_NAV (13 пунктов); в десктопе отображаются только primary; в мобильном меню — primary + блок «More» (secondary).
- `apps/web/components/public/PublicFooter.tsx` — PRODUCT_LINKS (platform, solutions, features, pricing, enterprise); RESOURCE_LINKS расширены (copilot, integrations, api, workflows, ai-demo, docs, cases, security, projects-showcase); COMPANY_LINKS дополнены (implementation, partners).
- `apps/web/app/sitemap.ts` — в PUBLIC_PATHS добавлены /copilot, /integrations, /api, /workflows, /enterprise, /implementation, /partners.

### Новые
- `apps/web/app/[locale]/(public)/copilot/page.tsx`
- `apps/web/app/[locale]/(public)/copilot/CopilotMockUI.tsx`
- `apps/web/app/[locale]/(public)/integrations/page.tsx`
- `apps/web/app/[locale]/(public)/api/page.tsx`
- `apps/web/app/[locale]/(public)/workflows/page.tsx`
- `apps/web/app/[locale]/(public)/enterprise/page.tsx`
- `apps/web/app/[locale]/(public)/implementation/page.tsx`
- `apps/web/app/[locale]/(public)/partners/page.tsx`

### Не изменялись
- Middleware, auth flow, dashboard layout и страницы, API routes, Supabase, tenant logic.

---

## 9. Результаты build / typecheck / lint

- **Build:** `npm run build` — успешен. 266 static pages (включая все новые по 4 локалям).
- **Typecheck:** выполняется в рамках `next build` — ошибок нет.
- **Lint:** `npm run lint` — без предупреждений и ошибок.

Проверено: маршруты /copilot, /integrations, /api, /workflows, /enterprise, /implementation, /partners доступны по `/{locale}/...`; dashboard, login, register, защищённые пути работают без регрессий.

---

## 10. Рекомендации на следующий этап

1. **Lid capture:** добавить на /contact поддержку `?source=...` (enterprise, api, integrations, implementation, partners, copilot, workflows) и при наличии — сохранение source в БД или передачу в CRM/analytics.
2. **API:** при открытии доступа к API обновить страницу /api (документация, примеры, статус доступа).
3. **Integrations:** при появлении конкретных интеграций подставлять реальные статусы и при необходимости — логотипы и ссылки.
4. **Copilot:** при готовности backend заменить CopilotMockUI на реальный виджет/чат.
5. **Design system:** при росте числа маркетинговых страниц вынести общие блоки (SectionHero, SectionCards, SectionCta) в переиспользуемые компоненты.
6. **Trust:** усилить перекрёстные ссылки между /security, /enterprise, /implementation и /docs; при наличии — добавить статус-страницу и краткий changelog/release notes.
7. **Partners:** при запуске партнёрской программы добавить форму «Become a partner» или отдельную лид-страницу с полями (тип партнёра, компания, контакт).

---

Итог: платформенное расширение выполнено изолированно от dashboard и auth; добавлены 7 новых страниц, обновлена навигация и sitemap; позиционирование и лид-точки приведены к enterprise-ready AI platform; сборка и линт проходят. Отчёт зафиксирован в `docs/REPORT-PLATFORM-EXPANSION.md`.
