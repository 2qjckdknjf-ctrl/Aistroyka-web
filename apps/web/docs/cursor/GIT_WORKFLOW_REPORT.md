# Git Workflow & Repo Discipline — Report

## 1) Что было до (ветки, проблемы, риски)

### Текущее состояние репозитория
- **Расположение git:** репозиторий один — в `apps/web`. Корень монорепо (AISTROYKA) не под git.
- **Ветка:** `main` (до переключения создана `feature/repo-discipline`).
- **Remote:** `origin` → `https://github.com/2qjckdknjf-ctrl/Aistroyka-web.git`
- **Последний коммит:** `bbd3b8a` — Fix Cloudflare build/deploy pipeline

### Незакоммиченные изменения (на момент аудита)
- **Modified (не в staging):** .gitignore, множество файлов в `app/`, `lib/`, `middleware.ts`, `package.json`, `wrangler.toml` и др.
- **Untracked:** .env.production.example, .env.staging.example, новые компоненты (admin/system/, portfolio/, projects/new/), API routes, docs (architecture-v1.md, security-hardening-report.md и др.), отчёты в корне.

### Секреты и .env
- **В репозитории:** захардкоженных ключей/токенов (Supabase anon/service_role, Bearer, sk_live и т.п.) в отслеживаемых файлах **не обнаружено**.
- **.gitignore (apps/web):** перечислены `.env`, `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local`, `.env.staging`, `.env.production` — **адекватно**.
- **Риск:** файлы `.env.*.example` в untracked — их нужно добавить в репозиторий как шаблоны (без секретов).

### .gitignore
- **apps/web:** покрывает node_modules, .next, out, .env*, .vercel, .dev.vars, .DS_Store, дубликаты файлов — **достаточно для Next.js + Cloudflare**.
- **Рекомендация:** явно добавить `*.log`, `coverage` (уже есть), проверить отсутствие `supabase/.env` при добавлении Supabase CLI.

### Итог рисков
- Прямые пуши в `main` не ограничены (только дисциплиной).
- Нет обязательных проверок перед коммитом/пушем.
- Нет единого стандарта сообщений коммитов и политики веток в документации.

### Рекомендации для GitHub Branch Protection (настроить вручную в Settings → Branches)
- **Branch name pattern:** `main`
- **Do not allow bypassing the above settings** (для админов по необходимости).
- **Require a pull request before merging:** минимум 1 approval (опционально).
- **Require status checks to pass before merging:** выбрать workflow (например `lint` / `build` из GitHub Actions).
- **Restrict who can push to matching branches:** пусто = все пушат только через PR (прямой push в main запрещён правилами репо).
- Через GitHub CLI/API настройка возможна при наличии прав; иначе — только через веб-интерфейс.

---

## 2) Что сделано (список изменений)

