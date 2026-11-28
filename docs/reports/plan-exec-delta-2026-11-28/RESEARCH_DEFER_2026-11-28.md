# RESEARCH_DEFER — 2026-11-28 P1 candidates

## GigaAM Multilingual-v2 (voice intake)

| Check | Result |
|---|---|
| Primary | https://huggingface.co/ai-sage/GigaAM-Multilingual-v2 ; https://github.com/salute-developers/GigaAM |
| Runtime docs | Transformers quickstart uses `device="cuda"`; ONNX export helpers exist |
| Apple Silicon | **Not independently verified** in this workspace |
| License | HF LICENSE blob not conclusively MIT in this fetch; **do not install** until license text confirmed |
| Architecture | Must reuse existing STT adapters — no second ASR service |

**Verdict:** `RESEARCH_DEFER` — bake-off (WER/units/latency on ≤100 deidentified RU/ES clips) only after MIT/ONNX/Apple Silicon owner OK.

## Liquid d1.3-ultra (Document Intelligence)

| Check | Result |
|---|---|
| Primary | https://artificialanalysis.ai/decision-models/d1-3-ultra |
| Nature | Liquid AI **decision-model** API (text+image, ~66k context); Decision Index vendor benchmark — not a drop-in OCR engine |
| Duplicate OCR | Forbidden — keep existing OCR + deferred Nemotron path |
| Autonomous orders | Forbidden |

**Verdict:** `RESEARCH_DEFER` / WATCH — optional Growth Model Arena eval only with owner budget; no production default.

## Explicit non-adoption

d1.3-ultra, GigaAM, v2.video, GigaChat, AdvMMN remain digest candidates — not product dependencies.
