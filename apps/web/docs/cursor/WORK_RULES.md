# Правила работы: Cursor → Git

## Основные правила

1. **Работаем в feature-ветке.** В main не коммитим и не пушим напрямую.
2. **Сначала изменения → потом проверки → потом коммит.** Перед каждым коммитом: `npm run lint` (и при наличии — тесты/сборка).
3. **Коммиты атомарные.** Один логический блок = один коммит. Сообщения в формате Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
4. **Перед merge в main — PR и зелёный CI.** Создаём Pull Request из своей ветки в `main`, дожидаемся прохождения GitHub Actions, затем мержим.

## Рекомендуемый цикл

```bash
# 1. Новая фича
git checkout main
git pull origin main
git checkout -b feature/короткое-имя

# 2. Правки в коде
# ... редактирование ...

# 3. Проверки
npm run lint
npm run test
npm run build

# 4. Коммит (атомарно)
git add -p   # или git add <файлы>
git commit -m "feat: краткое описание"

# 5. Пуш и PR
git push -u origin feature/короткое-имя
# В GitHub: Create Pull Request → base: main, compare: feature/...

# 6. После мержа (опционально)
git checkout main
git pull origin main
git branch -d feature/короткое-имя
```

## Обход хука (только в крайнем случае)

Если нужно закоммитить без pre-commit (например, срочный фикс):

```bash
git commit --no-verify -m "fix: описание"
```

По умолчанию хуки включены и должны проходить.

## Дополнительно

- **CONTRIBUTING.md** — ветки, коммиты, PR.
- **docs/cursor/COMMITS.md** — префиксы коммитов.
- **docs/cursor/SUPABASE.md** — миграции и секреты Supabase.
- **docs/cursor/GIT_WORKFLOW_REPORT.md** — полный отчёт по настройке дисциплины.
