# AISTROYKA Baseline Freeze — 2026-07-25

**Phase:** 0 — Baseline freeze  
**Repo:** `/Users/alex/Projects/AISTROYKA`  
**Checked at (local):** `2026-07-25T13:39:19+0200` / `2026-07-25T11:39:19Z`  
**Correction pass (local):** `2026-07-25T13:56:00+0200` (docs-only; design rg + health re-probe)  
**Branch:** `security/platform-admin-separation` (tracks `origin/security/platform-admin-separation`)  
**HEAD SHA:** `7855fb1641b7511b24f98d7ad652a0c674dae8f7` (`7855fb1`)  
**Bun:** `1.2.15` (matches `.tool-versions` and root `packageManager`)  
**Xcode:** `26.6` / `17F113`  
**Android JDK:** JBR `17.0.14` at `/Users/alex/Library/Java/JavaVirtualMachines/jbr-17.0.14/Contents/Home`

---

## 1. Verdicts

| Verdict | Result |
| --- | --- |
| **Phase 0 (baseline freeze)** | **YES** |
| **Overall release / first real client** | **NO-GO** |
| Allowed to proceed to Phase 1 | **YES** (Phase 0 complete; product code unchanged in Phase 0) |

Phase 0 YES means: mandatory docs read, all required checks executed (or explained), live staging/production probed, contradictions listed, and this evidence report exists. It does **not** mean launch readiness.

**Correction note:** External audit found two evidence errors in the first draft (incomplete design inventory; misread production AI health). This file was corrected in a docs-only pass. Product code, deps, design components, and check scripts were **not** changed.

---

## 2. Working tree state (preserved; not modified by Phase 0)

Phase 0 created **only** this report. Existing dirty/untracked user work was left untouched (no revert, no delete, no product edits).

### 2.1 Branch vs `origin/main`

| Field | Value |
| --- | --- |
| `origin/main` | `a401693ec6915d9014dc45503a2b1a6ae4412ad8` (`a401693`) — `Merge pull request #188 …` |
| Commits on branch not in `origin/main` | 28 |
| Commits on `origin/main` not in branch | 4 |
| Merge-base | `c10d2f404c34dfc83c9b7600a9aa9528024274ef` |

### 2.2 Modified tracked files

- `AGENTS.md`
- `docs/audits/ROMA_VENDOR_DEPENDENCY_AUDIT.md`
- `package-lock.json` (+29 / −1 vs HEAD)

### 2.3 Untracked (present at freeze; not created by Phase 0 except this file)

- `.github/workflows/qa-platform.yml`
- `apps/web/playwright.qa.config.ts`
- `apps/web/tests/qa/` (full QA Playwright scaffold)
- `docs/audits/ADMIN_CABINET_STATE_AUDIT.md`
- `docs/launch/P4_*`, `docs/launch/PILOT_*`, intake JSON examples/templates
- `docs/mobile/P3_ANDROID_*`
- `docs/ops/CURSOR_100_PERCENT_PROMPT_PACK.md`
- `docs/pilot/P2_PILOT_READINESS_CHECKLIST.md`
- `docs/qa/` (platform docs + reports)
- `docs/roadmap/AISTROYKA_100_PERCENT_COMPLETION_PLAN.md`
- `docs/roadmap/AISTROYKA_BASELINE_FREEZE_2026-07-25.md` (**this report**)
- `scripts/pilot/`
- `scripts/qa/`

### 2.4 Lockfiles

| Lockfile | Role | Observed |
| --- | --- | --- |
| `bun.lock` | Canonical Bun lock | Present (`244350` bytes; mtime Jul 7) |
| `package-lock.json` (root) | Vercel npm preview / npm audit | Present; **dirty** vs HEAD |
| `packages/contracts/package-lock.json` | N/A | **Absent** — contracts audit ran via workspace/hoisted deps |

Installed `next` resolved version: **15.5.12** (root + `apps/web`).

---

## 3. Command results (mandatory local gates)

