# Expert Review Queue Flags

**Defaults:** all **false**

| Flag | Gate | Purpose |
|------|------|---------|
| `AI_EXPERT_REVIEW_QUEUE_ENABLED` | `AI_FLYWHEEL_ENABLED` | Master queue gate |
| `AI_EXPERT_REVIEW_WRITE_ENABLED` | master | Candidate builder `--write` |
| `AI_EXPERT_REVIEW_ADMIN_UI_ENABLED` | master | Admin UI + list API |
| `AI_EXPERT_REVIEW_GOLD_MEMORY_BRIDGE_ENABLED` | master | Post-submit Gold Memory dry-run bridge |

Queue hidden when flags false. Gold Memory bridge disabled by default.
