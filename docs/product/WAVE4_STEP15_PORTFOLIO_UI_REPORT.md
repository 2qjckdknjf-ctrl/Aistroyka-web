# Wave 4 Step 15 — Portfolio UI

## Surfaces

1. **`/portfolio` page** (`app/[locale]/(dashboard)/portfolio/page.tsx`)  
   - New **Portfolio control** card **above** the existing AI-based `PortfolioOverview` (analysis-based intelligence unchanged).  
   - Client: `PortfolioControlOverviewClient.tsx`

2. **Features**
   - Distribution chips: All / Critical / Attention / Healthy.  
   - Table: project name (link), portfolio state badge, focus category + primary reason, compact signal summary, drill-down link.

## Workflow

- Managers land on Portfolio → scan operational control first → use drill-down → existing project tabs.  
- No change to global shell or nav; portfolio page gains a real operational section.

## Limitations

- No CSV export, no cross-tenant views, no custom columns.  
- Project cap (20) shown in UI when tenant has more projects.
