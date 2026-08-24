# Readiness PR merge order (100% program)

**Updated:** 2026-08-24  
**RC:** `v1.0.0-rc.1` @ `a7144249`

Merge after non-author `APPROVED` on each PR head.

## Approval

**Blocker:** `GITHUB_REVIEWER_TOKEN` returns HTTP 401 — `BLOCKED_EXTERNAL_REVIEWER_SESSION_REQUIRED`. Only `2qjckdknjf-ctrl` gh session active locally.

Merge order:
1. **[#240](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/240)** — code (auth + operator pack) — **primary**
2. **[#242](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/242)** — fix dual-role tenant priority (contractor loses cabinet when also stakeholder)
3. **[#241](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/241)** — docs stack (phases 3–12 reports) — docs-only

Legacy #228–#239 may close after #240/#242/#241 land.
