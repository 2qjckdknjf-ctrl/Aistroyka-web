# Step 11 Build Hotfix — Root Cause Analysis

**Date:** 2026-03-14

---

## 1. Observed Failures

Production build (Vercel/CI) fails with module resolution errors:

- `@/lib/dashboard/priority-actions`
- `@/lib/intelligence/resource-links`
- `@/lib/dashboard/alert-fallback-href`

Import locations:
- `app/[locale]/(dashboard)/dashboard/DashboardPriorityActionsClient.tsx` → priority-actions
- `app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectIntelligenceClient.tsx` → resource-links
- `components/intelligence/AlertFeed.tsx` → alert-fallback-href
- `components/intelligence/ManagerActionView.tsx` → resource-links
- `components/intelligence/RecommendationList.tsx` → resource-links
- `components/intelligence/RiskList.tsx` → resource-links

---

## 2. Root Cause

**All three modules exist locally but were never committed to the repository.**

| Module | File Path | Git Status |
|--------|-----------|------------|
| priority-actions | `apps/web/lib/dashboard/priority-actions.ts` | **Untracked** (entire `lib/dashboard/` untracked) |
| resource-links | `apps/web/lib/intelligence/resource-links.ts` | **Untracked** |
| alert-fallback-href | `apps/web/lib/dashboard/alert-fallback-href.ts` | **Untracked** (same dir) |

`git status` output:
```
Untracked files:
  apps/web/lib/dashboard/
  apps/web/lib/intelligence/resource-links.test.ts
  apps/web/lib/intelligence/resource-links.ts
```

---

## 3. Why Local Build Passes

On the developer machine, the files exist on disk. TypeScript and Next.js resolve `@/lib/...` to the local files. The build succeeds.

---

## 4. Why Vercel/CI Fails

Vercel (and any CI) clones the repository. Untracked files are not in the clone. The imports reference modules that do not exist in the repo. Module resolution fails → build fails.

---

## 5. Ruled Out

| Hypothesis | Result |
|------------|--------|
| Wrong file path | Paths correct; files exist at expected locations |
| Wrong alias (@/) | tsconfig paths correct; baseUrl "." |
| Case-sensitivity | Filenames match imports (priority-actions, resource-links, alert-fallback-href) |
| Stale reference after Step 9 | No; these are real modules with correct implementations |
| File created but not committed | **Confirmed** |

---

## 6. Fix

Add the untracked files to the repository so they are included in the next push and available in Vercel/CI.

Files to add:
- `apps/web/lib/dashboard/priority-actions.ts`
- `apps/web/lib/dashboard/priority-actions.test.ts`
- `apps/web/lib/dashboard/alert-fallback-href.ts`
- `apps/web/lib/dashboard/alert-fallback-href.test.ts`
- `apps/web/lib/intelligence/resource-links.ts`
- `apps/web/lib/intelligence/resource-links.test.ts`
