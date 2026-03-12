# GitHub Snapshot Backup — отчёт

## Статус

- **Workflow создан:** `.github/workflows/snapshot-backup.yml`
- **Cron-интервал:** каждые 5 часов (`0 */5 * * *` — в 00:00, 05:00, 10:00, 15:00, 20:00 UTC)
- **Имя веток:** `snapshots/YYYY-MM-DD` (например, `snapshots/2025-03-07`)
- **Ручной запуск:** вкладка Actions → Snapshot Backup → Run workflow

## Ссылки

- **Actions:** в репозитории: **GitHub → Actions** → workflow **"Snapshot Backup"**
- URL: `https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/workflows/snapshot-backup.yml`

## Поведение

1. По расписанию или по кнопке Run workflow запускается job `backup`.
2. Полный checkout (`fetch-depth: 0`), задаётся git-identity `github-actions[bot]`.
3. Создаётся/переключается ветка `snapshots/YYYY-MM-DD` по текущей дате UTC.
4. Все изменения добавляются; если есть изменения — создаётся коммит с сообщением `backup: snapshot YYYY-MM-DD HH:MM UTC`.
5. Ветка пушится в origin с `--force` (ветка дня перезаписывается последним снапшотом).

## Безопасность

- Секреты не коммитятся. В `.gitignore` учтены: `.env*`, `secrets/`, `*.key`, `*.pem`, `*.p12`.
- История не переписывается: `--force` только для ветки `snapshots/YYYY-MM-DD`, остальные ветки не затрагиваются.

## Статус последнего запуска

После первого пуша в `main` проверьте вкладку **Actions**: первый запуск по расписанию будет в ближайший слот (0, 5, 10, 15, 20 UTC). Для проверки без ожидания используйте **workflow_dispatch** (Run workflow).

---

*Документ создан при настройке автоматического snapshot backup.*
