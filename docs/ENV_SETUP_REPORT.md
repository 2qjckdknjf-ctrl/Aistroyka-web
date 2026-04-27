# Mac dev environment setup — report

**Date:** 2025-03-22

## DONE

### 1. Node.js
- **version:** v20.20.0
- **path:** `/Users/alex/.nvm/versions/node/v20.20.0/bin/node`
- **status:** OK (via nvm)

### 2. npm
- **version:** 10.8.2
- **path:** `/Users/alex/.nvm/versions/node/v20.20.0/bin/npm`
- **status:** OK

### 3. Corepack
- **version:** 0.34.1
- **status:** OK, enabled

### 4. pnpm
- **version:** 9.15.0
- **path:** `/Users/alex/.nvm/versions/node/v20.20.0/bin/pnpm`
- **status:** OK (via Corepack)

### 5. Что было сделано
- Диагностика: Node 20.20.0 и npm уже установлены через nvm, Homebrew доступен
- `corepack enable` и `corepack enable pnpm`
- `corepack prepare pnpm@9.15.0 --activate`
- Проверка в новом login shell: все команды работают

### 6. Что потребовало моего участия
- Ничего

### 7. Осталось сделать мне
- Ничего. В каталоге проекта `packageManager` задан как `bun@1.2.15`, поэтому Corepack ожидает bun, а не pnpm. Для общих задач (в других проектах или вне корня репозитория) pnpm работает. Если в этом проекте нужен pnpm, придётся менять `packageManager` в корневом `package.json`.

### Примечание
Терминал Cursor наследует zsh и nvm, перезапуск не требуется.
