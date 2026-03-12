# Git/GitHub Sync Readiness — Aistroyka

**Дата аудита:** 2026-03-12  
**Цель:** Аудит состояния git/GitHub перед деплоем, без деструктивных действий.

---

## 1. Есть ли GitHub remote

**Да.** Подключён один remote:

| Remote | URL (fetch) | URL (push) |
|--------|-------------|------------|
| `origin` | `git@github.com:2qjckdknjf-ctrl/Aistroyka-web.git` | `git@github.com:2qjckdknjf-ctrl/Aistroyka-web.git` |

- **Это GitHub:** да (хост `github.com`).
- **Основные ветки на remote:** `origin/main`, `origin/develop`, `origin/release/phase5-2-1` (есть и другие удалённые ветки).

---

## 2. Какая текущая ветка

**Активная ветка:** `ops/external-setup-attempt`

- **Upstream:** не настроен (`git rev-parse --abbrev-ref @{u}` → нет). Ветки `ops/external-setup-attempt` на `origin` нет, она только локальная.

---

## 3. Есть ли локальные изменения

**Да.** Состояние рабочего дерева:

| Категория | Количество | Комментарий |
|-----------|-------------|-------------|
| **Modified (unstaged)** | 196 файлов | ~1752 строк добавлено, ~8501 удалено |
| **Deleted (unstaged)** | много файлов | в т.ч. `apps/web/app/[locale]/page.tsx`, папки `ios/AiStroykaManager`, `ios/WorkerLite`, части `ios/AiStroykaWorker` |
| **Staged** | 0 | Ничего не добавлено в индекс |
| **Untracked** | 1859+ записей | Новые файлы/папки (например `android/`, `apps/web/app/[locale]/(public)/`, новые API, `docs/`, скрипты и т.д.) |

**Итог:** Есть значительный объём незакоммиченных изменений (правки, удаления, новые файлы). Перед осмысленным push их нужно либо закоммитить, либо явно исключить (например через `.gitignore`), либо принять решение не включать в деплой.

---

## 4. Есть ли неотправленные коммиты

**Да.** Текущая ветка `ops/external-setup-attempt` опережает `origin/main` на **32 коммита**. Эти коммиты ни разу не пушились (на `origin` такой ветки нет).

Примеры последних коммитов (все 32 не на remote):

- `f7a8f2af` docs(pilot): add phase6 audit, qa, and final report  
- `bc0381de` pilot: add tenant readiness, metrics, and incident playbooks  
- `db788ca2` release: add environment and release discipline docs/checklists  
- … всего 32 коммита до общего предка с `origin/main`.

- **Отставание от origin/main:** 0 (локальная ветка построена поверх актуального `origin/main`).
- **Divergence:** Нет расхождения с `origin/main` — ветка просто «впереди». Конфликта с remote для этой ветки нет, так как её на remote нет.

---

## 5. Безопасно ли сейчас делать push

**Частично.**

- **Безопасно в смысле истории:**  
  - Не требуется и не допускается force push.  
  - Ветка `ops/external-setup-attempt` на origin отсутствует — первый `git push -u origin ops/external-setup-attempt` создаст её и отправит 32 коммита. Перезаписи истории не будет.

- **Риски и ограничения:**  
  1. Все текущие **рабочие изменения** (modified/deleted/untracked) **не попадут** в push, пока не будут добавлены и закоммичены.  
  2. Если деплой идёт с `main`/`develop`, то push в `ops/external-setup-attempt` сам по себе не изменит прод до слияния этой ветки в целевую и деплоя уже её.  
  3. Большой объём изменений и удалений в рабочем дереве — перед коммитом стоит выборочно проверить, что именно включать (и не коммитить секреты/артефакты).

**Итог:** Push текущей ветки на GitHub технически безопасен (без force). Осмысленность деплоя зависит от того, что именно вы хотите задеплоить: только уже закоммиченные 32 коммита или ещё и текущие правки (тогда сначала нужен коммит).

---

## 6. Какие команды выполнить следующими

### Вариант A: Только отправить уже закоммиченные 32 коммита (без новых правок)

Установить upstream и сделать первый push ветки (без force):

```bash
git push -u origin ops/external-setup-attempt
```

После этого ветка `ops/external-setup-attempt` появится на GitHub и будет отслеживать `origin/ops/external-setup-attempt`.

---

### Вариант B: Сначала закоммитить текущие изменения, затем push

**Шаг 1 — просмотр и выбор файлов (рекомендуется):**

```bash
git status
git diff --stat
```

При необходимости добавить выборочно:

```bash
git add <файлы или директории>
# либо для всех изменений (осторожно с удалениями и секретами):
# git add -A
```

**Шаг 2 — коммит:**

```bash
git commit -m "описание изменений"
```

**Шаг 3 — push (как в варианте A):**

```bash
git push -u origin ops/external-setup-attempt
```

Дальнейшие обновления той же ветки:

```bash
git push
```

---

### Если бы GitHub remote не был настроен

(Для справки; у вас remote уже есть.)

```bash
git remote add origin git@github.com:2qjckdknjf-ctrl/Aistroyka-web.git
git fetch origin
git push -u origin ops/external-setup-attempt
```

---

## Правила, соблюдённые при аудите

- Ничего не удалялось, force push не выполнялся, история не переписывалась.
- Код не менялся; выполнены только чтение состояния и `git fetch origin` для актуального сравнения с remote.
- При обнаружении конфликтного/опасного статуса в отчёт вынесены предупреждения (большой объём незакоммиченных изменений и отсутствие upstream до первого push).

---

## Краткая сводка

| Вопрос | Ответ |
|--------|--------|
| GitHub remote | Да, `origin` → `git@github.com:2qjckdknjf-ctrl/Aistroyka-web.git` |
| Текущая ветка | `ops/external-setup-attempt` |
| Локальные изменения | Да: 196+ modified/deleted, 1859+ untracked, 0 staged |
| Неотправленные коммиты | Да: 32 коммита (вся ветка) |
| Безопасно ли push | Да, если имеется в виду отправка только существующих коммитов; текущие правки в push не попадут без коммита |
| Следующие команды | Либо `git push -u origin ops/external-setup-attempt`, либо сначала `git add` + `git commit`, затем тот же push |