| # | Command | Result | Exit | Summary / root cause |
| --- | --- | --- | ---: | --- |
| 1 | `git status --short --branch` | PASS | 0 | Dirty tree documented in §2; branch `security/platform-admin-separation` |
| 2 | `git rev-parse HEAD` | PASS | 0 | `7855fb1641b7511b24f98d7ad652a0c674dae8f7` |
| 3 | `bun --version` | PASS | 0 | `1.2.15` |
| 4 | `bun run lint` | **PASS** | 0 | ESLint quiet on `app components lib middleware.ts` |
| 5 | `bun run test` | **PASS** | 0 | **1764** tests / **326** files passed (Vitest 4.1.8, ~30s) |
| 6 | `bun run build` | **PASS** | 0 | contracts + roma-kernel + Next build completed |
| 7 | `bun run --cwd apps/web check:design` | **FAIL** | 1 | Script reports **1** hit; independent inventory found **9** raw-color violations in **4** files — see §3.3 (scanner blind spots) |
| 8 | `npm audit --omit=dev` | **FAIL** | 1 | **6** vulnerabilities (**1** low, **5** high): `next`, `postcss`, `sharp`, `form-data`, `brace-expansion`, `body-parser` |
| 9 | `(cd packages/contracts && npm audit --omit=dev)` | **PASS** | 0 | `found 0 vulnerabilities` |
| 10 | Android Gradle (see below) | **PASS** | 0 | `BUILD SUCCESSFUL`; `:shared:test` + Worker/Manager `assembleDebug` |
| 11 | iOS Worker `xcodebuild` | **PASS** | 0 | `** BUILD SUCCEEDED **` (simulator, `CODE_SIGNING_ALLOWED=NO`) |
| 12 | iOS Manager `xcodebuild` | **PASS** | 0 | `** BUILD SUCCEEDED **` (simulator, `CODE_SIGNING_ALLOWED=NO`) |

### 3.1 Android command (exact)

```bash
cd android
JAVA_HOME=/Users/alex/Library/Java/JavaVirtualMachines/jbr-17.0.14/Contents/Home \
  ./gradlew :shared:test :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug
cd ..
```

- Exit: `0`
- Duration: ~994ms (mostly UP-TO-DATE)
- JUnit XML under `android/shared/build/test-results/`: **8** testcase records across debug+release result files, **0** failures/errors
- Note: Gradle warned about deprecated features (Gradle 9 incompatibility) — P3 informational, not a fail

### 3.2 iOS commands (exact)

Worker / Manager Debug simulator builds with `CODE_SIGNING_ALLOWED=NO` both exited `0` with `BUILD SUCCEEDED`.

### 3.3 Design FAIL — incomplete script inventory + full evidence

#### 3.3.1 What `check:design` reported (exit 1)

```text
Raw Tailwind colors are not allowed. Use aistroyka tokens.
  components/platform-admin/PlatformAdminTestingClient.tsx: amber-500
```

Re-run on correction pass: same single hit, exit **1**.

#### 3.3.2 Independent read-only inventory (authoritative for baseline)

Command (correction pass):

```bash
rg -n --pcre2 \
  --glob '*.{ts,tsx,js,jsx,css}' \
  --glob '!*.test.*' \
  --glob '!*.spec.*' \
  '(?:text|bg|border(?:-[trblxy])?|ring|from|to|via|divide|placeholder)-(?:slate|red|amber|emerald|gray|zinc|neutral|stone|orange|yellow|lime|green|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]+(?:/[0-9]+)?' \
  apps/web/app apps/web/components apps/web/lib
```

**Result: 9 violations in 4 files**

| # | File | Line | Class |
| --- | --- | ---: | --- |
| 1 | `apps/web/components/help/HelpStartChecklist.tsx` | 93 | `text-green-600` |
| 2 | `apps/web/components/platform-admin/PlatformAdminTestingClient.tsx` | 445 | `ring-amber-500/20` |
| 3 | `apps/web/lib/platform-admin/executive-dashboard-ui.ts` | 333 | `bg-red-500` |
| 4 | `apps/web/lib/platform-admin/executive-dashboard-ui.ts` | 335 | `bg-amber-500` |
| 5 | `apps/web/lib/platform-admin/executive-dashboard-ui.ts` | 337 | `bg-gray-400` |
| 6 | `apps/web/lib/platform-admin/executive-dashboard-ui.ts` | 339 | `bg-emerald-500` |
| 7 | `apps/web/lib/platform-admin/quality-dashboard-ui.ts` | 68 | `border-l-red-600` |
| 8 | `apps/web/lib/platform-admin/quality-dashboard-ui.ts` | 72 | `border-l-amber-500` |
| 9 | `apps/web/lib/platform-admin/quality-dashboard-ui.ts` | 74 | `border-l-emerald-600` |

#### 3.3.3 Why the main script showed only one violation

