# Wave 4 Step 11 — Impact modeling report (Stage D)

## D1. Schedule impact

**Level** (`schedule_impact_level`, required):

- `none` — no schedule effect
- `minor_shift` — small adjustment
- `deadline_shift` — meaningful date movement
- `major_shift` — large replan

**Summary** (`schedule_impact_summary`, optional text) — human explanation.

**Numeric hint** (`schedule_delta_days`, optional integer) — indicative days (not a full scheduling engine).

## D2. Budget impact

**Level** (`budget_impact_level`, required):

- `none`
- `minor_increase`
- `major_increase`
- `tbd` — impact not yet quantified

**Summary** (`budget_impact_summary`, optional text).

**Numeric hint** (`budget_delta_amount`, optional decimal) — indicative amount in project currency context (no ERP posting).

## D3. Limitations

- No automatic recalculation of project totals or milestone Gantt.
- No integration with external estimating tools.
- Levels + summaries are the **primary** explainable contract for stakeholders; numbers are **hints**.
