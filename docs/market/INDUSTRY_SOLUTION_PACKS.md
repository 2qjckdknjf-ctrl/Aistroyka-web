# Industry Solution Packs

**Phase 10 — Market Expansion & Revenue Scaling**  
**Templates and workflows by industry; reuse platform capabilities.**

---

## Overview

Each industry pack is a **template set** (default project types, task structures, reporting workflows, KPI definitions, AI presets, and demo datasets). No core domain rewrite; packs are configuration and content that can be applied when creating a tenant or project.

---

## 1. Residential Construction

- **Default project templates:** Single-family, multi-unit residential, custom home. Phases: foundation, framing, MEP, finish, punch.
- **Task structures:** Daily site check, safety walk, trade completion (electrical, plumbing, HVAC), inspection prep, client walkthrough.
- **Reporting workflows:** Photo report per phase; manager approves before next phase; optional client-facing summary.
- **KPI dashboards:** Tasks completed per week, report turnaround (submit → review), open items, phase-on-time %.
- **AI presets:** “Defect or deviation” on photos; “Summary for client” on report batch.
- **Demo dataset:** One residential project, 3 phases, 10 tasks, 5 sample reports (staging only).

---

## 2. Commercial Construction

- **Default project templates:** Office, retail, warehouse, mixed-use. Phases: permit, shell, core, fit-out, commissioning.
- **Task structures:** Daily log, safety/Osha-style check, trade coordination, RFI tracking, closeout.
- **Reporting workflows:** Daily superintendent report; trade completion with photo; manager review and archive.
- **KPI dashboards:** Reports per project per week, review turnaround, open RFIs, days to closeout.
- **AI presets:** “Safety hazard” flag on photos; “Daily summary” for stakeholders.
- **Demo dataset:** One commercial project, 2 phases, 15 tasks, 8 reports (staging).

---

## 3. General Contracting

- **Default project templates:** Generic “GC project”; phases configurable (e.g. preconstruction, construction, closeout).
- **Task structures:** Subcontractor task, inspection, delivery, change order support, punch list.
- **Reporting workflows:** Sub submits report; GC reviews; optional owner view (viewer role).
- **KPI dashboards:** Sub performance (on-time report, first-time approval), GC review time, open punch.
- **AI presets:** “Quality check” on photos; “Punch list item” detection.
- **Demo dataset:** One GC project, multiple subs (as workers), 20 tasks, 10 reports (staging).

---

## 4. Renovation & Fit-out

- **Default project templates:** Interior renovation, tenant fit-out, refurbishment. Phases: demo, rough-in, finish, handover.
- **Task structures:** Area completion (room/zone), trade sign-off, snag list, client sign-off.
- **Reporting workflows:** Per-area or per-room report; before/after photos; manager approval for handover.
- **KPI dashboards:** Areas completed, snag closure rate, client sign-off cycle time.
- **AI presets:** “Before/after” comparison note; “Snag” detection on photo.
- **Demo dataset:** One fit-out project, 4 areas, 12 tasks, 6 reports (staging).

---

## 5. Development & Investment

- **Default project templates:** Portfolio project, asset under development. Phases: pre-dev, construction, stabilization.
- **Task structures:** Progress report, budget/actual check, risk item, investor update.
- **Reporting workflows:** Field report → manager review → optional export for investor pack.
- **KPI dashboards:** Report volume, review time, export usage; optional high-level “portfolio health.”
- **AI presets:** “Risk or delay” hint on report; “Executive summary” for report batch.
- **Demo dataset:** One development project, 3 phases, 8 tasks, 4 reports (staging).

---

## Implementation notes

- **Delivery:** Packs are JSON or DB seed: project_template, task_templates, default_report_statuses, dashboard_config, ai_preset_ids. Apply on tenant create or “Apply industry pack” in admin.
- **Demo datasets:** Staging-only tenants with pre-filled projects, tasks, and reports for demo and training; see DEMO_AND_SALES_KIT.
- **Customization:** Tenant can modify tasks and phases after applying pack; pack is starting point only.
- **No code change:** All of the above are data and config; platform already supports projects, tasks, reports, roles, and AI; packs only define defaults.
