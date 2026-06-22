# Design / Public Branch Inventory

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Branch Inventory

|Branch|SHA|Ahead / behind PR #109|Files|Public|Dashboard|Tokens/design|Routing/layout|Messages|Tests|Docs|Classification|Direct merge|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
|`design/liquid-glass-public-shell-lg2a`|`68be705af313`|38 / 29|349|56|5|116|3|4|36|170|Primary Liquid Glass public/design reference, but bundled with AI migrations/routes.|NO|
|`feature/unified-product-design-certification`|`38e0d705fe3e`|50 / 29|721|67|62|170|15|4|39|250|Very broad certification branch crossing web, mobile, API, design, and routing.|NO|
|`origin/release/publication-readiness-mega-sprint`|`c66174190f24`|26 / 90|97|1|6|0|1|4|0|10|Release/readiness reference, not design source.|NO|
|`release/web-pilot-rc`|`9d6a7812d57c`|23 / 24|269|tracked in prior audits|tracked in prior audits|design references|routing/layout references|messages changed|7|81|Strong public/dashboard design reference from prior frontend audits.|NO|
|`feat/p1-design-tokens`|`517fe08af5fa`|0 / 31|0|0|0|0|0|0|0|0|Superseded/contained for current baseline.|NO|
|`fix/ai-vision-circuit-recovery`|`bd2b6a4f5a46`|0 / 94|0|0|0|0|0|0|0|0|Superseded/contained for current baseline.|NO|

## Key `design/liquid-glass-public-shell-lg2a` Path Themes

Adds or changes:

- `apps/web/components/design/liquid-glass/**`
- `apps/web/components/public/**`
- many public pages under `apps/web/app/[locale]/(public)/**`
- `apps/web/app/[locale]/design/liquid-glass/**`
- `apps/web/app/design-tokens.css`
- `apps/web/app/globals.css`
- `apps/web/styles/liquid-glass.css`
- SEO/public inventory helpers and tests
- user-visible locale messages
- AI feedback, AI Flywheel, Expert Review, Gold Memory routes/services/migrations

The AI and migration additions make the branch unsafe as a direct design source. Public/design ideas can be manually extracted only after separating them from AI/Flywheel work.

## Key `feature/unified-product-design-certification` Path Themes

This branch is even broader. It includes:

- Android Manager/Worker design and navigation work
- web public redesign
- dashboard and owner/customer portal changes
- UI token and component changes
- routing/layout changes
- API/report/export changes
- docs and readiness claims

It is not a candidate for direct merge.

## Inventory Verdict

Broad Liquid Glass/public redesign merge safe now: NO.

Useful source material exists, especially in `design/liquid-glass-public-shell-lg2a` and `release/web-pilot-rc`, but future work must manually extract one small visual slice after PR #109 merges and role/security tests are preserved.
