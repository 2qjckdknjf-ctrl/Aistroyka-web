# Manager completeness / recon UI inventory — 2026-11-25

Plan queue item: *«следующее локальное: Manager UI для completeness/recon»* (STATUS / mega-roadmap). Hard audit before expanding scope.

## Verdict

| Surface | Status on `main` @ `91ff1241` |
|---|---|
| Trade completeness Manager UI | **CODE_PRESENT** |
| Reconciliation findings Manager UI | **CODE_PRESENT** |
| Completeness API | **CODE_PRESENT** |
| Reconciliation API | **CODE_PRESENT** |
| Domain services + unit tests | **CODE_PRESENT** |
| Live pilot / device evidence for these tabs | **NOT_RUN** (no claim) |

Do **not** rebuild these UIs. Next work is evidence (staging role smoke) or additive gaps only.

## UI (dashboard project detail)

| File | Role |
|---|---|
| `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectTradeCompletenessPanel.tsx` | AIS-RULE-015 waterproofing completeness checklist |
| `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectReconciliationFindingsPanel.tsx` | AIS-RECON-017 finding ledger create/list/review |
| `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx` | Tabs `completeness` / `reconciliation` host panels |

## API

| Route | Role |
|---|---|
| `GET/POST …/projects/[id]/completeness/templates` | Templates |
| `POST …/projects/[id]/completeness/evaluate` | Evaluate trade completeness |
| `GET/POST …/projects/[id]/reconciliation/findings` | Finding ledger |
| `POST …/reconciliation/findings/[id]/review` | Review finding |

## Domain

| Module | Notes |
|---|---|
| `lib/domain/construction-rules/trade-completeness.*` | Service + waterproofing template + tests |
| `lib/domain/tender-reconciliation/finding-ledger.*` | Service + types + tests |

## Recommended next slice (not started here)

1. Staging Manager role smoke: open project → Completeness + Reconciliation tabs → create finding / evaluate (needs `E2E_*` / pilot creds).
2. Only then additive UX (empty states, i18n gaps, mobile Manager parity) — after fresh repro of a concrete bug.
