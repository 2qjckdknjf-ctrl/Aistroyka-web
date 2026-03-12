# Отчёт: исправление Vercel build — tsc (TypeScript compiler)

## 1. Почему `npx tsc` оказался неправильным решением

- В CI/Vercel при вызове `npx tsc` пакет **TypeScript** не оказывался в дереве `node_modules`, доступном для этого вызова (из‑за hoisting в npm workspaces).
- В такой ситуации `npx` не находит локальный `typescript` и пытается установить пакет по имени команды: **`tsc`** — это отдельный npm-пакет (например `tsc@2.0.4`), а не TypeScript compiler.
- В результате Vercel выводил: *"The following package was not found and will be installed: tsc@2.0.4 — This is not the tsc command you are looking for"*.
- Вывод: использовать `npx tsc` в скрипте сборки в этом окружении нельзя — нужен явно установленный TypeScript и обычный вызов `tsc`.

## 2. Где объявлен TypeScript и какой build script используется

- **TypeScript объявлен** в `packages/contracts/package.json` в **devDependencies**: `"typescript": "^5.6.3"`. Пакет contracts самодостаточен для сборки.
- **Build script** в `packages/contracts`: снова обычный вызов компилятора:
  - `"build": "tsc -p tsconfig.json"`  
  (без `npx`).

Чтобы в CI при `npm run --prefix packages/contracts build` в PATH был именно этот `tsc`, перед сборкой выполняется установка зависимостей **внутри** пакета contracts (см. п. 4).

## 3. Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `packages/contracts/package.json` | Скрипт `build`: возвращён к `"tsc -p tsconfig.json"` (убрано `npx tsc`). |
| `package.json` (root) | Скрипт `build:contracts:npm`: перед `npm run --prefix packages/contracts build` добавлен шаг `npm install --prefix packages/contracts`. |

## 4. Почему это правильно для Vercel/CI

- При `npm install` в корне монорепо зависимости workspace-пакетов часто поднимаются (hoisting) в корневой `node_modules`. Тогда в `packages/contracts/node_modules/.bin` может не быть `tsc`, и при `npm run --prefix packages/contracts build` команда `tsc` не находится.
- Решение: перед сборкой contracts выполнять **`npm install --prefix packages/contracts`**. Это устанавливает зависимости пакета `packages/contracts` в его собственный `node_modules`, в том числе `typescript` и бинарь `tsc` в `packages/contracts/node_modules/.bin`.
- При следующем шаге `npm run --prefix packages/contracts build` npm добавляет этот `.bin` в PATH, и выполняется **реальный** TypeScript compiler из зависимости `typescript`, а не сторонний пакет `tsc`.
- Без хардкода путей, без `npx tsc`, с явной зависимостью на TypeScript в пакете, который собирается — поведение предсказуемо и подходит для production и CI.

## 5. Результаты локальной проверки

Из корня репозитория выполнено:

1. **`npm install`** — успешно.
2. **`npm run build:contracts:npm`** — успешно: clean → `npm install --prefix packages/contracts` (добавлены пакеты в `packages/contracts/node_modules`) → `tsc -p tsconfig.json`.
3. **`npm run build:web:npm`** — успешно: prebuild собирает contracts тем же способом, затем Next.js build завершается без ошибок.

Итог: сборка contracts и полный сценарий (contracts + web) проходят локально; на Vercel при том же порядке команд (`npm install` в корне, затем `build:contracts:npm` и `build:web:npm`) ожидается корректная работа с установленным TypeScript и обычным `tsc`.
