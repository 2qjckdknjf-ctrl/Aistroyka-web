# B4 — Canonical naming — Aistroyka

**Authoritative.** New docs, comments, and onboarding must follow this.

---

## 1. Primary product / platform name

- **Written:** **Aistroyka**  
- **Formal (compliance / security docs):** **Aistroyka AI Platform** if a legal tone is required.  
- **Production origin:** **https://aistroyka.ai** (staging: documented subdomain).  
- **Not canonical in prose:** ALL-CAPS **AISTROYKA** (repo folder shorthand), **AISTROYKA.AI** as a stylized wordmark in old reports — prefer **Aistroyka** in new material.

---

## 2. Primary web product naming

- **Codebase:** `apps/web` — Next.js (App Router), OpenNext + Cloudflare Workers.  
- **User-facing:** Public marketing site + authenticated **dashboard** (`(dashboard)` routes).  
- **Not the product name:** Root `package.json` `"name": "AISTROYKA-WEB-CF-CHECK"` — internal npm id only.

---

## 3. Primary worker app naming

- **iOS / Android (field worker):** **AiStroykaWorker** (target / folder / scheme).  
- **Display strings:** **AiStroyka Worker** where a space is used.

---

## 4. Primary manager app naming

- **iOS / Android (manager):** **AiStroykaManager**.  
- **Display strings:** **AiStroyka Manager**.

---

## 5. Legacy aliases

- **Worker Lite / WorkerLite** — pilot-era naming and removed `ios/WorkerLite` tree; **not** a current primary product name.  
- **POTA.WorkerLite** and similar — historical bundle IDs in archive docs only.

---

## 6. Archival / historical only

- `docs/worker-lite/*`, phase-7 Worker Lite reports, iOS rename precheck targeting old WorkerLite project — **historical**.  
- Old reports whose title used **AISTROYKA.AI** — archive; normalize if editing for accuracy.

---

## 7. Unchanged (technical)

- **npm `package.json` `name` fields** (root, apps/web) — lockfile / tooling.  
- **Env vars** (`NEXT_PUBLIC_*`, etc.).  
- **Cloudflare worker names** in wrangler.  
- **Git remote URLs** in audits.  
- **Bundle IDs** (`ai.aistroyka.worker`, `ai.aistroyka.manager`, etc.).

---

## 8. Package truth

- **`@aistroyka/contracts`** / **`@aistroyka/contracts-openapi`** — shared schema / OpenAPI; web build depends on contracts.  
- **`@aistroyka/api-client`** — optional TypeScript SDK for **external** consumers; **not** used by `apps/web` at runtime.
