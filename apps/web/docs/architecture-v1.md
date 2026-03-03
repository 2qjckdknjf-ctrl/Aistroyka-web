# Aistroyka Architecture v1 (Freeze)

**Status:** Production stabilization freeze. No structural changes without explicit architecture review.

---

## 1. System layers

| Layer | Responsibility | Location |
|-------|----------------|----------|
| **UI** | React pages, forms, intelligence blocks, polling UI | `app/`, components |
| **API** | Next.js route handlers: create project, upload, trigger job, poll status | `app/api/` |
| **AI / Intelligence** | Projection, risk, health, evidence, simulation (deterministic, web-side) | `lib/intelligence/` |
| **Data access** | Supabase client, RPC wrappers, engine contract | `lib/supabase/`, `lib/api/` |
| **Engine** | Job queue, analysis worker, RPCs | External `engine/` |
| **Storage** | Supabase Storage bucket `media`; Postgres: projects, media, analysis_jobs, ai_analysis, tenants | Supabase |

---

## 2. Data flow

1. **User** → Auth (Supabase Auth); session via cookies, middleware `updateSession`.
2. **Create project** → `POST /api/projects` → default tenant → insert `projects`.
3. **Upload** → `POST /api/projects/[id]/upload` → storage `media`, insert `media`, then `create_analysis_job(tenant_id, media_id)`.
4. **Trigger analysis** → load project + media server-side → `create_analysis_job(media.tenant_id, media_id)`.
5. **AI processing** → **Unified (recommended):** Set `AI_ANALYSIS_URL` to the same app, e.g. `http://localhost:3000/api/ai/analyze-image`, and `OPENAI_API_KEY` for OpenAI Vision. Then `POST /api/analysis/process` (triggered after upload and on poll) runs one job: dequeue → `claim_job_execution` → `POST /api/ai/analyze-image` (OpenAI gpt-4o) → `complete_analysis_job`. No separate worker. **Alternative:** External worker `engine/Aistroyk` runs `npm run worker` with same `AI_ANALYSIS_URL` (can point to this app or to another AI service).
6. **Web** → project page loads via Supabase; polling returns job status; UI renders intelligence from `ai_analysis` history.

---

## 3. Intelligence pipeline

1. **Analysis history** → `AnalysisSnapshot[]` from `ai_analysis`.
2. **Governance** → `computeGovernance(latest, previous)` → confidence, anomalies.
3. **Projection** → `computeProjection(history)` → velocity, forecast, delay probability, slowdown trend.
4. **Strategic risk** → `computeStrategicRisk(...)` → strategic risk index 0–100, classification, active drivers.
5. **Time-weighted** → `computeTimeWeighted(history, strategicRiskIndex)` → health adjustment, persistence flags.
6. **Health score** → `computeHealthScore(...)` → 0–100, classification, executive summary.
7. **Evidence** → `buildEvidencePack(...)` → EvidencePack (drivers, timeline, anomalies, escalation).
8. **Simulation** → `runSimulation(...)` → baseline / acceleration / degradation scenarios.

---

## 4. Risk computation chain

- **Input:** Latest `ai_analysis` + previous snapshot.
- **Governance** → confidence score, regression/jump/logical flags.
- **Projection** → slowdown trend, delay probability.
- **Strategic risk** → base from risk_level + modifiers → index 0–100, Stable/Watch/Critical, active drivers.
- **Health score** → 100 − risk/confidence/delay/slowdown/anomaly penalties → 0–100, Healthy/Moderate/Unstable/Critical.

---

## 5. Simulation layer

- **Input:** Current completion, effective velocity, strategic risk index, health score, delay probability, reference date.
- **Scenarios:** Baseline, Acceleration (+20% velocity), Degradation (−30% velocity).
- **Output:** Per scenario: projected date, days to completion, projected risk/health; deltas vs baseline. Shown in **Advanced** section only.

---

## 6. Evidence logic

- **EvidencePack:** risk drivers, timeline deltas, anomaly references, escalation path, confidence context.
- **buildEvidencePack** consumes project, analyses, strategic drivers, projection, time-weighted flags, governance.
- **UI:** Evidence block is **collapsible** (details/summary).

---

## 7. Out of scope (v1 freeze)

- Per-user tenant isolation; RLS enforcing tenant (current: application-level only).
- Billing, roles, notifications, mobile.
