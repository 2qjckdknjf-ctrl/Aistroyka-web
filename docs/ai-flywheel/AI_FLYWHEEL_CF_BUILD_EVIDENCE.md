# AI Flywheel CF Build Evidence

**Date:** 2026-06-17  
**Sprint:** P2 Hardening

## CI path (authoritative)

`.github/workflows/ci-check.yml` step **Cloudflare bundle (no deploy)**:

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: https://vthfrxehrursfloevnlp.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING }}
  NEXT_PUBLIC_APP_URL: https://staging.aistroyka.ai
run: bun run cf:build
```

Root script: `package.json` → `cf:build` → `build:contracts` + `apps/web cf:build`.

## Local reproduction (2026-06-17)

```bash
export PATH="$HOME/.bun/bin:/usr/bin:/bin"
export NEXT_PUBLIC_SUPABASE_URL="https://vthfrxehrursfloevnlp.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="<staging anon key>"
export NEXT_PUBLIC_APP_URL="https://staging.aistroyka.ai"
cd /Users/alex/Projects/AISTROYKA
bun run cf:build
```

**Result:** exit 0  
**Artifacts:** `.open-next/worker.js`, OpenNext bundle complete, patch scripts applied.

## Prior local blocker (resolved)

| Issue | Mitigation |
|-------|------------|
| Volta x86 bun breaks vitest | `PATH="$HOME/.bun/bin:..."` |
| `npm prebuild` chain when using root `bun run build` | Use `next build` directly or full `cf:build` from repo root |
| Missing `NEXT_PUBLIC_*` at build time | Required for OpenNext client bundle (same as CI) |

## Verdict

**cf:build proven:** YES (local 2026-06-17 + CI job on every PR)

Does not deploy; validates Workers/OpenNext compatibility only.
