# Decision Log — AISTROYKA

> Lightweight ADRs for operating decisions. Newest first.

---

## 2026-06-30 — Development OS pointers

**Status:** accepted

**Decision:** `STATUS.md`, `PROJECT_DASHBOARD.md`, and `docs/agent-memory/current-focus.md` are trusted active pointers for agents. When they conflict with stale local checkouts, trust `origin/main` + these files.

**Consequences:** Agents read dashboard stack before acting; owner updates pointers at session end.

---

## 2026-06-30 — No cleanup without owner approval

**Status:** accepted

**Decision:** Branch/worktree cleanup requires dry-run → owner approval → archive tags → execution docs PR. Slice 2 is **not** approved.

**Consequences:** Slice 1 only deleted 5 local merged+archive-tagged branches; no remote/worktree/tag changes.

---

## 2026-06-30 — Dirty main worktree: preserve, do not reset

**Status:** accepted

**Decision:** The dirty `main` worktree at `AISTROYKA-release-closure` (306 files, stale HEAD) must be **preserved/audited**, not reset or fast-forwarded until owner chooses salvage/stash/clean/abandon.

**Consequences:** `SAFE_TO_FAST_FORWARD_MAIN_NOW: NO`. Audit on main: `docs/reports/DIRTY_MAIN_WORKTREE_AUDIT.md`.

---

## 2026-06-30 — origin/main is production truth

**Status:** accepted

**Decision:** `origin/main` is the canonical production branch. Local `main` may lag or be dirty; never treat occupied local `main` as truth.

---

## 2026-06-30 — Protected PR path

**Status:** accepted

**Decision:** All merges to `main` require CI Check pass + **non-author** APPROVED review. No self-approval, no bypass, no admin-merge.

**Consequences:** Use `2qjckdknjf-ctrl` keyring identity when author is `6262265-cpu`. See `docs/dev-os/PR_REVIEW_MERGE_PROTOCOL.md`.

---

## 2026-06-30 — No secrets in docs

**Status:** accepted

**Decision:** Never commit or print secrets in docs, handoffs, or agent memory. Variable **names** only in audits.

---

## Template (for future entries)

```
## YYYY-MM-DD — Title
**Status:** proposed | accepted | superseded
**Context:** ...
**Decision:** ...
**Consequences:** ...
```
