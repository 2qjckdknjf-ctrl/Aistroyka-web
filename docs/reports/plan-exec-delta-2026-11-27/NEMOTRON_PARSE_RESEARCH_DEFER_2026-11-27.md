# RESEARCH_DEFER — Nemotron 3.5 Parse (2026-11-27 P1)

**Decision:** do **not** install weights, add a second OCR service, or fine-tune on customer data.

## Primary-source checks

| Check | Result |
|---|---|
| Model card | https://huggingface.co/nvidia/Nemotron-3.5-Parse (fetched 2026-11-27) |
| License | **OpenMDW License Agreement v1.1** (model card «License/Terms of Use»); tokenizer MIT — research OK, production customer-doc use still needs legal review |
| Hardware docs | Official Transformers quickstart uses `.to("cuda")`; NVIDIA text states models are optimized for **NVIDIA GPU-accelerated systems**. **Apple Silicon not documented as a supported path** — not verified here |
| Existing architecture | AISTROYKA Document Intelligence / Vision already has OCR/provider adapters; mega-roadmap forbids a duplicate calculator or OCR service |
| Customer data | Fine-tuning on customer documents without consent is disallowed |

## Acceptance that remains open (when unblocked)

- Bounded offline bake-off on ≤50 **deidentified** Spanish construction documents (estimates, invoices, specs, catalogs, scanned tables).
- Metrics: field exact match, table alignment, abstention, latency, cost; independent total recompute; professional confirmation before persistence.
- Compare against **existing** OCR path only — no parallel production default.

## Why DEFER now

1. No confirmed Apple Silicon / Workers-compatible inference path without new GPU infra.
2. License + data-policy review not closed for production customer documents.
3. Existing Vision/OCR adapters must remain the single production path until bake-off evidence exists.

**Verdict:** `RESEARCH_DEFER` — revisit after owner GPU/eval environment + legal OK; until then keep Document Intelligence on current providers.
