# Contributing to Aistroyka-web

## Ветки и main

- **main** — стабильная ветка. Готовый к продакшену код.
- **Не коммитить и не пушить напрямую в main.**
- Вся разработка ведётся в **feature-ветках**: `feature/<short-name>` (например `feature/repo-discipline`, `feature/upload-fix`).
- Слияние в main только через **Pull Request** после прохождения CI и ревью (если настроено).

## Коммиты

- Один логический блок изменений = один коммит.
- Используем **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- Перед коммитом должны проходить проверки (lint/test/build — где применимо).

## Pull Request

- Создавать PR из своей feature-ветки в `main`.
- Убедиться, что CI зелёный.
- После мержа в main ветку можно удалить.

## Supabase

- Все изменения схемы/миграций хранить в репозитории: `supabase/migrations/`.
- Секреты не коммитить; использовать `.env` (в .gitignore) и `.env.example` как шаблон.

Подробнее: `docs/cursor/WORK_RULES.md`, `docs/cursor/GIT_WORKFLOW_REPORT.md`.
