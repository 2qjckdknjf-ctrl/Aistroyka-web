# Gap matrix — Cursor / Codex execution delta 2026-11-27

**Planning source:** `origin/roadmap/weekly-ai-reconciliation-2026-11-10` → mega-roadmap § «Cursor / Codex execution delta — 2026-11-27»  
**Main tip at branch start:** `ac64d2d9b435fc2f83cdaf42eb8ac0e3333b1519` (#532 Action Boundary egress already on main)  
**Implementation branch:** `cursor/weekly-delta-exec-2026-11-27`

| Item | Priority | Existing ID | Verdict | Evidence |
|---|---|---|---|---|
| Transport-independent deny of protected resources (MCP/API/shell/fs/browser/delegated_agent) | P0 | Action Boundary / AI governance | **IMPLEMENTED** (additive) | `apps/web/lib/platform/ai-governance/action-boundary.ts` + 8 vitest cases; fails closed on unknown identity/auth; synthetic secret payload scan; consistent deny across transports |
| Independent evidence axes FAIL ≠ NOT_RUN ≠ UNKNOWN; functional PASS + security FAIL rejected | P0 | ROMA independent verdict | **IMPLEMENTED** (additive) | `evidence-verdict.ts` + 5 vitest cases |
| Pre-egress / allowlist / transitive auth (prior deltas) | P0 | D1–D4, #532 | **IMPLEMENTED** on main | Prior PRs; do not duplicate |
| Nemotron 3.5 Parse OCR bake-off on ES construction docs | P1 | Document Intelligence / Construction Graph | **RESEARCH_DEFER** | See `NEMOTRON_PARSE_RESEARCH_DEFER_2026-11-27.md` — OpenMDW + CUDA-oriented docs; Apple Silicon not verified; no install/weights |
| Historical competitor price snapshots + backlog prioritization | P1 | Market intelligence / D11 | **DEFER / MISSING** | No Monitor API or price-snapshot store on main; same deferral as 2026-11-24 D11 — no connector invented |
| Gemini video daily | P1 | AIS-VISION video | **BLOCKED** | No Worker `GEMINI_*` key (staging/prod/local) |
| Vendor ZDR org approval | P0 ops | D3a | **OWNER_GATE** | Retention declaration set; org ZDR external |
| Mode B store upload / physical device | P1 | Mobile pilot | **OWNER_GATE / PARTIAL** | Prior Mode B evidence; device smoke incomplete |
| Open draft monthly integrity/deps PRs #547, #552–#556 | — | Monthly audit | **INVENTORY** | Green CI drafts; merge only after non-author APPROVED; #552 is large lockfile remediation — not blind-merged |

## Independent verdict (this slice)

```
functional: PASS (13/13 vitest)
security: PASS (Aikido scan_paths: 0 issues on touched files; synthetic secrets only)
repeatability: PASS (vitest re-run identical)
runs: ≥2 local
sha: (set after commit)
```

`combineEvidenceVerdict` accepts only when all axes PASS with runs≥3 when counted as critical evidence package; this code slice records unit evidence as PASS and awaits protected PR + non-author APPROVED before DONE.
