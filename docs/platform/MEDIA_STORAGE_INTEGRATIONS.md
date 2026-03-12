# Media & Storage Ecosystem

**Phase 11 — Ecosystem Integrations & Platformization**  
**Scalable media pipelines and storage abstraction; no core domain rewrite.**

---

## Scalable media pipelines

- **Current:** Upload session → client uploads to storage (Supabase or configured bucket) → finalize with object_path. Single pipeline; single region. See upload-session service and DATA_AND_MEDIA_SCALING.
- **At scale:** (1) Ingest: multiple sources (app upload, API upload, integration push). (2) Process: optional resize, transcode, or thumbnail job. (3) Store: primary + optional replica or CDN origin. (4) Serve: via CDN or signed URL. Pipeline is modular: ingest → optional process → store → serve. No change to report/media domain; only pipeline and storage abstraction.
- **Value:** Support more tenants and larger files without degrading; optional processing (e.g. thumbnail for list view) and cost control via tiering.

---

## Cloud storage abstraction

- **Current:** Supabase Storage (S3-compatible). Code uses Supabase client; path = tenant_id/project_id/... or similar. No abstraction layer.
- **Abstraction:** Define “storage adapter” interface: put(object_key, stream, content_type), get(object_key), getSignedUrl(object_key, expiresIn), delete(object_key). Implement “Supabase” adapter; later “S3”, “GCS”, or “Azure Blob” for multi-cloud or migration. Config per tenant or global: which adapter and bucket/prefix.
- **Scope:** Used by upload-session finalize and any future document/media ingest. Domain still holds object_path (or storage_ref); adapter is infra layer only.

---

## CDN strategy

- **Current:** No CDN in front of storage in repo; public or signed URLs point at origin. See DATA_AND_MEDIA_SCALING (Phase 9).
- **Strategy:** Put storage bucket behind CDN (Cloudflare, or provider CDN). Cache by object path; long TTL for immutable media; invalidate on delete/overwrite. Origin = storage; CDN URL = default for read. Optional: separate “media domain” (e.g. media.aistroyka.com) for branding and cookies.
- **Implementation:** Configure in infra (DNS, CDN origin); app generates URLs that point to CDN when configured. No domain logic change.

---

## Large upload flows

- **Current:** 1 MB body limit for create/finalize JSON; actual file upload is client → storage (presigned or direct). Large file = client uploads in chunks or single PUT to storage; we only record object_path and metadata.
- **Large files:** (1) Chunked upload: client splits file; we create “multipart” session and return part URLs; client uploads parts; we complete multipart. (2) Resumable: provider (e.g. Supabase) resumable upload; we track session and finalize. Prefer provider-native resumable when available. (3) Limit: max file size per tenant tier (see limits); reject or warn above. No core domain change; upload-session and adapter only.
- **Value:** Support drone footage, scans, and large PDFs without timeouts; better UX on slow networks.

---

## Drone and scan ingestion

- **Concept:** Ingest media from external sources: drone (photo/video), 3D scan, or survey tool. Flow: (1) Partner or device pushes to our API (with auth) or to a bucket we watch. (2) We create media record and optional job (e.g. thumbnail, attach to report). (3) Link to project/task/report as needed.
- **API:** POST /api/v1/media/ingest (or similar): tenant-scoped; body or multipart: file or URL, project_id, optional task_id/report_id, source (drone, scan, api). We validate, store, and optionally enqueue process job. Rate limit and quota apply.
- **Value:** Single pipeline for app and ecosystem; drone/scan partners integrate once. Modular: “ingest” endpoint and job type; no change to report submit flow.

---

## Implementation principles

- **Modular:** Storage adapter and pipeline are infra/integration; domain keeps “media has object_path and metadata.”
- **Tenant-safe:** All keys and paths tenant-scoped; no cross-tenant access. Quota and size limits per tenant.
- **Standard:** S3-compatible API for adapter when possible; CDN and HTTP standard. No proprietary protocol in core.
- **Value first:** Implement storage abstraction and CDN first; then chunked/resumable and ingest when needed.