- **B.** Создана ветка `feature/repo-discipline`; обновлены README и добавлен CONTRIBUTING.md с правилами веток, коммитов и PR; в отчёт внесены рекомендации по Branch Protection.
- **C.** Введён стандарт Conventional Commits (документация `docs/cursor/COMMITS.md`), добавлен шаблон `.gitmessage` и инструкция по включению.
- **D.** Добавлены husky и lint-staged; pre-commit запускает `eslint --fix` по изменённым TS/JS файлам; в package.json — скрипты `lint`, `test`, `prepare`.
- **E.** Добавлен GitHub Actions workflow `.github/workflows/ci.yml`: триггер на PR в main и push в feature/*, шаги lint → test → build.
- **F.** Добавлена структура `supabase/migrations/`, в .gitignore — `supabase/.env`; документация `docs/cursor/SUPABASE.md` (CLI, pull/push миграций, секреты).
- **G.** Добавлен `docs/cursor/WORK_RULES.md` с правилами работы и рекомендуемым циклом Cursor → Git.
- **H.** Отчёт доведён до финального вида.

---

## 3) Файлы добавлены/изменены

**Добавлены:**
- `CONTRIBUTING.md`
- `.gitmessage`
- `docs/cursor/GIT_WORKFLOW_REPORT.md`
- `docs/cursor/COMMITS.md`
- `docs/cursor/SUPABASE.md`
- `docs/cursor/WORK_RULES.md`
- `.github/workflows/ci.yml`
- `.husky/pre-commit`
- `supabase/migrations/.gitkeep`

**Изменены:**
- `README.md` — блок про Git и ветки
- `package.json` — скрипты `lint`, `test`, `prepare`, секция `lint-staged`, devDependencies `husky`, `lint-staged`
- `.gitignore` — добавлено `supabase/.env`

---

## 4) Команды (pre-commit / CI / Supabase)

### Шаблон коммита (.gitmessage)
Включить локально (один раз):
```bash
git config commit.template .gitmessage
```
Отключить: `git config --unset commit.template`

### Pre-commit (husky + lint-staged)
- **При коммите:** запускается `npx lint-staged` → для изменённых `*.{ts,tsx,js,jsx}` выполняется `eslint --fix`.
- **Отключить при форс-мажоре:** `git commit --no-verify` (не рекомендуется для постоянного использования).
- Хуки: `.husky/pre-commit`. Репозиторий не игнорирует `.husky` — хуки версионируются.

### CI (GitHub Actions)
- **Workflow:** `.github/workflows/ci.yml`
- **Триггеры:** `pull_request` в `main`, `push` в `feature/**`
- **Шаги:** checkout → setup Node 20 → `npm ci --legacy-peer-deps` → `npm run lint` → `npm run test` → `npm run build`
- **Без macOS:** iOS build не применим (это веб-репо); при появлении iOS в этом репо — описать в отчёте альтернативу (отдельный job на macos-latest или пропуск).

---

## 5) Как работать дальше

1. Всегда создавать feature-ветку от актуального `main`: `git checkout -b feature/имя`.
2. Перед коммитом запускать `npm run lint` (и при необходимости `npm run build`). Pre-commit сам запустит lint-staged.
3. Коммиты — атомарные, с префиксом `feat:`, `fix:`, `docs:` и т.д.
4. Пуш ветки: `git push -u origin feature/имя`. Слияние в main только через Pull Request после зелёного CI.
5. В GitHub по желанию включить Branch Protection для `main` (см. раздел 1 отчёта).
6. Шаблон коммита: `git config commit.template .gitmessage` (один раз локально).

Подробнее: `docs/cursor/WORK_RULES.md`, `CONTRIBUTING.md`.

---

## 6) Известные ограничения

- **Git только в apps/web.** Корень монорепо (AISTROYKA) не под версионным контролем в этом репо; iOS и engine — вне текущего GitHub-репозитория.
- **Branch Protection** настраивается вручную в GitHub (Settings → Branches); через CLI без токена с правами — недоступно.
- **CI** не запускает сборку под Cloudflare (cf:build) — только `npm run build` (Next.js); при необходимости можно добавить отдельный job или переключить шаг на `cf:build`.
- **Тесты:** скрипт `test` заглушка (`exit 0`); при добавлении тестов заменить на реальную команду (e.g. `vitest run`).
- **Пуш ветки:** при использовании Personal Access Token для push нужен scope **`workflow`**, иначе GitHub отклонит push с изменением `.github/workflows/*`. Ошибка: `refusing to allow a Personal Access Token to create or update workflow ... without workflow scope`. Решение: выдать токену право workflow или пушить с учёткой/токеном с полными правами репо.

---

## 7) Следующие шаги

- [ ] Выдать PAT scope `workflow` (или пушить иначе), затем выполнить: `git push -u origin feature/repo-discipline`.
- [ ] Включить Branch Protection для `main` в GitHub (при наличии прав).
- [ ] Смержить `feature/repo-discipline` в `main` через PR после прохождения CI.
- [ ] Добавить в репозиторий `.env.example` (и при необходимости `.env.production.example`, `.env.staging.example`) как шаблоны без секретов.
- [ ] При появлении тестов — заменить `npm run test` на реальный раннер и при необходимости добавить coverage в CI.
- [ ] При необходимости версионировать миграции именно в этом репо — вести их в `supabase/migrations/` и следовать `docs/cursor/SUPABASE.md`.
