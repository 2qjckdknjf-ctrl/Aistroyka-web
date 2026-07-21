# Pilot Intake Git History Incident Report

**Date (UTC):** 2026-07-21  
**Operator:** Cursor (sanitized investigation)  
**Scope:** Accidental commit of `docs/launch/pilot-intake.real.local.json` on branch `mobile/task-chat-device-smoke-20260718`  
**History rewrite:** **not performed** (requires separate owner approval)

---

## Verdict (machine-readable)

```
INCIDENT_CLASSIFICATION = NO_REAL_DATA
REAL_DATA_WAS_COMMITTED = NO
SECRETS_WERE_COMMITTED = NO
AFFECTED_REFS = refs/heads/mobile/task-chat-device-smoke-20260718 ; refs/remotes/origin/mobile/task-chat-device-smoke-20260718 ; git object d861452d ; blob ba99854958e2cf611908135f55cb313c92403ed5 (reachable from that branch history); GitHub commit URL for d861452d
HISTORY_SCRUB_REQUIRED = NO
CREDENTIAL_ROTATION_REQUIRED = NO
SAFE_TO_RESUME_DEVICE_SMOKE = YES
```

---

## What happened

| Item | Value |
|------|--------|
| Introducing commit | `d861452df3beedb19d653eb4936bd026e37915a9` |
| Path | `docs/launch/pilot-intake.real.local.json` |
| Blob OID | `ba99854958e2cf611908135f55cb313c92403ed5` |
| Blob size | 6179 bytes |
| Content SHA-256 (of blob bytes) | `20870cdb52d6f43f2034546f56d2ca2967d3c50f3d2159e0c98688a5759d9cf9` |
| Removal commit (tip tree) | `9ea7a501` deleted path + gitignore entry |
| Branch tip at investigation | `6af806ea` (file **absent** from tip tree) |

The file was **not** introduced on `main`. Backend size_bytes PR #188 used a separate branch and does **not** contain this commit.

---

## Classification method (no content disclosed)

Investigation used `git cat-file` / structural JSON parse and **signal-only** checks:

- Intake metadata enums / booleans (non-PII)
- Email domain set (example vs non-example) — **counts only**
- Presence of demo/synthetic markers on name and address fields — **booleans only**
- Phone field **shape** signals (digit length, country-prefix class, `555` placeholder class) — **no values printed**
- Named secret-key scan (`password` / `token` / `api_key` / PEM / JWT / Stripe-like prefixes) — **none found**
- Raw blob scan for JWT/PEM/live-secret prefixes — **none found**

### Signals observed

| Signal | Result |
|--------|--------|
| JSON parse | OK |
| `intakeType` | `synthetic_staging_rehearsal` |
| `filledBy` | `operator-synthetic-rehearsal` |
| `syntheticDemoDataUsed` | `true` |
| Email addresses | 10 total; **10** on `example.com`; **0** non-example domains |
| Name fields | all carry demo/synthetic/rehearsal markers |
| Address realish (unlabeled) | 0 |
| Phone fields | 4 placeholder-class numbers (`+34…` with `555` pattern); not treated as real client PII |
| Secret-named keys | none |
| Credential/JWT/PEM patterns | none |

**Conclusion:** Content is **synthetic staging rehearsal** intake (placeholder / demo), not real client PII and not credentials. Filename `.real.local` was misleading relative to payload.

---

## Affected refs / retention

| Location | Retains introducing commit / blob? |
|----------|-------------------------------------|
| `origin/main` | **NO** |
| `origin/mobile/task-chat-device-smoke-20260718` tip tree | File **absent** |
| Same branch **history** | **YES** — `d861452d` is an ancestor; blob still reachable via `git rev-list --objects` |
| Local object database (clones that fetched the branch) | **YES** while history uncleaned |
| Tags | **none** contain `d861452d` |
| Open PR from this head | **none** at investigation time |
| GitHub commit object `d861452d` | **reachable** by SHA while branch history exists |

No separate release artifact or tag was found that packages this file outside the smoke-branch git history.

---

## Required actions

| Action | Required? | Notes |
|--------|-----------|--------|
| Credential rotation | **NO** | No secrets in blob |
| Treat as real-PII breach | **NO** | Synthetic / `example.com` only |
| History scrub / force-push | **NO** (security) | Optional hygiene only; **do not** scrub without explicit owner approval |
| Resume device smoke | **YES** | Safe from this incident’s perspective |

### Optional hygiene (owner-gated, not required)

- Rewrite/smoke-branch history to drop `d861452d` blob after approval  
- Ensure clones prune unreachable objects after any approved scrub  
- Keep `docs/launch/pilot-intake.real.local.json` gitignored (already added in `9ea7a501`)

---

## Evidence references (non-sensitive)

- Introducing commit: `d861452d`  
- Deletion commit: `9ea7a501`  
- Ignore rule: `docs/launch/pilot-intake.real.local.json` in `.gitignore`  
- This report: `docs/security/PILOT_INTAKE_GIT_HISTORY_INCIDENT_REPORT.md`

---

## Explicit non-actions

- No file contents, names, emails, phones, tokens, or addresses are reproduced here.  
- No `git reset --hard`, force-push, filter-repo, or BFG was run.  
- No secrets were rotated (none identified).