Scanner source: `apps/web/scripts/check-raw-colors.mjs`

Current regex (simplified):

```js
/(?:^|\s)(?:text|bg|border|ring|from|to|via|divide|placeholder|ring)-((?:slate|red|amber|…)-[0-9]+)/g
```

Documented blind spots (not fixed in Phase 0):

1. **`(?:^|\s)` prefix** — requires start-of-string or whitespace before the utility. Classes that are the **first token inside a string literal** after `"` (no leading space) are missed. Example: `"bg-red-500"` / `"text-green-600"` / `"border-l-4 border-l-red-600"` return arms — the first class after `"` is invisible to the scanner. `ring-amber-500/20` was found only because it is preceded by whitespace inside a longer class string.
2. **No directed border variants** — pattern matches bare `border-…` but **not** `border-l-*`, `border-r-*`, `border-t-*`, `border-b-*`, `border-x-*`, `border-y-*`. Thus `border-l-red-600` / `border-l-amber-500` / `border-l-emerald-600` never match even when preceded by space.

Therefore: `check:design` FAIL is still a valid gate (exit 1), but its **reported count is incomplete**. Baseline inventory for Phase 1 must use the independent 9/4 list above until the scanner is fixed.

Assigned next phase: **Phase 1** (fix scanner + replace all 9 raw colors).

### 3.4 npm audit FAIL — exact packages (production omit=dev)

| Package | Severity | Advisory theme |
| --- | --- | --- |
| `next` (15.5.12) | high | Multiple App Router / Server Actions / Image / rewrite issues (GHSA cluster) |
| `postcss` (via next) | high | XSS / source map path issues |
| `sharp` | high | libvips CVEs via sharp `<0.35.0` |
| `form-data` | high | CRLF injection in multipart names |
| `brace-expansion` | high | ReDoS / OOM via `{}` groups |
| `body-parser` | low | DoS when invalid `limit` disables size enforcement |

Assigned next phase: **Phase 1** (minimal version moves + lockfile regen only as required).

---

## 4. Live runtime (read-only)

Commands (initial freeze + correction re-probe for production health):

```bash
curl -L --max-time 30 -sS -w '\nHTTP_STATUS:%{http_code}\n' https://staging.aistroyka.ai/api/v1/health
curl -L --max-time 30 -sS -w '\nHTTP_STATUS:%{http_code}\n' https://aistroyka.ai/api/v1/health
curl -L --max-time 30 -sS -w '\nHTTP_STATUS:%{http_code}\n' https://www.aistroyka.ai/api/v1/health
curl -L --max-time 30 -sS -D - -o /dev/null https://www.aistroyka.ai/en
```

Correction re-probe:

```bash
curl -L --max-time 30 -sS https://aistroyka.ai/api/v1/health
curl -L --max-time 30 -sS https://www.aistroyka.ai/api/v1/health
```

### 4.0 Health field semantics (source of truth)

From `apps/web/lib/controllers/health.ts`:

- `aiConfigured` → `serverConfig.AI_ANALYSIS_URL.length > 0` (external analysis URL present)
- `openaiConfigured` → `serverConfig.OPENAI_API_KEY.length > 0` (direct OpenAI provider key present)

These flags are **configuration presence**, not proof of live provider success.

### 4.1 Health endpoints

| URL | HTTP | ok | db | env | buildStamp | aiConfigured | openaiConfigured | Meaning | supabaseReachable | serviceRoleConfigured |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `https://staging.aistroyka.ai/api/v1/health` | 200 | true | ok | staging | `sha7=a401693`, `buildTime=2026-07-18 22:29` | **true** | true | `AI_ANALYSIS_URL` + OpenAI key present | true | true |
| `https://aistroyka.ai/api/v1/health` | 200 | true | ok | production | **absent** | **false** | **true** | External `AI_ANALYSIS_URL` absent; **direct OpenAI configured** | true | true |
| `https://www.aistroyka.ai/api/v1/health` | 200 | true | ok | production | **absent** | **false** | **true** | Same as apex | true | true |

**Correct production AI claim:**

```text
Production external AI_ANALYSIS_URL is absent, while the direct OpenAI provider is configured. Live AI functionality remains unproven until the Phase 7 provider smoke is executed.
```

**Incorrect claims (removed from this report):**

- “Production AI is fully not configured”
- “Production AI secrets are missing”
- Treating `aiConfigured=false` alone as absence of all AI credentials

