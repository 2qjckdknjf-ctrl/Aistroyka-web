# Vercel install fix: husky: command not found

**Дата:** 2026-03-12  
**Проблема:** При выполнении install на Vercel (`cd ../.. && npm install && npm run build:contracts:npm`) падала ошибка: `npm error command sh -c husky` / `sh: line 1: husky: command not found`.

---

## 1. Root cause

- В **apps/web/package.json** был скрипт **`"prepare": "husky"`**. Он вызывается npm после установки зависимостей (в т.ч. при `npm install` из корня монорепо для workspace apps/web).
- На **Vercel** при установке окружение и PATH такие, что бинарь `husky` не находится (или prepare выполняется до того, как `node_modules/.bin` доступен), из-за чего команда `husky` падает с "command not found".
- **Husky** нужен только для локальной разработки (git hooks); в CI/Vercel он не нужен и не должен блокировать установку.

---

## 2. Какой script был проблемным

- **apps/web/package.json** → `"prepare": "husky"`.
- При `npm install` в корне npm выполняет lifecycle-скрипты workspace-пакетов; для apps/web вызывался `prepare` → `husky` → ошибка на Vercel.

---

## 3. Как исправлен prepare flow

- **Добавлен скрипт apps/web/scripts/prepare.cjs:**  
  Проверяет переменные окружения **CI** и **VERCEL**. Если любая из них задана (например `CI=1`, `VERCEL=1`), скрипт завершается с кодом 0 и **не запускает husky**. Иначе вызывается `npx husky` из корня apps/web (локальная установка хуков).
- **В apps/web/package.json** заменено:
  - было: `"prepare": "husky"`
  - стало: `"prepare": "node scripts/prepare.cjs"`

В результате:
- **На Vercel/CI:** при наличии `CI` или `VERCEL` prepare сразу выходит, husky не вызывается, установка не падает.
- **Локально:** при обычном `npm install` (без CI/VERCEL) выполняется `npx husky`, хуки остаются рабочими.

---

## 4. Почему это безопасно для Vercel

- На Vercel по умолчанию выставляется **`VERCEL=1`**, поэтому prepare.cjs видит CI-окружение и не запускает husky.
- В типичных CI (GitHub Actions, GitLab CI и т.п.) задаётся **`CI=true`**, так что и там husky не выполняется.
- Husky не используется на этапе сборки/деплоя, только для pre-commit и т.п. локально; отключение в CI не меняет поведение деплоя.

---

## 5. Результаты локальной проверки

- **Установка в режиме CI:** выполнена `CI=1 npm install` из корня репозитория (после удаления node_modules) — завершилась успешно, ошибки husky нет.
- **Сборка после этого:** `npm run build:contracts:npm && npm run build:web:npm` — прошла успешно.
- **Запуск prepare локально (без CI):** `node apps/web/scripts/prepare.cjs` — выполняется, вызывается `npx husky` (в монорепо может выводиться предупреждение про .git — это ожидаемо и не ломает установку).

Локальный developer workflow (install, build, при необходимости husky для хуков) не сломан.
