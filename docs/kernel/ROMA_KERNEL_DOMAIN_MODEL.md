# ROMA Kernel Domain Model

**Version:** 1  
**Package:** `@aistroyka/roma-kernel`

---

## Canonical Entities

### Shared primitives

| Entity | Type | Replaces (duplicates removed in Stage 1) |
|--------|------|----------------------------------------|
| `RomaEntityId` | string | ad-hoc ids across modules |
| `RomaSeverity` | enum | `BlockerSeverity`, inline finding severities |
| `RomaHealthStatus` | enum | subset of `QualityStatus` |
| `RomaMaturityStatus` | enum | `RomaQaCenterSectionStatus` (future) |
| `RomaProbeConnectionStatus` | enum | `LiveSourceStatus` |
| `RomaAuditOutcomeStatus` | enum | `RomaSafeReadonlyAuditStatus` (future) |
| `RomaImpactStatus` | enum | `ProductAreaStatus` |
| `RomaHealthBucket` | enum | `HealthBucket` |
| `RomaOwnership` | object | scattered owner strings |
| `RomaStabilityLevel` | enum | module version stability |

### Platform ontology

| Entity | Purpose |
|--------|---------|
| `RomaPlatformCategory` | applications / infrastructure / data / … |
| `RomaSubsystem` | Production subsystem metadata |
| `RomaPlatformCapability` | Capability within subsystem |
| `RomaPlatformOntology` | Registry container |

### Health & evidence

| Entity | Purpose |
|--------|---------|
| `RomaProbeRef` | Catalog probe identity |
| `RomaProbeEvidence` | Probe outcome metadata |
| `RomaComponentHealth` | Component card metadata |
| `RomaHealthSnapshot` | Point-in-time health bundle |
| `RomaEvidence` | Single evidence item |
| `RomaEvidenceBundle` | Grouped evidence |
| `RomaSignal` | Observed signal reference |

### Findings & recommendations

| Entity | Purpose |
|--------|---------|
| `RomaFinding` | Issue/finding metadata |
| `RomaFindingGroup` | Severity-grouped findings |
| `RomaRecommendation` | Action recommendation metadata |

### Release, risk, decision

| Entity | Purpose |
|--------|---------|
| `RomaReleaseDecision` | ready / not_ready / ready_with_warnings / unknown |
| `RomaReadinessLevel` | ready / partial / blocked / unknown |
| `RomaReleaseImpact` | none / low / medium / high |
| `RomaRiskLevel` | critical / high / medium / low / unknown |
| `RomaConfidence` | high / medium / low / unknown |
| `RomaConfidenceCore` | high / medium / low (intelligence subset) |
| `RomaDecisionReason` | Decision explanation metadata |
| `RomaDecision` | Release + confidence + reasons |

### Change & test

| Entity | Purpose |
|--------|---------|
| `RomaChangeSet` | Change input metadata |
| `RomaChangeAnalysis` | Change analysis output metadata |
| `RomaTestDomain` | Catalog/intelligence test domain |
| `RomaTestPriority` | p0–p3 |

### Graph

| Entity | Purpose |
|--------|---------|
| `RomaGraphNodeType` | Quality graph node kinds |
| `RomaGraphEdgeType` | Quality graph edge kinds |
| `RomaGraphNode` | Node metadata |
| `RomaGraphEdge` | Edge metadata |
| `RomaQualityGraphOntology` | Graph container |

### Audit

| Entity | Purpose |
|--------|---------|
| `RomaAuditMode` | safe_readonly / snapshot / manual |
| `RomaAuditSnapshot` | Audit result metadata shape |

### Dependency

| Entity | Purpose |
|--------|---------|
| `RomaDependencyKind` | depends_on / exposes / affects / … |
| `RomaDependency` | Directed dependency edge |
| `RomaDependencyGraph` | Graph container |

### Contracts

| Entity | Purpose |
|--------|---------|
| `RomaModuleId` | ROMA module identifier |
| `RomaModuleContract` | Adoption contract per module |
| `RomaEntityMetadata` | Generic entity documentation block |
| `ROMA_KERNEL_VERSION` | `"1"` |
| `ROMA_KERNEL_CONSUMER_MODULES` | Modules required to adopt kernel |

---

## Entity Rules

1. **Metadata only** — no methods, no validators, no Zod in v1
2. **No optional health defaults** — consumers must set explicit status or UNKNOWN
3. **Relationships via ids** — `dependencies`, `evidenceRefs`, graph edges
4. **Documentation paths** — repo-relative strings in `documentation[]`

---

## Stage 1 Re-exports (Backward Compatible)

Module type files re-export kernel types under legacy names:

| Module file | Kernel source |
|-------------|---------------|
| `roma-quality-dashboard.types.ts` | `BlockerSeverity`, `LiveSourceStatus`, `ReadinessLevel` |
| `roma-engineering-intelligence.types.ts` | `ReleaseDecision`, `ConfidenceLevel`, `ProductAreaStatus` |
| `roma-change-intelligence.types.ts` | `RomaChangeConfidence`, `RomaChangeRiskLevel`, `RomaChangeReleaseImpact` |
| `roma-test-catalog.types.ts` | `RomaTestCatalogDomain`, `RomaTestCatalogPriority` |
| `executive-dashboard-ui.ts` | `HealthBucket` |

Legacy names remain valid for all existing imports.

---

## Duplicate Discovery Summary (Phase 1)

| Concept | Duplicate locations (pre-kernel) |
|---------|----------------------------------|
| Severity | dashboard, intelligence, safe-audit, findings inline |
| Confidence | intelligence, change-intelligence, run-history |
| Risk level | change-intelligence, quality-graph criticality |
| Release decision | intelligence, safe-audit, run-history |
| Readiness | dashboard, qa-center maturity |
| Test domain | test-catalog, change-intelligence mapping |
| Health status | dashboard, safe-audit, executive UI |
| Evidence/Finding/Recommendation | safe-audit, run-history redaction, dashboard |

All unified in kernel types; full module migration staged in adoption plan.
