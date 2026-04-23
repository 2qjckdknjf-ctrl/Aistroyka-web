# Wave 4 Step 18 — Integration

## E1 — Product flow

- **Project**: Users land on project detail → review pack loads via `GET .../review-pack` in parallel with existing summary queries.  
- **Portfolio**: Portfolio page already loads control; review pack adds a second curated read (`GET .../portfolio/review-pack`).  

## E2 — Step 17 (recurring ops)

Not wired directly. Recurring automation surfaces overlap with the same operational truth (budget, handover, aftercare); no duplicate cron dependency for review packs.

## E3 — Not built

- Export platform, scheduled email of packs, custom report builder.  
