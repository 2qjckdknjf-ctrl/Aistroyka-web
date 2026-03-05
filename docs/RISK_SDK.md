# Risk Scoring SDK — History & Trend

Web and iOS SDK methods for risk score **history** (sparklines) and **trend** (24h/7d deltas). Existing methods (`getProjectRisk`, `subscribeProjectRisk`) are unchanged.

---

## Web (`apps/web/lib/services/aiSignature.ts`)

### Types

- **RiskScoreHistoryRow** — One row from `ai_risk_score_history`: `project_id`, `schedule_risk`, `cost_risk`, `event_risk`, `quality_risk`, `total_score`, `calculated_at`.
- **RiskTrendRow** — Result of `get_risk_trend` RPC: `score_now`, `score_24h`, `score_7d`, `delta_24h`, `delta_7d`, `velocity_24h`, `velocity_7d` (all nullable numbers).

### Methods

| Method | Description |
|--------|-------------|
| **getProjectRiskHistory(projectId?, options?)** | Fetch history rows for sparklines. `options`: `{ from?: string, to?: string, limit?: number }`. Default limit 30, max 200. Order: `calculated_at` ascending. |
| **getProjectRiskTrend(projectId?)** | Call `get_risk_trend` RPC; returns `RiskTrendRow \| null`. `projectId = null/undefined` = portfolio. |
| **subscribeProjectRiskHistory(projectId?, callback, options?)** | Poll history every `intervalMs` (default 60_000). `options`: `{ limit?: number, intervalMs?: number }`. Returns unsubscribe function. |

Existing: `getProjectRisk`, `subscribeProjectRisk` unchanged.

---

## iOS (`ios/Aistroyka/Core/AI/AISignatureService.swift`)

### Types

- **RiskScoreHistoryRow** — Same shape as web (Swift properties: `projectId`, `scheduleRisk`, …).
- **RiskTrendRow** — `scoreNow`, `score24h`, `score7d`, `delta24h`, `delta7d`, `velocity24h`, `velocity7d` (optionals).

### Protocol & implementation

- **getRiskHistory(projectId: UUID?, from: Date?, to: Date?, limit: Int?)** — Returns `[RiskScoreHistoryRow]`. Limit capped at 200; default 30.
- **getRiskTrend(projectId: UUID?)** — Calls `get_risk_trend` RPC; returns `RiskTrendRow?`. `projectId = nil` = portfolio.

Existing: `getProjectRisk`, `subscribeProjectRisk` unchanged.

---

## Backend

- **History:** Table `ai_risk_score_history`; RLS same as `ai_risk_scores`. Producer writes snapshots; 90-day retention.
- **Trend:** RPC `get_risk_trend(p_project_id uuid)` — see `docs/RISK_TREND_QUERIES.md`.

---

## Related

- Schema: `docs/RISK_HISTORY_SCHEMA.md`
- Producer: `docs/RISK_HISTORY_PRODUCER.md`
- Trend RPC: `docs/RISK_TREND_QUERIES.md`
