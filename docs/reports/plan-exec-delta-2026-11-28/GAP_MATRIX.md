# Gap matrix — Cursor / Codex execution delta 2026-11-28

**Planning source:** `origin/roadmap/weekly-ai-reconciliation-2026-11-10` @ `aab7323a`  
**Base:** `origin/main` `80ffa442`  
**Branch:** `cursor/weekly-delta-exec-2026-11-28`

| Item | Priority | Existing ID | State | Note |
|---|---|---|---|---|
| Differential replay budget/permissions/reports/project | P0 | Assurance / #557 extend | **IMPLEMENTED** (this branch) | `replayProjectStateDifferential` + vitest |
| Action Boundary on customer projection | P0 | Finance boundary | **IMPLEMENTED** | `assertCustomerProjectionAllowed` wired into portal project GET + published evidence |
| Preserve #557 Action Boundary / evidence verdict | P0 | ai-governance | **MERGED** on main | No rebuild |
| Hosted migration receipts (#553/#554/#556) | P0 ops | DB apply | **OWNER_GATE** | Code on main; live apply needs receipts preflight |
| GigaAM Multilingual-v2 STT bake-off | P1 | Voice intake | **RESEARCH_DEFER** | See defer note — CUDA quickstart; ONNX exists; MIT/Apple Silicon not independently closed |
| Liquid d1.3-ultra Document Intelligence | P1 | Doc Intelligence / Arena | **RESEARCH_DEFER** | Vendor decision-model API (AA index); not a second OCR; no install; Arena only if owner enables |
| Portal nav / returnTo / bell count (#533) | P0 defect | Review follow-ups | **IN_PROGRESS** | Confirmed main defects from #502/#505/#506 |
| Dependabot Bun ecosystem (#530) | P1 | CI | **OPEN draft** | Ready after this slice |
| Gemini / ZDR / Mode B / device | — | Owner | **OWNER_GATE** | Unchanged |
