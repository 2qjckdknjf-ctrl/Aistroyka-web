# Phase 6 — Proof Pack domain

## Purpose

Project-level **Proof Pack** is a customer-safe snapshot a manager can share via a revocable token link. It supports the roadmap goal: viral before/after and progress evidence without exposing internal company finances.

## Scope (implemented)

- **Project summary:** name, task progress counts (done / total).
- **Media:** evidence-oriented items only on public links (see filtering in `includeMediaInPublicProof` in `apps/web/lib/domain/proof-pack/proof-pack.service.ts`). Categories in the payload are derived for display (`before`, `after`, `progress`, `issue`, `document`, `other`).
- **Documents:** rows with `client_visible` and not archived (manager pack uses same rule; public response omits internal paths).
- **Decisions:** client requests (non-cancelled), capped for payload size.
- **Approved commercial references:** issued/due/overdue/paid commercial items and change orders in `approved` / `implemented` with customer delta — customer-facing language only in UI copy.

## Out of scope (roadmap 6.2 — future)

Per-task proof packs (per-task before/after, worker display names, report deep links, manager notes flagged for customer, AI evidence scores) are **not** implemented in this slice. The database and API are project-scoped only.

## Persistence

- Table `proof_pack_shares` (migration `20260507140500_phase6_proof_pack_shares.sql`): `tenant_id`, `project_id`, `token`, optional `title`, `expires_at`, `revoked_at`, audit fields.
- RLS: tenant internal readers/writers for management; **public read of pack data** is not granted to `anon` — the app resolves tokens on the server using the service role client and returns only the shaped DTO.

## API

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/projects/:id/proof-pack` | Tenant member with project read |
| POST | `/api/v1/projects/:id/proof-pack` | Tenant manager (creates share) |
| DELETE | `/api/v1/projects/:id/proof-pack/shares/:token` | Tenant manager (revoke) |
| GET | `/api/v1/share/proof/:token` | None (token + server secret) |

Public page: `/[locale]/share/proof/[token]`.

## Customer finance isolation

Pack construction for `audience: "public"` filters media; documents and commercial slices are the same customer-safe projections used elsewhere. No internal cost tables or manager-only fields are selected in `buildProjectProofPack`.
