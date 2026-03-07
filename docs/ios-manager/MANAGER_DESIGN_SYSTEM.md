# Manager Design System

**Date:** 2026-03-07

---

## Direction

- **Serious, modern, tactile, premium, enterprise-ready.** Richer and more structured than the Worker UI.
- Use system fonts and Semantic colors by default; accent from Assets (AccentColor). Can be extended with custom components below.

## Components to add (catalog)

| Component | Purpose |
|-----------|--------|
| **KPI card** | Metric value + label + optional trend |
| **Project status card** | Project name, status, progress or key info |
| **Progress bar / milestone block** | Task or report progress |
| **Alert banner** | Warning/error/info above content |
| **Report preview card** | Report summary, media count, status |
| **Worker activity row** | Worker name, last activity, counts |
| **AI insight card** | Short AI summary or suggestion |
| **Empty state** | Icon + title + subtitle + optional action |
| **Loading state** | Spinner or skeleton |
| **Error state** | Message + retry action |
| **Section header** | Bold title for list sections |
| **Filter chips** | Horizontal selectable filters |
| **Manager action button** | Primary/secondary button styles |

## Current state

- Manager screens use standard SwiftUI: `List`, `Form`, `NavigationStack`, `Text`, `Button`, `Label`. No custom design system components yet.
- **Next step:** Add a `DesignSystem` or `Components` group under AiStroykaManager and implement the above as reusable views; then refactor dashboard and list screens to use them.
