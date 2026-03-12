# Performance and Load Testing

**Phase 9 — Scale Infrastructure**  
**Load strategy, scenarios, and targets.**

---

## Load test scenarios

| Scenario | Path / flow | Goal |
|----------|-------------|------|
| **Auth** | POST /api/auth/login (valid credentials); session refresh if applicable. | Throughput and p95 under concurrent logins; no 429 storm from IP limit. |
| **Tasks** | GET /api/v1/tasks, GET /api/v1/worker/tasks/today; POST /api/v1/tasks/:id/assign. | Read and write latency under load; DB index usage. |
| **Reports** | POST /api/v1/worker/report/submit (minimal body); GET report list. | Submit throughput; job enqueue and processing tail latency. |
| **Uploads** | POST /api/v1/media/upload-sessions; POST finalize (small payload or mock). | Session create and finalize under concurrency; body size limit (1 MB) respected. |
| **Sync** | GET /api/v1/sync/changes (with cursor); POST /api/v1/sync/ack. | Sync throughput per tenant; cursor and retention behavior under load. |
| **AI** | POST /api/v1/ai/analyze-image (or legacy route) with small image URL. | Rate limit and circuit behavior; p95 and error rate; cost awareness. |
| **Mixed** | Combined: N tenants × (login, sync, report submit, task assign) over 5–10 min. | Realistic mix; identify bottlenecks (DB, rate limit, job queue). |

---

## Concurrency profiles

- **Baseline:** 10 concurrent users (2 tenants × 5 users); 1 req/sec per user approximate.
- **Growth:** 50 concurrent users (10 tenants × 5); 2 req/sec per user.
- **Peak:** 200 concurrent users (40 tenants × 5); sustain for 5 min; then ramp down.
- **Spike:** 2× peak for 1 min (burst); measure recovery and queue depth.
- **Sustained:** 100 concurrent users for 30 min; check for memory or connection drift.

---

## Target capacity thresholds

| Metric | Baseline (10 users) | Growth (50 users) | Peak (200 users) |
|--------|---------------------|-------------------|-------------------|
| **Throughput** | ≥ 10 req/s aggregate | ≥ 50 req/s | ≥ 100 req/s (saturate or target) |
| **Success rate** | ≥ 99.5% | ≥ 99.5% | ≥ 99% |
| **p95 latency (non-AI)** | ≤ 2s | ≤ 3s | ≤ 5s |
| **p95 latency (AI)** | ≤ 30s | ≤ 45s | ≤ 60s (or skip at peak) |
| **Job completion** | 95% within 5 min | 95% within 5 min | 90% within 10 min |
| **Rate limit (429)** | < 1% of requests | < 2% | < 5% (acceptable under burst) |

---

## p95 latency targets

| Route / flow | Target p95 |
|--------------|------------|
| POST /api/auth/login | ≤ 2s |
| GET /api/v1/sync/changes | ≤ 1.5s |
| POST /api/v1/sync/ack | ≤ 1s |
| POST /api/v1/worker/report/submit | ≤ 2s |
| POST /api/v1/tasks/:id/assign | ≤ 1.5s |
| GET /api/v1/notifications | ≤ 1s |
| POST /api/v1/media/upload-sessions | ≤ 1s |
| POST /api/v1/media/upload-sessions/:id/finalize | ≤ 3s |
| POST /api/v1/ai/analyze-image | ≤ 30s (provider-bound) |

---

## Error rate targets

- **Overall:** 5xx < 0.5% over test window; 4xx (excluding 429) < 2%.
- **429:** Document and accept under burst; target < 5% at peak.
- **Timeout:** 0% for non-AI; AI may have timeouts; document threshold.

---

## Recommended tools and scripts

- **Tool options:** k6, Artillery, or Postman/Newman for API load; JMeter if preferred. Use scriptable scenarios (auth token → sync → report → etc.).
- **Scripts:**  
  - **auth_flow.js:** Login; capture token; optional refresh.  
  - **sync_flow.js:** Changes + ack in loop with cursor.  
  - **report_flow.js:** Submit report (minimal payload); check 200.  
  - **mixed.js:** Per-tenant script: login, then mix of sync, report, task list; run N tenants in parallel.
- **Environment:** Run against staging or dedicated load-test env; use test tenants and test data; do not run against production without explicit approval and throttling.
- **CI:** Optional: run smoke load (e.g. 5 users, 1 min) in CI after deploy; fail if success rate < 98% or p95 > 5s for critical route.

---

## Simulating critical paths

- **Critical path 1:** Login → GET projects → GET tasks → POST report submit → GET sync changes → POST sync ack. Measure end-to-end time and success rate.
- **Critical path 2:** Manager: login → GET tasks → POST task assign → GET reports. Worker: login → GET tasks/today → POST report submit. Run both in parallel; measure full-loop latency.
- **Critical path 3:** Upload session create → (external upload to storage if applicable) → finalize. Measure session create + finalize p95 and 413 handling for oversized body.

---

## Documentation

- Store scenarios and scripts in repo (e.g. `tests/load/` or `scripts/load/`) with README.
- Document how to run (env vars, base URL, tenant credentials), and how to interpret results (success rate, p95, error breakdown).
- After each run, record: date, scenario, concurrency, duration, success rate, p95 per route, and any failures. Use for capacity planning and regression.
