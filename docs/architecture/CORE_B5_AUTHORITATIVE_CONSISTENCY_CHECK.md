# B5 — Authoritative doc consistency check — Aistroyka

**Date:** 2026-03-16

**Corpus checked:**  
`CORE_B1_ARCHITECTURE_DRIFT_AUDIT.md`, `CORE_B2_2_ENV_GOVERNANCE_AUDIT.md`, `CORE_B3_*` (inventory, decisions, post-audit), `CORE_B4_CANONICAL_NAMING.md`, `CORE_B4_POST_AUDIT.md`, `docs/release-hardening/ENVIRONMENT_READINESS.md`, `docs/release-audit/02_ARCHITECTURE_AUDIT.md`, `docs/SYSTEM_REPOSITORY_MAP.md`, `AGENTS.md`.

---

## 1. Env governance

| Source | Claim |
|--------|--------|
| `lib/config/index.ts` | Canonical declaration + exceptions for middleware, providers, debug. |
| B2.2 audit | Same model; lists concrete `process.env` sites. |
| `02_ARCHITECTURE_AUDIT.md` §2 | States `lib/config` canonical; scattered reads per B2.2. |
| `ENVIRONMENT_READINESS.md` | Product naming B4; env keys not renamed. |

**Verdict:** **Consistent.** No doc claims “all env only in lib/config.”

---

## 2. API surface

| Source | Claim |
|--------|--------|
| B1 | Dual surface `/api/*` vs `/api/v1/*`; prefer v1 for new work. |
| B2.1 policy (if present) | Canonical v1 story. |
| SYSTEM_REPOSITORY_MAP §3 | Lists legacy + v1 paths. |

**Verdict:** **Consistent** — all acknowledge legacy + v1 coexistence.

---

## 3. api-client + root lib

| Source | Claim |
|--------|--------|
| B3 post-audit | api-client PARTIAL, not web runtime; root lib legacy duplicate. |
| B4 package doc | SDK optional; not apps/web runtime. |
| SYSTEM_REPOSITORY_MAP | api-client optional SDK; root `lib/` legacy note. |
| AGENTS | Mobile/shared boundaries; no contradiction on api-client. |

**Verdict:** **Consistent** after B5 repair of corrupted `CORE_B3_API_CLIENT_DECISION.md` (literal `\n` / patch artifact removed).

---

## 4. Naming

| Source | Claim |
|--------|--------|
| AGENTS + B4 canonical | Aistroyka, aistroyka.ai, AiStroykaManager/Worker, WorkerLite legacy. |
| B1/B2 headers | Still say “AISTROYKA” in **document titles only** — shorthand, not conflicting product definition. |

**Verdict:** **Acceptable** — B4 defines prose canonical; older audit titles are filename/title convention, not competing policy.

---

## 5. Contradictions found

| Issue | Severity | Resolution |
|-------|----------|------------|
| `CORE_B3_API_CLIENT_DECISION.md` + `CORE_B3_POST_AUDIT.md` contained patch corruption (`\n*** End Patch`) | High (unreadable / unprofessional) | **Fixed in B5** (Stage E). |
| `CORE_B4_NAMING_VALIDATION.md` implied no `engine/Aistroyk` anywhere in docs | Medium (overclaim) | **Corrected in B5** to distinguish authoritative map vs stale status docs. |

---

## 6. Stronger closure than reality?

- No authoritative doc claims B3 api-client is “fully integrated” or B1 drift “eliminated.”  
- B3/B4 post-audits explicitly **PARTIAL** where appropriate.

**Overall:** Authoritative architecture set is **internally aligned** after B5 doc fixes.
