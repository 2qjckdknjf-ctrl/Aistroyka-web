# Wave 4 Step 18 — Executive signal shaping

## C1 — Signals

- **Project / portfolio executive posture** reuses **portfolio control state** (`healthy` | `attention` | `critical`) — same thresholds as Step 15.
- **Primary narrative** on project pack: `primaryReason` from the control row (explainable).
- **Portfolio pack header**: derived from **distribution** counts — if any critical → critical narrative; else if any attention → attention narrative; else healthy.

## C2 — Grounding

Every numeric claim traces to `ProjectSummary`, handover blockers, attention repository, or portfolio row signals — no invented metrics.

## C3 — Noise control

- Stakeholder timeline capped at **5** items.  
- Portfolio lists cap at **8** rows per column.  
- Action focus bullets capped (6 project / 5 portfolio).  

## Limitations

- Portfolio pack summarizes **sampled** projects only (`limitedTo` vs `totalProjects`).  
- English narrative strings in services for portfolio header (not i18n).  