### 4.2 Public page headers (`https://www.aistroyka.ai/en`)

| Field | Value |
| --- | --- |
| HTTP | 200 |
| Redirects | 0 (effective URL remains `https://www.aistroyka.ai/en`) |
| Host profile | `x-aistroyka-host-profile: public_product` |
| Auth redirect marker | `x-auth-redirect: pass` |
| Duplicate security headers | **YES** — comma-joined duplicates observed for: `content-security-policy`, `permissions-policy`, `referrer-policy`, `x-content-type-options`, `x-frame-options` |

**Likely duplicate emission path (not fixed in Phase 0):** both `apps/web/next.config.js` `headers()` and `apps/web/middleware.ts` apply the same page security header set from `apps/web/lib/security-headers.ts`. Live responses show duplicated values, consistent with middleware + Next headers both attaching.

### 4.3 Can live runtime be proven equal to current HEAD?

| Claim | Proven? | Evidence |
| --- | --- | --- |
| Staging == current HEAD `7855fb1` | **NO** | Staging `buildStamp.sha7=a401693` == `origin/main`, not branch HEAD |
| Staging == `origin/main` | **YES** | `a401693` matches |
| Production == HEAD | **NO** | No `buildStamp` on production health |
| Production == `origin/main` | **NOT PROVEN** | No `buildStamp`; cannot SHA-match |
| Production AI live / provider smoke | **NO** | Health shows OpenAI key present (`openaiConfigured=true`) and `AI_ANALYSIS_URL` absent (`aiConfigured=false`); **no** `ai_live_provider.sh --require-live` run in Phase 0 |

No deploy/publish was performed.

---

## 5. Roadmap / docs vs evidence

| Area | Claimed in documentation | Confirmed by code/check | Not done / not proven | Status |
| --- | --- | --- | --- | --- |
| Backend / API | Canonical `/api/v1/*` in apps/web; mega-roadmap + AGENTS | Lint/test/build PASS; large API surface builds | Full negative-route matrix + Phase 2 finance/RBAC proof still open | **PARTIAL** |
| RBAC / tenant isolation | Defense-in-depth; platform owner ≠ tenant admin; RLS on tenant_id | Code/layout gates exist; unit tests PASS | Live multi-role E2E not proven on this freeze; QA RELEASE_VERDICT domains UNKNOWN | **PARTIAL** |
| Customer-finance isolation | Mega-roadmap §1 mandatory; customer never sees internal costs/margin | Guard module + portal/share usages exist (`customer-finance-guard.ts` + portal routes); **unchanged in Phase 0** | Exhaustive negative tests / every customer path not re-proven here (Phase 2) | **RULE INTACT / PROOF INCOMPLETE** |
| Web / public site | Public locale site live; no MOCK_METRICS on main truth index | `/en` HTTP 200; health OK | Design gate FAIL (**9** raw colors / **4** files; script under-reports); duplicate headers on public response | **PARTIAL / NO-GO gates open** |
| Contractor dashboard | `/dashboard` contractor ops | Tests/build PASS; QA dashboard E2E UNKNOWN | Multi-role E2E credentials not verified this freeze | **PARTIAL** |
| Client portal | `/portal` stakeholder portal | Routes/tests exist in suite | Stakeholder E2E gaps noted in QA coverage | **PARTIAL** |
| Admin / platform-admin | `/admin` tenant; `/platform-admin` owner; Operations Center read-only | Branch is platform-admin separation work; lint/test PASS | Owner Access live proof not re-run; **multiple** raw-color hits in platform-admin UI helpers + testing client | **PARTIAL** |
| iOS Worker | Simulator build previously evidenced; primary mobile contour | **This freeze:** Debug simulator build **PASS** | Device/TestFlight/Layer B live E2E not run here | **BUILD OK / PILOT DEVICE OPEN** |
| iOS Manager | Same as Worker | **This freeze:** Debug simulator build **PASS** | Device/TestFlight/Layer B open | **BUILD OK / PILOT DEVICE OPEN** |
| Android Worker | P3 Option A defer for first pilot; apps exist as Compose scaffolds | Debug `assembleDebug` **PASS**; shared unit tests 0 failures | Not first-pilot required; store/Play upload OWNER_ACTION; thinner than iOS | **DEFERRED (intentional) / BUILD OK** |
| Android Manager | Same defer | Debug `assembleDebug` **PASS** | Same | **DEFERRED / BUILD OK** |
| AI | Live gate via `ai_live_provider.sh`; staging may be configured | Staging: `aiConfigured=true`, `openaiConfigured=true`. Production: `aiConfigured=false`, `openaiConfigured=true` (`AI_ANALYSIS_URL` absent; OpenAI key present per `health.ts`) | Live production AI functionality unproven (Phase 7 smoke not run); QA AI_READY UNKNOWN | **STAGING URL+KEY PRESENT / PROD OPENAI CONFIGURED, LIVE UNPROVEN** |
| Staging / production | Cloudflare Workers; buildStamp proof | Staging health + stamp OK; prod health OK without stamp | Prod SHA unknown; HEAD ≠ staging | **STAGING PROVEN / PROD SHA UNKNOWN** |
| Monitoring / ops | Operations Center read-only; smoke runbooks | Docs + code present on branch | Not execution-validated as release ops in this freeze | **PARTIAL** |
| Pilot Day0 / first client | P4 ops package closed; Day0 launch NO | Docs present; intake FAIL / tenant not created / device smoke blocked | Real client intake READY missing; owner/client sign-off missing | **NO-GO** |

