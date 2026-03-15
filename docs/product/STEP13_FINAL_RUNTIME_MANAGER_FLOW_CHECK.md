# Step 13 Final Runtime — Manager Flow Check

**Date:** 2025-03-14

---

## E. MANAGER FLOW

### Status: **PARTIAL**

### What Was Proven

| Check | Result |
|-------|--------|
| Manager dashboard layout | YES (dashboard layout requires auth) |
| Project detail page with tabs | YES (Overview, Schedule, Costs, etc.) |
| Costs tab panel | YES (ProjectCostsPanel) |
| View: list cost items, summary cards | YES (code) |
| Create: Add cost item modal | YES (CreateCostItemModal with category, title, planned_amount, actual_amount, milestone) |
| Create mutation: invalidates query on success | YES (queryClient.invalidateQueries) |
| Table: title, category, planned, actual, status, milestone, created | YES (code) |
| Update: PATCH API exists | YES; UI does not expose edit/update for cost items |

### Blockers

- **No auth:** Cannot navigate manager flow in browser without login.
- **Update UI absent:** Manager can create but not edit cost items in UI. Update via API only.

### Operator Action

1. Login as tenant member (manager).
2. Open project `00a104f9-b6b0-4604-84ef-71dabd9e8f54`.
3. Click Costs tab.
4. Verify: Budget & costs header, summary cards, cost items table (or empty state).
5. Click "Add cost item", fill form, submit.
6. Verify new row appears and summary updates.
7. Update: use API (PATCH) or document as future UI enhancement.

### Manager Flow Usability

- **View:** FULL (code path exists; requires auth to verify).
- **Create:** FULL (modal + API; requires auth to verify).
- **Review row/summary:** FULL (table + cards; requires auth to verify).
- **Understand status/amount/category:** FULL (UI displays all).
- **Update:** PARTIAL (API only; no UI).
