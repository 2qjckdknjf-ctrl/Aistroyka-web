# Deploy Pipeline — Phase 1: Git Restoration

**Date:** 2026-03-03

---

## 1. Git remote

```bash
git remote -v
```

**Result:** No output — **no remote is configured.**

Pushes to GitHub are not possible until a remote is added.

---

## 2. Add remote (REQUIRES USER INPUT)

**If no remote:**

1. User must provide the GitHub repository URL (e.g. `https://github.com/org/AISTROYKA.git` or `git@github.com:org/AISTROYKA.git`).
2. Then run:
   ```bash
   git remote add origin <GITHUB_REPO_URL>
   ```

**Not done in this run:** GitHub URL was not provided; remote was not added.

---

## 3. Current branch

```bash
git branch --show-current
```

**Result:** `chore/ai-memory-layer-v1`

**Local branches:** `main` exists (among others).

---

## 4. Production branch and merge

- **Production branch assumed:** `main` (standard).
- To deploy from `main`:
  1. Ensure all deployment-related and web build fixes are committed (see Phase 5 / audit).
  2. Merge current branch into `main`:
     ```bash
     git checkout main
     git pull origin main   # after remote is added
     git merge chore/ai-memory-layer-v1
     ```
  3. Or push the current branch and set it as production in the deploy provider.

**Not done in this run:** No remote; merge/push not performed.

---

## 5. Uncommitted changes

- **apps/web** is listed as **modified** (submodule or nested repo).
- Other modified files: various (engine, ios, docs, audit artifacts).
- Any uncommitted build fixes in `apps/web` should be committed inside `apps/web` (if it is a submodule) or at repo root before pushing.

---

## 6. Push (BLOCKED)

```bash
git push -u origin main
```

**Result:** Cannot run — no `origin` remote.

**After adding remote and merging into main:**
```bash
git push -u origin main
```

---

## Summary

| Item              | Status |
|-------------------|--------|
| Remote configured | No     |
| Current branch    | chore/ai-memory-layer-v1 |
| main exists       | Yes (local) |
| Merge into main   | Not done (no remote) |
| Push              | Blocked (no remote) |

**Required from user to proceed:** GitHub repository URL to run `git remote add origin <URL>`.
