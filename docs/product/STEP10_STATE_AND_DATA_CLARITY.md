# Step 10 — State & Data Clarity

## Distinctions (product copy)

| State | Where surfaced | User-facing idea |
|-------|----------------|------------------|
| **Urgent project issue** | Intelligence actions, Next actions (P0/P1) | Concrete risk/delay/anomaly from analyses or API. |
| **Missing evidence** | Intelligence API / ManagerActionView | “Missing evidence” insights — not same as overdue task. |
| **Thin / low confidence** | Next actions (governance &lt; 60), operational banner | “May be unreliable” — improve inputs. |
| **Degraded intelligence** | Operational banner (trust band, disclaimers) | Model/data caveats — not an operations queue item. |
| **No data yet** | NextActions empty | “Not enough analysis history” — not “all healthy.” |
| **No ops queue items** | Operations queue empty | Explicitly **not** a health score. |
| **Stale data** | (Future) timestamps in feeds | Alerts show `created_at`. |
| **Permission-limited** | API 401/403 | Existing error states. |
| **Unsupported linkage** | Alerts without resource_id | Two safe links, no fake project URLs. |

## Rules applied in Step 10

1. Empty operations queue ≠ “no project problems.”  
2. Empty NextActions ≠ “no risks” — insufficient history.  
3. Alerts never imply row-level entity without DB support.  
4. Intelligence actions empty ≠ urgent — may be thin intelligence coverage.
