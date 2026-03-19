# B5 — Search-based validation — Aistroyka

**Date:** 2026-03-16

---

## 1. api-client not in web runtime

```text
rg "@aistroyka/api-client" apps/web --glob "*.ts" --glob "*.tsx"
```

**Result:** **0 matches** in application TS/TSX (README/docs only elsewhere).

**Verdict:** No misleading “web depends on api-client” in code.

---

## 2. Env governance — forbidden strict claim

Searched architecture docs for phrases implying *only* `lib/config` may read env (none found as policy). B2.2 explicitly allows exceptions.

**Verdict:** No reverted “strict single funnel only” claim in CORE_B* set.

---

## 3. WorkerLite as *current* product (authoritative subset)

```text
rg "WorkerLite|Worker Lite" docs/architecture/CORE_B*.md AGENTS.md
```

**Result:** References frame **legacy**, **archival**, or **historical** (B3/B4 mobile cleanup).

**Verdict:** Authoritative CORE + AGENTS do not present WorkerLite as primary current app.

---

## 4. Manager/Worker confusion (release audit)

Prior B4 fix: `03_FEATURE_READINESS_MATRIX.md` Manager row → AiStroykaManager.

```text
rg "Manager app.*AiStroykaWorker" docs/release-audit
```

**Result:** **No matches.**

---

## 5. Phantom paths in authoritative map

```text
rg "engine/Aistroyk" docs/SYSTEM_REPOSITORY_MAP.md
```

**Result:** **No matches** (removed in B4).

---

## 6. engine/Aistroyk in broader docs

```text
rg "engine/Aistroyk" docs --glob "*.md" | wc -l
```

**Result:** **Many** hits in `docs/status/`, enterprise plans, infrastructure notes — paths **not on disk** at repo root.

**Verdict:** **Contained exception** — not in SYSTEM_REPOSITORY_MAP or B5 authoritative closure set; labeled stale in `CORE_B5_REPO_TRUTH_VALIDATION.md`.

---

## 7. Misleading product naming in key docs

- `02_ARCHITECTURE_AUDIT.md` still says “AISTROYKA platform” in title — **title shorthand**; body aligns with layered architecture. Acceptable.

---

## Summary

| Marker | Status |
|--------|--------|
| api-client in apps/web | Absent |
| WorkerLite in CORE/AGENTS | Legacy-framed |
| Phantom engine in map | Absent |
| engine in status dossiers | Stale — documented |
