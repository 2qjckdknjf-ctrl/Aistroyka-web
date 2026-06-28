# 02 — Health / Build Stamp

**Date:** 2026-06-28  
**URL checked:** `https://aistroyka.ai/api/v1/health`  
**Method:** `curl -L --max-time 20 -sS`

---

## Result

| Field | Value |
|-------|-------|
| HTTP status | **200** (`HTTP/2 200`) |
| Server | `cloudflare` |
| `env` | `production` |
| `ok` | `true` |
| `db` | `ok` |
| `supabaseReachable` | `true` |
| `serviceRoleConfigured` | `true` |
| **`buildStamp.sha7`** | **`bc992b7`** |
| `buildStamp.buildTime` | `2026-06-26 15:57` |

Raw body:

```json
{"ok":true,"db":"ok","aiConfigured":true,"openaiConfigured":true,"supabaseReachable":true,"serviceRoleConfigured":true,"env":"production","buildStamp":{"sha7":"bc992b7","buildTime":"2026-06-26 15:57"}}
```

## Comparison to current main

| Source | SHA (short) |
|--------|-------------|
| `origin/main` (base of this branch) | `bc992b72` |
| Production `buildStamp.sha7` | `bc992b7` |

**`bc992b7` is the 7-char prefix of `bc992b72598c…`.** → **MATCH.**

## Deployed SHA verification

- **Deployed SHA verified: YES** — production build stamp matches current main short SHA.
- Production was deployed **2026-06-26 15:57** (build time), i.e. it advanced past
  the prior `ff537c8` observation to current main.

**Safe statement:** production runtime build stamp equals current main. This is
positive evidence that **latest main is deployed** (verified via build stamp). It
does **not** by itself prove any particular UI feature (e.g. Liquid Glass) is
present — see `01` and `03`.