---

## 6. Problems by severity (evidence-backed)

### P0 — release / security gate blockers for later phases

1. **Production dependency audit high findings** — `npm audit --omit=dev` exit 1; `next`/`postcss`/`sharp`/`form-data`/`brace-expansion` high. Phase **1**.
2. **Duplicate security headers on public production responses** — live `www.aistroyka.ai/en` shows duplicated CSP/Permissions-Policy/Referrer-Policy/X-CTO/XFO. Likely `next.config.js` + `middleware.ts`. Phase **1**.
3. **Design token gate incomplete + real violations** — `check:design` FAIL; independent inventory **9** raw-color classes in **4** files; scanner blind spots under-report. Phase **1**.
4. **First real client launch blocked** — `PILOT_DAY0_GO_NO_GO.md`: intake FAIL, tenant not created, device smoke BLOCKED, launch allowed NO. Phase **9**.

### P1

5. **Production live AI unproven** — production `openaiConfigured=true` and `aiConfigured=false` mean OpenAI key is present and external `AI_ANALYSIS_URL` is absent; this is **not** “AI secrets missing.” Live functionality requires Phase **7** `ai_live_provider.sh --require-live` (not Phase 1).
6. **Production health lacks `buildStamp`** — cannot prove deployed SHA. Phase **8**.
7. **Current HEAD not deployed** — staging=`a401693` (`origin/main`); HEAD=`7855fb1`. Phase **8** (after merge), not Phase 0.
8. **QA RELEASE_VERDICT RELEASE_READY UNKNOWN** (score 51/100) — most domains UNKNOWN; dashboard E2E / live AI not verified in QA report dated 2026-07-03. Phases **3**, **7**.
9. **Truth index stale vs live** — `docs/CURRENT_PROJECT_TRUTH_INDEX.md` still cites main `2fe776f2` / last updated 2026-06-26; live staging is `a401693` (2026-07-18). Phase **10** (truth cleanup) / housekeeping.

### P2

10. **QA coverage gaps** — pages ~69%, APIs ~44%; member/viewer permission gaps; many portal/admin routes untested (`COVERAGE_REPORT.md`). Phases **2–3**.
11. **Android deferred but owner defer sign-off still OPEN** in `P3_ANDROID_GO_NO_GO.md`. Phase **6**.
12. **Dirty `package-lock.json`** in working tree — must not be blindly committed; Phase **1** must validate with `node scripts/ci/validate-npm-lock.cjs` after intentional upgrades.
13. **Gradle deprecation warnings** (Gradle 9). Phase **6** optional.

### P3

14. **Historical DEVELOPMENT_ROADMAP.md** (older 6-phase backend plan) overlaps but does not match the 2026-07-25 100% phase map — treat as historical sequencing, not current gate source. Phase **10**.
15. **QA platform scaffold untracked** on this branch — separate from ROMA/Operations Center per AGENTS preference. Do not broad-merge without explicit decision.

---

## 7. Exact failing gates (this freeze)

1. `bun run --cwd apps/web check:design` → exit **1** (under-reports; full inventory = **9** violations / **4** files — §3.3)
2. `npm audit --omit=dev` → exit **1** (6 vulns)
3. Overall release / first-client launch → **NO-GO** (pilot Day0 + deps/design/headers; **not** because production AI secrets are absent)

