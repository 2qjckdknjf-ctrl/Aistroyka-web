# ROMA Kernel Adoption Plan

**Principle:** Staged adoption — **no mass migration**. Backward compatibility mandatory.

---

## Stage 0 — Foundation ✅ (This commit)

- [x] Create `@aistroyka/roma-kernel` package
- [x] Canonical domain types and contracts
- [x] Kernel boundary tests
- [x] Trivial re-exports in 5 module type files (legacy names preserved)
- [x] `roma-kernel-adoption.test.ts` in platform-admin
- [x] Documentation in `docs/kernel/`

**No runtime behavior changes.**

---

## Stage 1 — Executive Dashboard

- [ ] Import kernel types directly in new dashboard code paths
- [ ] Map `QualityStatus` → `RomaHealthStatus` where aligned
- [ ] Use `RomaHealthBucket` from kernel (done via re-export)
- [ ] Document component id → subsystem registry mapping

**Risk:** Low — type-only

---

## Stage 2 — Safe Audit + Audit History

- [ ] Align `RomaSafeReadonlyAudit*` shapes with `RomaAuditSnapshot`
- [ ] Redaction types reference kernel `RomaFinding` / `RomaRecommendation`
- [ ] Run history list items use kernel release/confidence types

**Risk:** Low — structural typing compatibility first

---

## Stage 3 — Engineering Intelligence

- [ ] `DecisionReason` → `RomaDecisionReason` alias or extend
- [ ] Remove duplicate `BlockerSeverity` import chain
- [ ] Intelligence output typed as `RomaDecision`

**Risk:** Medium — many tests reference intelligence types

---

## Stage 4 — Quality Graph + Test Catalog + Change Intelligence

- [ ] Graph node types alias kernel `RomaGraphNode`
- [ ] Test catalog domains use `RomaTestDomain` directly (partial — Stage 0 re-export)
- [ ] Change intelligence result uses `RomaChangeAnalysis` metadata

**Risk:** Medium — graph has runtime static data

---

## Stage 5 — Execution Planner + Engine

- [ ] Policy types reference kernel `RomaRiskLevel`, `RomaReleaseImpact`
- [ ] No execution logic moves to kernel

**Risk:** Low — policy module already isolated

---

## Stage 6 — Platform Registry Integration

- [ ] Implement `roma-platform-registry.ts` using `RomaSubsystem` from kernel
- [ ] Wire registry into executive view (Platform Integration Program Phase 2)

**Risk:** Low — additive

---

## Migration Anti-Patterns

- ❌ Big-bang replace all `*.types.ts` files in one PR
- ❌ Move probe logic into kernel
- ❌ Add Zod/runtime validation to kernel without ADR
- ❌ Break legacy type aliases before all imports updated

---

## Success Criteria per Stage

| Stage | Criterion |
|-------|-----------|
| 0 | Kernel builds; all existing tests pass; re-exports verified |
| 1–5 | Module imports kernel types for new code; legacy aliases remain |
| 6 | Platform registry uses kernel ontology exclusively |

---

## Timeline (Indicative)

| Stage | Effort |
|-------|--------|
| 0 | Complete |
| 1 | 1–2 days |
| 2 | 2 days |
| 3 | 2 days |
| 4 | 3 days |
| 5 | 1 day |
| 6 | 2 days (coordinates with Platform Integration Phase 2) |

**Total:** ~2 weeks incremental adoption (not blocking other work).
