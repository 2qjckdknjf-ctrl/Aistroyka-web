# Отчёт: исправление Vercel build — tsc: command not found

## 1. Root cause

При сборке на Vercel команда `@aistroyka/contracts@0.1.0 build` выполняла `tsc -p tsconfig.json`. В CI окружении при вызове `npm run --prefix packages/contracts build` бинарь `tsc` не оказывался в `PATH`:

- TypeScript объявлен в `packages/contracts` в `devDependencies` и при npm workspaces может быть установлен только в корне (`node_modules`), а не в `packages/contracts/node_modules`.
- При запуске скрипта через `npm run --prefix packages/contracts build` в PATH добавляется только `packages/contracts/node_modules/.bin`. Если `tsc` там нет (из‑за hoisting), команда `tsc` не находится → `tsc: command not found`.

Локально ошибка не воспроизводилась, потому что в локальной среде `tsc` мог быть доступен (например, глобально или из другого пути).

## 2. Где не хватало доступности TypeScript

- **Пакет:** `packages/contracts`.
- **Проблема:** не «не хватало» зависимости (typescript уже в devDependencies), а способ вызова: скрипт вызывал `tsc` по имени, полагаясь на PATH. В CI PATH при `--prefix` не гарантирует наличие бинаря из корневого `node_modules`.

## 3. Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `packages/contracts/package.json` | В скрипте `build`: `"tsc -p tsconfig.json"` заменён на `"npx tsc -p tsconfig.json"`. |

Зависимости не менялись: `typescript` остаётся в `devDependencies` пакета `contracts`.

## 4. Почему Vercel теперь соберёт contracts

- `npx tsc` ищет бинарь в дереве `node_modules` текущего пакета и выше (в т.ч. в корне воркспейса), а не только в PATH.
- После `npm install` в корне TypeScript устанавливается (в корень или в `packages/contracts`), и `npx tsc` в контексте `packages/contracts` его находит.
- Решение стандартное для npm-скриптов в монорепо и не требует хаков, лишних зависимостей или копирования файлов.

## 5. Локальная проверка

Выполнено из корня репозитория:

1. `npm run build:contracts:npm` — успешно (clean + build с `npx tsc -p tsconfig.json`).
2. `npm run build:web:npm` — успешно (prebuild собирает contracts, затем Next.js build).

Итог: сборка contracts и полный build (contracts + web) проходят локально; на Vercel ожидается такой же результат при том же `npm install` и `npm run build:contracts:npm` / `npm run build:web:npm`.
