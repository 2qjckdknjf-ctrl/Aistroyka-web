# Step 9B — Root Cause Analysis

**Date:** 2026-03-18  
**Purpose:** Ranked diagnosis for SWC/native binding local build failure.

---

## Primary cause (confirmed)

**Bun install on darwin-x64 does not extract native binaries from optional platform-specific packages.**

- **Packages affected:**  
  - `@next/swc-darwin-x64` (Next.js SWC; optionalDependency of next)  
  - `@swc/core-darwin-x64` (SWC core; optionalDependency of @swc/core, pulled in by next-intl)
- **Evidence for:**  
  - Both packages were present under `node_modules` with correct `package.json` and “main” pointing to a `.node` file.  
  - The `.node` files were **absent** (directory contained only README + package.json).  
  - Reinstalling the **exact same versions** with `npm install <pkg>@<ver> --no-save` from root produced the binaries and build succeeded.  
  - No code or config change was required; only restoring the native binaries.
- **Evidence against:**  
  - None; the failure is fully explained by missing binaries and fixed by npm reinstall of those two packages.
- **Verdict:** **Root cause.** Environment/package-manager specific: Bun (this version/usage) on darwin-x64 does not populate the optional native binaries for these two packages.

---

## Rejected / secondary hypotheses

| Hypothesis | Evidence for | Evidence against | Verdict |
|------------|-------------|------------------|--------|
| Mixed npm vs bun (script path) | Root uses bun for build script | Failure is in config load (next-intl → @swc/core), not in which binary runs `next` | Rejected as primary cause; mix is incidental |
| Broken node_modules (generic) | Could cause MODULE_NOT_FOUND | Resolution works; only the `.node` files are missing | Rejected; scope is optional native packages only |
| next-intl or next.config bug | Config load triggers the load | No bug in next-intl or next.config; they correctly require @swc/core | Rejected |
| Architecture mismatch | uname -m = x86_64 | Correct packages (darwin-x64) are present; wrong arch would install different package | Rejected; arch is correct |
| Corrupted install (random) | Possible in theory | Reproducible: fresh bun install again leaves binaries out; npm install restores them | Rejected; reproducible pattern |
| Workspace resolution | Monorepo hoisting | next and @swc/core resolve from root; no wrong resolution | Rejected |
| Custom next.config import path | Config uses require() | Path is standard; failure is inside @swc/core binding load | Rejected |
| CI/local install divergence | CI uses bun, Linux | CI is Linux; Linux optional packages may be installed correctly by Bun; no divergence in “logic”, only platform | Supports “Bun on darwin” as cause |
| Package postinstall omission | Optional deps often use postinstall | Bun may skip or not run postinstall for optional deps on non-current platform; we didn’t prove Bun’s internals | Plausible mechanism, not proven; root cause remains “Bun on darwin doesn’t extract these binaries” |

---

## Ranked diagnosis

1. **Primary:** Bun install on darwin-x64 fails to extract native binaries for `@next/swc-darwin-x64` and `@swc/core-darwin-x64`.  
2. **Contribution:** next.config.js loads next-intl plugin at config load time, which pulls in @swc/core and triggers the native load before Next.js build starts, so the failure appears as “Failed to load next.config.js”.  
3. **Platform:** Issue is darwin-x64 local; CI (Linux) uses different optional packages and remains green.
