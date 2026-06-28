# App Icons, Assets & Metadata

## AppIcon asset catalogs

| App | AppIcon set | Slots | Source PNG | Dimensions |
|---|---|---|---|---|
| Manager | `Assets.xcassets/AppIcon.appiconset` | 1 (universal single-size) | `AppIcon.png` | 1024×1024 |
| Worker | `Assets.xcassets/AppIcon.appiconset` | 1 (universal single-size) | `AppIcon.png` | 1024×1024 |

- Both use the **modern single-size (1024×1024 "universal") app icon** format. Xcode automatically generates all required device slot sizes (including iPhone **120×120** and iPad **152×152**) from this single source at build time.
- `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon` resolved for both targets.

### Prior concern resolution

The prior validation note about **missing 120×120 and 152×152 icons** reflected an older multi-slot icon set. With the current single-size 1024×1024 universal asset, Xcode generates those sizes automatically — this preflight finds **no missing-icon blocker** at the asset-catalog level. (Final confirmation comes from a real signed archive + App Store validation, which is owner/CI gated.)

## Store metadata / privacy (NOT verifiable locally)

The following are App Store Connect–side and cannot be verified in this local preflight:

- App name, subtitle, description, keywords, support/marketing URLs.
- Screenshots (required device sizes).
- App privacy / "data safety" nutrition labels.
- Age rating questionnaire.
- Export compliance answers.

These are recorded as **OWNER_ACTION_REQUIRED** in the App Store Connect preflight (doc 05) and the verdict (doc 07).