Non-failing but release-relevant evidence:

- Production `aiConfigured=false` **and** `openaiConfigured=true` → `AI_ANALYSIS_URL` absent, OpenAI configured; live AI smoke not run (Phase 7)
- Production missing `buildStamp`
- Duplicate security headers on public HTML
- HEAD ≠ live staging SHA

---

## 8. Stale / contradictory claims

Do **not** delete historical docs. Mark the following as **stale or not proven by this freeze**:

| Document | Claim | Why stale / unproven now |
| --- | --- | --- |
| `docs/CURRENT_PROJECT_TRUTH_INDEX.md` | Canonical main SHA `2fe776f2` (2026-06-26) | `origin/main` is now `a401693`; staging stamp matches `a401693` |
| Same index | “Production runtime on current main … `bc992b7`” (2026-06-28 note) | Production health today has **no** `buildStamp`; cannot confirm |
| `docs/DEVELOPMENT_ROADMAP.md` | Implies unfinished AIService/SyncService/idempotency as primary roadmap | Superseded operationally by mega-roadmap + 100% plan + P2/P3/P4 closures; keep as historical |
| `docs/product/PHASE13_ROADMAP_CLOSURE.md` | CONDITIONAL YES Phase 13 product closure | Product-scope closure ≠ first-client GO; Day0 still NO-GO |
| `docs/launch/P4_GO_NO_GO.md` | “GO — P4 closed” | Correct for **ops package** only; must not be read as launch GO (doc itself says launch NO) |
| `docs/qa/reports/RELEASE_VERDICT.md` | SECURITY_READY/PERFORMANCE_READY/CI_READY YES; score 51 | Point-in-time 2026-07-03 generated artifact; not revalidated full matrix this freeze; contradicts overall NO-GO if misread as launch |
| Any “production ready / GA / CERTIFIED 9.5” historical docs | Runtime readiness | Truth index already rejects; still forbidden without fresh SHA+deploy proof |
| Assumption “latest main is production” | Deployed = main | Staging proves main; **production does not** |
| **First draft of this baseline (pre-correction)** | “Production AI not configured” / missing AI secrets from `aiConfigured=false` alone | Incorrect: `openaiConfigured=true` proves OpenAI key presence; only `AI_ANALYSIS_URL` is absent |

---

## 9. External blockers (separate from local defects)

| Blocker | Type | Evidence | Blocks |
| --- | --- | --- | --- |
| Real pilot client intake not READY | Owner/client | `PILOT_DAY0_GO_NO_GO.md` intake FAIL | Phase 9 launch |
| Physical device / TestFlight smoke | Device / owner store gates | Day0 device smoke BLOCKED | Phase 5 / 9 |
| Production live AI proof | Operator smoke / Phase 7 | Health: `openaiConfigured=true`, `aiConfigured=false`; live provider smoke **not executed** | Phase 7 LIVE claims (not Phase 1) |
| Android Play / iOS TestFlight uploads | Owner credentials & approvals | AGENTS MODE B gates | Store distribution (not first-pilot if Android deferred) |
| Multi-role E2E credentials | Env secrets | QA RELEASE_VERDICT P1/P2 | Phase 3 full E2E |

No Phase 0 command was `BLOCKED_EXTERNAL` — all mandatory local/live checks ran.

---

## 10. Customer-finance isolation

**Unchanged in Phase 0:** no edits to guard, portal/share routes, RLS, or customer surfaces.

Evidence of existing guard presence (for later Phase 2 proof, not modified):

- `apps/web/lib/security/customer-finance-guard.ts`
- `apps/web/lib/security/customer-finance-guard.test.ts`
- Portal/share routes importing/using isolation paths

---

## 11. Exact Phase 1 scope (do not expand)

### 11.1 Files to inspect / likely change

**Dependencies / security headers**

- `package.json` (root), `apps/web/package.json`
- `bun.lock`, `package-lock.json` (only after intentional dep upgrades; validate npm lock)
- `apps/web/lib/security-headers.ts`
- `apps/web/middleware.ts`
- `apps/web/next.config.js` (duplicate `headers()` vs middleware)
- Related tests: `apps/web/lib/security-headers.test.ts`, `apps/web/middleware.security-headers.test.ts`

**Design scanner + all raw-color violations (mandatory)**

