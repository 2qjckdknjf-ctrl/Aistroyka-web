# Vercel build fix: Module not found '@aistroyka/contracts'

**Дата:** 2026-03-12  
**Проблема:** На Vercel сборка падала с ошибкой `Module not found: Can't resolve '@aistroyka/contracts'` в `app/api/v1/health/route.ts`.

---

## 1. Root cause

- **Монорепо:** приложение в `apps/web` зависит от пакета `@aistroyka/contracts` (`packages/contracts`) через workspace-зависимость `file:../../packages/contracts`.
- **Пакет contracts** отдаёт код через **`dist/`** (`main`/`types`/`exports` указывают на `./dist/index.js` и `./dist/index.d.ts`). Папка `dist/` в git не попадает (есть в `.gitignore`).
- **На Vercel** после клона репозитория `packages/contracts/dist` нет, поэтому при резолве `@aistroyka/contracts` Next.js не находит собранный модуль.
- **Локально** сборка проходила, потому что либо уже был собранный `dist/`, либо всегда запускался полный `npm run build` из корня (сначала `build:contracts`, потом `build:web`).
- **На Vercel** при Root Directory = `apps/web` и переопределённой в Dashboard команде сборки (например, только `next build`) шаг сборки `packages/contracts` не выполнялся, из-за чего и возникала ошибка.

Итог: причина — отсутствие шага сборки пакета `contracts` до запуска `next build` в окружении Vercel (и при любом сценарии, когда из `apps/web` вызывают только `next build`).

---

## 2. Какие файлы изменены

| Файл | Изменение |
|------|-----------|
| **packages/contracts/package.json** | `"build": "bun x tsc -p tsconfig.json"` заменён на `"build": "tsc -p tsconfig.json"`, чтобы сборка работала и через `npm run build` (Vercel по умолчанию использует npm). |
| **package.json** (корень) | Добавлены скрипты: `build:contracts:npm` (clean + build contracts через npm), `build:web:npm` (запуск `npm run build` в `apps/web`). |
| **apps/web/package.json** | Добавлен lifecycle-скрипт `prebuild`: `cd ../.. && npm run build:contracts:npm`. Перед каждым `npm run build` в `apps/web` сначала собирается `packages/contracts`. |
| **apps/web/vercel.json** | `installCommand`: было `cd ../.. && npm install`, стало `cd ../.. && npm install && npm run build:contracts:npm` — после установки зависимостей сразу собирается contracts. `buildCommand`: было `cd ../.. && npm run build`, стало `cd ../.. && npm run build:contracts:npm && npm run build:web:npm` — полная сборка через npm (без bun), чтобы на Vercel не зависеть от установки bun. |

Архитектура приложения, middleware и auth не менялись; правки только в скриптах сборки и конфигурации Vercel.

---

## 3. Как теперь собирается монорепо

1. **Установка (Vercel):**  
   `installCommand`: переход в корень репо, `npm install`, затем `npm run build:contracts:npm`.  
   В результате зависимости установлены и `packages/contracts/dist` создан до этапа build.

2. **Сборка (Vercel):**  
   `buildCommand`: переход в корень, `npm run build:contracts:npm`, затем `npm run build:web:npm`.  
   - `build:contracts:npm` — очистка и сборка contracts (npm, без bun).  
   - `build:web:npm` — в `apps/web` вызывается `npm run build` (срабатывает `prebuild` → снова сборка contracts, затем `next build`). Двойная сборка contracts не ломает результат и страхует случай, когда в UI Vercel переопределяют только build.

3. **Локально** по-прежнему можно использовать из корня:  
   `npm run build` (bun) или `npm run build:contracts:npm && npm run build:web:npm` (только npm).

4. **Если в Vercel в качестве Build Command задано только `next build`:**  
   До этого шага уже выполнен `installCommand` с `npm run build:contracts:npm`, поэтому `dist/` у contracts уже есть и резолв `@aistroyka/contracts` проходит.

---

## 4. Root Directory в Vercel

Остаётся **Root Directory = `apps/web`**.

- Install и Build выполняются из корня репозитория за счёт `cd ../..` в `installCommand` и `buildCommand` в `apps/web/vercel.json`.
- Менять Root Directory на корень репо не требуется; важно не переопределять в Project Settings команды установки/сборки так, чтобы они перестали подниматься в корень и собирать contracts (см. п. 5).

---

## 5. Рекомендуемые команды в Vercel

В **Project Settings → General → Build & Development Settings**:

- **Install Command:** оставить пустым (используется `installCommand` из `apps/web/vercel.json`: `cd ../.. && npm install && npm run build:contracts:npm`), либо явно задать ту же строку.
- **Build Command:** оставить пустым (используется `buildCommand` из `apps/web/vercel.json`: `cd ../.. && npm run build:contracts:npm && npm run build:web:npm`), либо явно задать ту же строку.

Если в UI задать только **Build Command: `next build`**, сборка будет успешной за счёт того, что contracts уже собран на этапе install.

---

## 6. Какую ветку деплоить

Фикс внесён в ветку **`ops/external-setup-attempt`**. Ветка **`main`** на момент отчёта не содержала этих изменений (текущая ветка на 33 коммита впереди `main`).

- Чтобы исправленный билд пошёл на Vercel, нужно деплоить ветку **`ops/external-setup-attempt`** (или влить эти коммиты в `main` и деплоить `main`).
- Если в Vercel выбран Production Branch = `main`, сборка будет без этих правок и ошибка `Can't resolve '@aistroyka/contracts'` может повториться. Рекомендация: переключить деплой на ветку с фиксом или смержить фикс в `main`.

---

## 7. Результаты локальной сборки после фикса

- `npm run build:contracts:npm` — выполняется успешно, в `packages/contracts/dist` появляются артефакты.
- `npm run build:contracts:npm && npm run build:web:npm` из корня — полная сборка проходит успешно, Next.js собирает все маршруты, включая `app/api/v1/health/route.ts` с импортом `@aistroyka/contracts`.
- Из каталога `apps/web`: `npm run build` (с prebuild) — при предварительно удалённом `packages/contracts/dist` prebuild собирает contracts, затем `next build` завершается успешно.

Новых поломок не внесено; существующий `npm run build` из корня (bun) по-прежнему работает.

---

## 8. Плагины / интеграции Cursor

Специальный плагин или интеграция Cursor для Vercel (deploy settings, build logs, monorepo resolution) **не использовались**. Проверка ограничилась локальным анализом конфигов (package.json, vercel.json, tsconfig, структура packages/contracts), воспроизведением сценария «только next build» и прогоном сборки после правок. Рекомендуется после следующего деплоя на Vercel проверить логи сборки и при необходимости скорректировать только Install/Build Command в UI в соответствии с п. 5.
