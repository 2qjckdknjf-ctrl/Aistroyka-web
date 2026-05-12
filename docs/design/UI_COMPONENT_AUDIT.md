# UI Component Consistency Audit

## Scope

- Shared UI primitives in `apps/web/components/ui`
- Public/auth/dashboard surfaces using primitives
- Variant/state consistency and token usage

## Component Availability Matrix

- Button: present (`Button.tsx`)
- Card: present (`Card.tsx`)
- Panel: present (`Panel.tsx`)
- Badge: present (`Badge.tsx`)
- Input: present (`Input.tsx`)
- Select: present (`Select.tsx`)
- Textarea: present (`Textarea.tsx`)
- Tabs: present (`Tabs.tsx`)
- Modal/Dialog: present (`Modal.tsx`, `DropdownMenu.tsx`)
- Tooltip: no dedicated primitive found in `components/ui`
- Skeleton: present (`Skeleton.tsx`)
- EmptyState: present (`EmptyState.tsx`)
- ErrorState: present (`ErrorState.tsx`)
- LoadingState: handled via `Skeleton`/inline loaders; no dedicated `LoadingState.tsx`
- StatCard: present (`StatCard.tsx`)
- AIInsightCard: present (`AIInsightCard.tsx`)
- Icon wrapper: present (`Icon.tsx`)

## Findings

## 1) Core primitives are tokenized and reusable

- Button/Card/Input/Badge leverage `--aistroyka-*` tokens and semantic variants.
- Focus-visible support is centralized in `globals.css`.

## 2) Public/auth component usage drift (fixed)

- Public header was not using canonical logo primitive.
- Register auth page lacked logo parity with login.
- Both were aligned.

## 3) One-off CTA and section style drift (partially fixed)

- Public home had inline CTA/button classes diverging from shared `btn-primary`.
- Replaced high-impact CTA instances with shared button classes.

## 4) Duplicate page/component file risk

- 28 duplicate files with ` (1).tsx` suffix were found under dashboard/portfolio trees.
- These duplicates were removed in Stage-2 cleanup to reduce long-term style drift.
- Post-cleanup lint and test validations remained green.

## 5) Legacy color class usage (fixed in this sprint)

- Dashboard/intelligence `amber/emerald/red/slate` utility classes were migrated to `aistroyka` semantic tokens.
- `check:design` now passes.

## Fixes Applied in This Sprint

- `apps/web/components/public/PublicHeader.tsx` -> standardized logo component usage.
- `apps/web/app/[locale]/(auth)/register/page.tsx` -> added canonical logo block.
- `apps/web/app/[locale]/(public)/PublicHomeContent.tsx` -> replaced high-impact one-off CTA styles with shared button primitives.
- `apps/web/app/[locale]/(public)/implementation/page.tsx` -> replaced hardcoded text color utility with tokenized semantic text.
- `apps/web/components/intelligence/*` and `apps/web/app/[locale]/(dashboard)/**` representative surfaces -> replaced legacy raw severity/util classes with semantic token classes.

## Validation

- `bun run --cwd apps/web lint` -> pass
- `bun run --cwd apps/web test` -> pass
- `bun run --cwd apps/web build` -> pass
- `bun run --cwd apps/web check:design` -> pass

## Component Audit Verdict

- Shared primitives are healthy and usable as source-of-truth.
- Primary remaining consistency work is long-tail visual QA on newly added but non-audited feature areas.
