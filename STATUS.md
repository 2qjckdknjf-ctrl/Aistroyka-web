# STATUS — AISTROYKA

> Live project status. Keep this short and mobile-readable.

---

**Last updated:** 2026-08-23  
**Updated by:** Phase 12 Day-0 operator pack slice

## Now

| Field | Value |
|---|---|
| RC tag | **`v1.0.0-rc.1`** @ `a7144249` |
| Phase 12 launch | **NO** — `BLOCKED_EXTERNAL` (real intake) |
| Active work | Operator pack PR — intake validate + Day-0 runbooks on `main` |
| Next owner action | Fill `docs/launch/pilot-intake.real.local.json` → `bun run pilot:intake:validate` |

## Operator quick start

```bash
cp docs/launch/pilot-intake.template.json docs/launch/pilot-intake.real.local.json
# edit with real client data (never commit)
bun run pilot:intake:validate -- docs/launch/pilot-intake.real.local.json
```

Synthetic rehearsal: `docs/launch/pilot-intake.example.json` → **READY** (`example.com` only).

---

*100% Readiness program.*
