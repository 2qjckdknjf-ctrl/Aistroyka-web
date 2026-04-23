# Wave 4 Step 21 — Manager / leadership UI (Stage D)

## Surfaces

| Surface | Location |
|---------|----------|
| Project overview card | `DashboardProjectDetailClient.tsx` — “Commercial & billing”: open outstanding (budget currency), overdue count, link to tab |
| Commercial tab | `ProjectCommercialPanel.tsx` — table of lines, create form (draft), status `<select>` per row (PATCH) |
| Project review pack | `ProjectReviewPackPanel.tsx` — “Commercial & billing” card with narrative + link `?tab=commercial` |
| Portfolio command | `PortfolioCommandViewClient.tsx` — banner when `commercialOverdueCount > 0` |
| Portfolio review pack | `PortfolioReviewPackSection.tsx` — line when portfolio `commercialSignals.overdueCount > 0` |

## UX principles

- **Decision-oriented** copy; no accounting jargon.  
- **Badges** for overdue (error tone) vs issued/due (warning).  
- **Shell unchanged** — new tab inside existing project `Card` / `Tabs`.

## Limitations

- No per-line detail page (list + PATCH only).  
- No stakeholder-specific commercial view beyond RLS read where policy allows.
