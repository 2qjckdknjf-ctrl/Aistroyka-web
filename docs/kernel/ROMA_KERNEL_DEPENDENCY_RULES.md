# ROMA Kernel Dependency Rules

**Enforcement:** Architectural — validated by `kernel-boundary.test.ts` and code review.

---

## Rule 1 — Kernel Is the Root

```
All ROMA modules → @aistroyka/roma-kernel
@aistroyka/roma-kernel → (no ROMA / web imports)
```

---

## Rule 2 — Allowed Consumer Dependencies

| Module | May import from Kernel |
|--------|------------------------|
| Executive Dashboard | severity, status, health, release, decision, evidence |
| Safe Audit | audit, evidence, findings, recommendations, release, decision |
| Audit History | audit, evidence, release, decision |
| Engineering Intelligence | decision, release, risk, findings |
| Quality Graph | graph, test, risk, dependency |
| Test Catalog | test, capability |
| Change Intelligence | change, test, risk, release, graph |
| Execution Planner | change, test, risk, release |
| Execution Engine | risk, release, capability (policy metadata) |
| Platform Registry | platform, dependency, health |

---

## Rule 3 — Forbidden Kernel Imports

Kernel **must not** import:

- `@/lib/platform-admin/*`
- `@/components/*`
- `next/*`, `react`
- `@supabase/*`
- Probe services, dashboard services, API routes

---

## Rule 4 — No Circular Types

If module A needs a type from module B:

1. Move shared shape to Kernel
2. Both modules import from Kernel
3. Never import types module-to-module for shared concepts

---

## Rule 5 — Implementation Stays in Modules

| Concern | Location |
|---------|----------|
| Type definition | Kernel |
| Probe execution | `roma-live-probes.ts` |
| Dashboard assembly | `roma-quality-dashboard.service.ts` |
| Intelligence rules | `roma-engineering-intelligence.ts` |
| UI rendering | `PlatformAdminTestingClient.tsx` |

---

## Rule 6 — Versioning

- `ROMA_KERNEL_VERSION = "1"`
- Breaking kernel changes require major version bump + staged adoption
- Module contracts declare `kernelVersion: "1"`

---

## Validation

```bash
cd packages/roma-kernel && bun run test   # boundary + kernel tests
cd apps/web && bun test lib/platform-admin/roma-kernel-adoption.test.ts
```

CI root `bun run test` builds kernel before web tests.
