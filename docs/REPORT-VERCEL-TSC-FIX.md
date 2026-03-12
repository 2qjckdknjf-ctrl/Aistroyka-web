# Отчёт: исправление Vercel build — tsc (TypeScript compiler)

## 1. Root cause

Реальная причина падения сборки contracts на Vercel:

- **TypeScript** объявлен в `packages/contracts/package.json` в **devDependencies** (`"typescript": "^5.6.3"`).
- В CI/Vercel при сборке часто выставлен **NODE_ENV=production** (или Vercel по умолчанию ведёт себя как production). В этом режиме **`npm install` не устанавливает devDependencies** (см. документацию npm).
- В результате при выполнении `npm install --prefix packages/contracts` без явного указания типа зависимостей devDependencies пропускаются → пакет `typescript` не ставится → в `packages/contracts/node_modules/.bin` нет `tsc`.
- Скрипт сборки `tsc -p tsconfig.json` тогда закономерно падает: **`sh: line 1: tsc: command not found`**.

Исправление — явно включить devDependencies при установке зависимостей пакета contracts в скрипте, используемом в CI/Vercel.

---

## 2. Почему предыдущие фиксы не устраняли проблему полностью

- **Первый фикс (npx tsc):** при отсутствии локального `typescript` в дереве `node_modules` npx подтягивал **другой** npm-пакет — `tsc` (не компилятор TypeScript), что давало сообщение *"This is not the tsc command you are looking for"*. Проблему с отсутствием devDependencies не решал.
- **Второй фикс (npm install --prefix packages/contracts):** добавлял установку зависимостей в пакет contracts перед build, но не указывал **включение devDependencies**. В окружении с NODE_ENV=production devDependencies по-прежнему не ставились, и `tsc` оставался недоступен.

Оба подхода не учитывали семантику **production install**, при которой npm намеренно не ставит devDependencies.

---

## 3. Где объявлен TypeScript и какой install flag добавлен

- **Где объявлен:** в **`packages/contracts/package.json`** в **devDependencies**: `"typescript": "^5.6.3"`. Перенос в dependencies не делался — TypeScript нужен только для сборки.
- **Build script** в packages/contracts: `"build": "tsc -p tsconfig.json"` (обычный вызов компилятора, без npx).
- **Добавленный флаг:** при установке зависимостей для пакета contracts в root-скрипте используется:
  - **`npm install --prefix packages/contracts --include=dev`**
- Полный скрипт `build:contracts:npm` в root `package.json`:
  - `npm run --prefix packages/contracts clean && npm install --prefix packages/contracts --include=dev && npm run --prefix packages/contracts build`

---

## 4. Почему это корректно для npm/Vercel

- **`--include=dev`** — штатный флаг npm: явно включает devDependencies при установке, даже если NODE_ENV=production или окружение ведёт себя как production. Документация npm: при production devDependencies по умолчанию опускаются; `--include=dev` отменяет это для данного вызова.
- Один вызов `npm install --prefix packages/contracts --include=dev` гарантирует установку и dependencies, и devDependencies пакета contracts, в том числе `typescript` и бинарь `tsc` в `packages/contracts/node_modules/.bin`. Следующий шаг `npm run --prefix packages/contracts build` выполняется с этим PATH, и команда `tsc` находит нужный компилятор.
- Решение не меняет структуру монорепо, не добавляет npx-обходы и не хардкодит пути; исправляется только семантика install в CI/Vercel.

В **docs/DEPLOY-VERCEL.md** добавлено пояснение: при заданном в Vercel `NODE_ENV=production` обычный `npm install` не ставит devDependencies; для сборки contracts скрипт `build:contracts:npm` явно использует `--include=dev` при установке в `packages/contracts`.

---

## 5. Результаты локальной проверки

Из корня репозитория выполнено:

1. **Обычный прогон:** `rm -rf packages/contracts/node_modules packages/contracts/dist && npm run build:contracts:npm` — успешно (clean → install с `--include=dev` → `tsc -p tsconfig.json`).
2. **Production-like:** `rm -rf packages/contracts/node_modules packages/contracts/dist && NODE_ENV=production npm run build:contracts:npm` — успешно; с флагом `--include=dev` devDependencies устанавливаются и при NODE_ENV=production, `tsc` доступен, сборка contracts проходит.
3. **Полный build:** `npm run build:web:npm` — успешно (prebuild собирает contracts тем же скриптом, затем Next.js build).

Итог: сборка contracts и полный сценарий (contracts + web) проходят локально и в production-like режиме; на Vercel при том же `build:contracts:npm` (с `--include=dev`) ожидается корректная установка TypeScript и успешный запуск `tsc`.
