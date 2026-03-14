# Design Release Rollback

## Stage I — Rollback Safety

### Release Commit

- **Hash:** cff3b26e
- **Message:** feat(design): publish brand system, website redesign, and asset updates

### Previous Good Commit

- **Hash:** 9e85d446
- **Message:** fix(vercel): isolate Cloudflare adapter from Vercel build path

### Safe Revert Procedure

```bash
# Option A: Revert (creates new commit, preserves history)
git revert cff3b26e --no-edit
git push origin ops/external-setup-attempt

# Option B: Reset (rewrites history — use only if branch not shared)
# git reset --hard 9e85d446
# git push --force-with-lease origin ops/external-setup-attempt  # AVOID per AGENTS.md
```

Prefer **Option A** (revert).

### Key Files for Rollback

- apps/web/lib/design/
- apps/web/app/design-tokens.css, globals.css, layout.tsx
- apps/web/components/public/, components/brand/, components/ui/
- apps/web/public/brand/, favicon*
- apps/web/package.json, package-lock.json
