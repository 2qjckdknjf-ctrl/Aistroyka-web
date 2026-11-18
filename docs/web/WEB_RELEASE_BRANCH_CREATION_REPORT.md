# WEB Release Branch Creation Report

**Date:** 2026-06-20  
**Branch:** `release/web-pilot-rc`  
**Remote:** `origin/release/web-pilot-rc` (pushed)

---

## Decision

| Item | Choice |
|------|--------|
| Base | `origin/main` @ `ff537c8` — latest stable backend/security/stage2.2 reconciliation |
| Design source | `feature/unified-product-design-certification` (design commits only) |
| Mobile RC | **`release/mobile-pilot-rc` preserved separately** — not merged into web RC |
| Billing/account | Stage 2.5 stash **excluded** |

---

## Branch tip

```
9d6a7812 design: apply Liquid Glass across web app surfaces
```

**23 commits** ahead of `origin/main`  
**Diff:** 269 files, +21413 / −2568

---

## Commits included (design path)

Cherry-picked LG foundation through public site certification + dashboard/auth glass:

- `2be0c0a5` … `9d6a7812` (21 design commits — see `WEB_BRANCH_INVENTORY.md`)

Equivalent to unified branch commits through `1338605b` (design apply across web surfaces).

---

## Explicitly excluded

| Item | Reason |
|------|--------|
| `9baceb73` Expert Review Queue MVP | ai-flywheel — not web pilot scope |
| `a956c8a3` Gold Memory MVP | ai-flywheel |
| `7b5654a0` Flywheel feedback gating | ai-flywheel |
| `6d45608b` Pilot Android certification | Mobile/ios/android/docs — use `release/mobile-pilot-rc` |
| `38e0d705` RBAC architecture audit doc | Docs-only; optional |
| `stash@{0}` stage2/billing WIP | Incomplete account cutover |
| Stage 2.5 / marketplace / client-led projects | Per mission scope |

---

## Conflict resolution (during cherry-pick)

- Removed flywheel-only UI files not on main: `AdminExpertReviewClient`, `AdminAiTrainingConsentClient`, `CopilotOptionalFeedback`
- `CopilotChatPanel.tsx`: kept mainline (no flywheel feedback block)

---

## Mistake corrected

- Initial cherry-pick of `6d45608b` brought mobile/ios/android artifacts → **reverted** with `git reset --hard 9d6a7812`
- Did **not** commit broad `apps/web` checkout from pilot commit

---

## Untracked artifacts cleaned from working tree

Removed local flywheel directories and export WIP that were not part of RC commits (see `WEB_REPAIR_REPORT.md` for gitignore note).

---

## Push status

```
git push -u origin release/web-pilot-rc
# → new branch on github.com:2qjckdknjf-ctrl/Aistroyka-web
```

---

## Next steps

1. CI Check on PR from `release/web-pilot-rc` → `main` (or dispatch staging deploy)
2. Staging deploy + runtime verification
3. Production dispatch after staging PASS
