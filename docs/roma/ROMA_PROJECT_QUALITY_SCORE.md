# ROMA — Project Quality Score (PQS)

**Document ID:** ROMA-PQS-001  
**Version:** 1.0 (pqs_v1)  
**Date:** 2026-07-03  
**Canonical source:** `docs/roma/adr/ADR-0001-PQS-CANONICAL-WEIGHTS.md`  
**Parent:** `ROMA_CORE_SPEC.md`

---

## 1. Purpose

Operational specification for computing and interpreting the Project Quality Score. Automation and council briefs MUST use this document and ADR-0001 — not informal tables in other ROMA docs.

---

## 2. Canonical Formula

```
PQS = Σ (weight_i × score_i)   for i in 10 categories

score_i:
  YES     → 1.0
  UNKNOWN → unknown_penalty (default 0.3)
  NO      → 0.0

Maximum PQS = 100
```

### Category table (pqs_v1)

| ID | Category | Weight |
|----|----------|--------|
| CAT-FUNC | Functional correctness | 16 |
| CAT-BCK | Backend / API reliability | 11 |
| CAT-SEC | Security / RBAC / tenant isolation | 14 |
| CAT-AI | AI safety / reliability | 11 |
| CAT-MOB | Mobile readiness | 12 |
| CAT-DES | Design / responsive quality | 8 |
| CAT-A11Y | Accessibility | 7 |
| CAT-PERF | Performance | 8 |
| CAT-OBS | Observability | 5 |
| CAT-REL | Release readiness | 8 |
| | **Total** | **100** |

### Domain → category mapping

| Domain verdict key | Category |
|--------------------|----------|
| `DASHBOARD_READY` + core journeys | CAT-FUNC |
| `BACKEND_READY`, `DATABASE_READY` | CAT-BCK (split: 70% backend, 30% DB internal) |
| `SECURITY_READY`, `RBAC_READY`, `TENANT_ISOLATION_READY` | CAT-SEC (single category score = worst of three) |
| `AI_READY` | CAT-AI |
| `MOBILE_IOS_READY` (7), `MOBILE_ANDROID_READY` (5) | CAT-MOB |
| `PUBLIC_SITE_READY` layout/responsive slices | CAT-DES |
| `ACCESSIBILITY_READY` | CAT-A11Y |
| `PERFORMANCE_READY` | CAT-PERF |
| `OBSERVABILITY_READY` | CAT-OBS |
| `CI_READY`, REL orchestration health | CAT-REL |

---

## 3. Score Ranges

| PQS | Label | Interpretation |
|-----|-------|----------------|
| 85–100 | Strong | Council may GO if R0=0 and gates pass |
| 70–84 | Adequate | Typical CONDITIONAL GO band |
| 55–69 | Weak | Pilot-only or NOT READY for production |
| 0–54 | Critical | NOT READY |

---

## 4. UNKNOWN Effect

- Each UNKNOWN category contributes `weight × 0.3` instead of full weight.
- **Example:** CAT-SEC (14) UNKNOWN → 4.2 points instead of 14.
- Three UNKNOWN domains can drop PQS by ~30+ points — intentional honesty tax.
- `unknown_penalty` change requires ADR amendment.

Reports MUST list `unknown_categories[]` with reasons.

---

## 5. P0 / P1 Effect on Score

| Finding | PQS math | Release |
|---------|----------|---------|
| **P0 / R0 open** | PQS still computed | `RELEASE_READY = NO_GO` regardless of PQS |
| **P1 open** | PQS still computed | GO only via CONDITIONAL GO |
| **P2/P3** | No formula change | Advisory in council brief |

PQS is **necessary but not sufficient** for GO.

---

## 6. Minimum Release Thresholds

| Target | Min PQS | Additional gates |
|--------|---------|------------------|
| **Production GO** | 70 | R0=0, P0=0, required domains not UNKNOWN (ADR-0002) |
| **Pilot expansion** | 55 | R0=0, staging T1 green, finance isolation when prod touched |
| **Internal staging deploy** | None (PQS advisory) | Existing pilot-smoke + ci-check |
| **CONDITIONAL GO** | 60–69 | Council approval + documented P1 mitigations |

---

## 7. Pilot vs Production

| Dimension | Pilot | Production |
|-----------|-------|------------|
| PQS floor | 55 | 70 |
| UNKNOWN domains allowed | ≤5 | ≤3 for required domains |
| AI_READY | UNKNOWN acceptable for non-AI releases | YES when AI routes changed |
| MOBILE_ANDROID | UNKNOWN with council note | YES or explicit defer ADR |
| Finance isolation test | Staging only | **Required** on prod promotion |

---

## 8. Example Calculation

| Category | Verdict | Points |
|----------|---------|--------|
| CAT-FUNC | YES | 16.0 |
| CAT-BCK | YES | 11.0 |
| CAT-SEC | UNKNOWN | 4.2 |
| CAT-AI | UNKNOWN | 3.3 |
| CAT-MOB | NO | 0.0 |
| CAT-DES | YES | 8.0 |
| CAT-A11Y | YES | 7.0 |
| CAT-PERF | YES | 8.0 |
| CAT-OBS | YES | 5.0 |
| CAT-REL | YES | 8.0 |
| **PQS** | | **70.5** |

→ Adequate band; production GO still requires SEC/AI/MOB resolved per ADR-0002.

---

## 9. Versioning

- Current: `pqs_v1`
- Embedded in `run_meta.json` as `pqs_version: "pqs_v1"`
- Changes → `ADR-0001` amendment + bump to `pqs_v2`

---

## Document Control

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-07-03 | Initial PQS spec aligned to ADR-0001 |
