# 08 — Publish privacy note

**Purpose:** document what is published in git versus retained only locally for the Product Design audit pack.

## Published in git

- Documents `00`–`07` and this note.
- `evidence/manifest.json`
- Production public / guest auth / iOS Worker onboarding screenshots that do **not** contain account identity pixels (`publishedScreenshotCount` in manifest).
- Product Design Remediation Slice 01 implementation prompt under `docs/ops/`.
- Previously local/unpublished historical documents published for self-containment:
  - `docs/audit/AISTROYKA_FULL_PRODUCT_DESIGN_ARCHITECTURE_AUDIT_2026-08-02.md`
  - `docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md`

## Not published in git

- Staging authenticated cabinet/portal/admin/AI screenshots under  
  `evidence/_local_unpublishable_staging/` (gitignored).
- Reason: after header redaction, rendered synthetic account identity text remained visible in the pixel buffer on several dashboard captures. Owner publish rules forbid committing account emails/identifiers.
- Finding IDs that relied on those captures remain valid via narrative + matrix + backlog (`PD-P1-03`, `PD-P1-04`, `PD-P1-05`, related P2 items). Manifest lists each local file with `publishState=LOCAL_UNPUBLISHABLE`.

## Confirmation

- No pilot client PII.
- No cookies, bearer tokens, or raw auth headers in published artifacts.
- No platform-owner credentials.
- Implementation not started by this handoff.