- `apps/web/scripts/check-raw-colors.mjs` — fix regex blind spots:
  - detect utilities at the **start of a string literal** (not only after `^`/`\s`)
  - detect directed borders: `border-l-*`, `border-r-*`, `border-t-*`, `border-b-*`, `border-x-*`, `border-y-*`
- Test or fixture proving those blind spots no longer exist
- Replace **all 9** raw colors with AISTROYKA design tokens in:
  - `apps/web/components/help/HelpStartChecklist.tsx`
  - `apps/web/components/platform-admin/PlatformAdminTestingClient.tsx`
  - `apps/web/lib/platform-admin/executive-dashboard-ui.ts`
  - `apps/web/lib/platform-admin/quality-dashboard-ui.ts`

### 11.2 Phase 1 required checks (from 100% plan)

```bash
bun install --frozen-lockfile
node scripts/ci/validate-npm-lock.cjs
bun run --cwd apps/web check:design
bun run lint
bun run test
bun run build
bun run cf:build
npm audit --omit=dev
(cd packages/contracts && npm audit --omit=dev)
```

Also re-run the independent raw-color `rg` (or equivalent) and expect **0** matches after token replacement + scanner fix.

### 11.3 Phase 1 exit criteria

- No high/critical findings in production `npm audit --omit=dev`
- `check:design` PASS **and** independent inventory shows **0** raw-color hits in `app`/`components`/`lib`
- Scanner regression covered (string-start + directed border cases)
- lint/test/build/`cf:build` PASS
- Security headers not duplicated (local and/or deployed response check)
- Customer-finance isolation still untouched unless a header-only path requires a shared helper test
- Do **not** start Phase 2 inside Phase 1

### 11.4 Explicitly out of Phase 1

- Product feature work, RBAC redesign, portal UX, iOS/Android feature parity
- **AI configuration / production `AI_ANALYSIS_URL` / OpenAI secret rotation / live AI smoke** — Phase **7** only (health already shows OpenAI configured; need functional proof, not Phase 1 secret assumptions)
- Production deploy
- Pilot client intake
- Broad Liquid Glass / design-branch merges
- Committing secrets or real pilot PII

---

## 12. Phase 0 closure checklist

| Criterion | Met? |
| --- | --- |
| Mandatory documents read | YES |
| All mandatory checks run | YES |
| Each failure explained with evidence | YES |
| Live staging + production checked | YES |
| Doc contradictions listed | YES |
| Single baseline report created | YES |
| Design inventory corrected to 9/4 + scanner blind spots | YES (correction pass) |
| Production AI health semantics corrected | YES (correction pass) |
| Phase 1 scope exact and limited | YES |
| Did not proceed to Phase 1 implementation | YES |
| User dirty/untracked changes preserved | YES |
| Customer-finance isolation unchanged | YES |

---

## 13. Artifact paths for operators

Raw command captures from this freeze (local temp, not committed):

- `/tmp/aistroyka-baseline-2026-07-25/lint.txt`
- `/tmp/aistroyka-baseline-2026-07-25/test.txt`
- `/tmp/aistroyka-baseline-2026-07-25/build.txt`
- `/tmp/aistroyka-baseline-2026-07-25/check-design.txt`
- `/tmp/aistroyka-baseline-2026-07-25/npm-audit-root.txt`
- `/tmp/aistroyka-baseline-2026-07-25/npm-audit-contracts.txt`
- `/tmp/aistroyka-baseline-2026-07-25/android.txt`
- `/tmp/aistroyka-baseline-2026-07-25/ios-worker.txt`
- `/tmp/aistroyka-baseline-2026-07-25/ios-manager.txt`
- `/tmp/aistroyka-baseline-2026-07-25/health-*.txt`
- `/tmp/aistroyka-baseline-2026-07-25/www-en-headers.txt`

---

## 14. Phase 0 correction pass record

| Item | Result |
| --- | --- |
| Only file intentionally edited | `docs/roadmap/AISTROYKA_BASELINE_FREEZE_2026-07-25.md` |
| Design violations documented | **9** (was incorrectly treated as 1) |
| Scanner blind spots documented | YES |
| AI health semantics corrected | YES (`AI_ANALYSIS_URL` vs `OPENAI_API_KEY`) |
| Production AI claim | Accurate: URL absent, OpenAI configured, live unproven until Phase 7 |
| Product / dep / script changes | NONE |

---

**Phase 0 verdict: YES**  
**Overall release verdict: NO-GO**  
**Stop here — do not start Phase 1 in the same session unless explicitly requested.**
