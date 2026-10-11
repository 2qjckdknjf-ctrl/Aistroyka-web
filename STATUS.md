# STATUS — AISTROYKA

Сверено 2026-10-11. Проверенный main/runtime:40c7e73b после #426. Рабочая папка:AISTROYKA-main-clean; Customer QA #426 merged. Следующая задача — published-evidence guard в fix/published-evidence-guard-2026-10-11, в повторно используемой архивной рабочей папке. Перед новой задачей:python 3 scripts/ops/workspace_preflight.py --refresh; занятые/грязные папки не переключать.

| Контур | Подтверждено | Остаток |
|---|---|---|
| Main/runtime | #420–426 merged. Staging 38147780974 и production 38148048805 SUCCESS; served health 40c7e73 | Следующий HEAD не считать опубликованным до новых health checks |
| AI доступ | Image/video media binding, analysis:trigger, scoped session CAS/completion; canonical deployed provider smoke без fallback | Полный upload→job→source-linked result, видео worker и все AI capabilities |
| БД | Восемь source migrations/семь remote IDs в receipts, включая Storage 20261011140341; replay guard PASS | Исторический drift отдельно, без broad apply |
| Customer portal | #424 восстановил client_portal_enabled из сохранённой release-работы. Finance smoke требует HTTP 200 + expected project, production PASS | Published media, invitation/export/AI-summary/share и более широкий Owner контракт |
| Physical Customer QA | Debug на iPhone 17 Pro: login→project→detail→intake persisted→revoked 404→refresh hides content/actions→sign-out PASS 1/1; Shared contracts 17/17 | QA fixes merged в #426; credentials были private Debug prefill. Ручной ввод пароля, push/offline и store/pilot artifact отдельно |
| Storage | #425 applied: stakeholder raw sign/download/upload deny, owner оба prefix layouts PASS 8 live checks;48 SQL contracts в двух изолированных engines | Уже выданные signed URLs живут до expiry; customer publication/immediate revocation не объявлены готовыми |
| Cleanup | Три синтетических intake drafts, две project/media fixtures, grant/member/cost/Auth user и task blobs удалены; fixture sessions revoked; runner credentials scrubbed | Реальные business rows/objects не изменялись |
| План | Manual intake, Customer target, Graph persistence и request_key уже есть | AI scope extraction, полноценный Owner/evidence/Graph flow, device/store/legal/billing gates |

[Проверки и точные границы](docs/reports/2026-10-11-customer-device-and-storage-closure.md), [реестр](docs/tasks/ACTIVE_WORK_REGISTRY.csv), [план/факт](docs/roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md), [receipts](docs/ops/VERIFIED_DB_MIGRATION_RECEIPTS.md). #200 закрыт как superseded; #195/#196/#206 — смешанные остатки, не объединять и не закрывать целиком по одному исправленному срезу. Полная готовность проекта не объявлена.
