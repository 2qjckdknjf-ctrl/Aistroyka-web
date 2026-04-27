# DELETE CANDIDATES (NO DELETION PERFORMED)

**Audit date:** 2026-04-02  
These paths may become candidates **after** a second human review. **Do not delete** as part of this audit.

| Path | Why likely deletable later | Verify before deletion | Risk if deleted early |
|------|----------------------------|-------------------------|------------------------|
| Duplicates under `archive/v1-pre-release-cleanup/` after deduplication | Same content stored twice | Compare checksums with remaining docs | Loss of incident narrative |
| Obsolete `docs/release-hardening/*` after iOS rename fully documented | Rename complete in Xcode projects | Search repo for `WorkerLite` string usage | Confusing future mobile work |
| Old `ios/Shared/.build/*` artifacts if ever committed | Build products | **Must** stay gitignored — not for manual delete in normal flow | Broken local builds |

**Policy:** Prefer **archive** over **delete** for any document that influenced a production decision.
