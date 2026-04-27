# Wave 4 Step 18 — Review pack backend

## B1 — DTOs

Defined in `apps/web/lib/domain/review-packs/review-packs.types.ts`:

- `ProjectReviewPack` — `header`, `control`, `budget`, `handover`, `aftercare`, `attention`, `blockers`, `recentChanges`, `actionFocus`, `generatedAt`.
- `PortfolioReviewPack` — `header`, `distribution`, `criticalProjects`, `attentionProjects`, `healthyCount`, `actionFocus`, `generatedAt`.

## B2 — Services

| Service | Responsibility |
|---------|----------------|
| `buildPortfolioProjectControlRow` | Exported from `portfolio-control.service.ts`; single-project row shared with portfolio list and project pack. |
| `buildProjectReviewPack` | Composes summary, handover, attention, control row (cached summary), stakeholder timeline (5). |
| `buildPortfolioReviewPack` | Wraps `buildPortfolioControl`, shapes narrative + highlights critical/attention slices (max 8 each). |

## B3 — APIs

- `GET /api/v1/projects/[id]/review-pack` — tenant + internal workspace project access.  
- `GET /api/v1/portfolio/review-pack` — same auth pattern as `GET /api/v1/portfolio/control` (tenant session).  

## B4 — Reuse

No duplicate classification logic: `classifyPortfolioControlState`, `pickTopBlockerCategory`, `primaryReasonForRow` remain the single source inside portfolio control.
