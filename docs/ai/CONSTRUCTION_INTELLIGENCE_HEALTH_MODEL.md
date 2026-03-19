# Construction Intelligence — Health Model

**Date:** 2026-03-19  
**Implementation:** `lib/ai-brain/services/project-health-v2.service.ts` (used by GET /api/v1/projects/:id/intelligence).

---

## 1. Purpose

Transparent, explainable project health score (0–100) and label (healthy / moderate / unstable / critical) for manager consumption. All factors and impacts are visible.

---

## 2. Inputs (ProjectSnapshot)

From `snapshot.mapper`:

- workerCount (active workers)
- openReportCount (reports in draft/submitted)
- taskCount, overdueTaskCount, completedTaskCount

No strategic risk index or delay probability from external models; only these counts.

---

## 3. Formula

- **Start:** score = 100.
- **Overdue tasks:** impact = min(25, overdueTaskCount × 5). score -= impact. Factor: "Overdue tasks", explanation e.g. "N overdue task(s) × 5 each, cap 25".
- **No recent reports:** if workerCount > 0 and openReportCount === 0, score -= 15. Factor: "No recent reports".
- **Combo penalty:** if taskCount > 0 and completedTaskCount === 0 and overdueTaskCount > 0, score -= 20. Factor: "No progress + overdue".
- **Clamp:** score = max(0, min(100, round(score))).

---

## 4. Label bands

| Score | Label |
|-------|--------|
| ≥ 80 | healthy |
| ≥ 60 | moderate |
| ≥ 40 | unstable |
| < 40 | critical |

---

## 5. Outputs beyond score/label

- **blockers:** e.g. "N overdue task(s)" when overdueTaskCount > 0.
- **missingData:** e.g. "No recent reports" when workers present but no open reports.
- **delayIndicators:** e.g. "Overdue tasks" when overdueTaskCount > 0.
- **confidence:** "high" normally; "medium" when workerCount === 0 && taskCount === 0.
- **missingDataDisclaimer:** when confidence is medium, e.g. "No workers or tasks; score is based on minimal data."

---

## 6. Factor families (current)

- Reporting freshness (no recent reports penalty)
- Task execution (overdue penalty, combo penalty)
- No document/approval or budget factor in this service (could be added later with same transparent style).

---

## 7. Graceful degradation

When snapshot is null (project not found or no access), the API returns no projectHealthScore. When snapshot has no workers and no tasks, score is still computed but confidence is medium and missingDataDisclaimer is set so the manager sees that the score is based on minimal data.
