# Wave 4 Step 9 — Validation

## Tests

| File | Coverage |
|------|----------|
| `lib/domain/projects/stakeholder-activity-timeline.repository.test.ts` | `shapeStakeholderAudience`, `shapeManagerAudience` |
| `app/api/v1/projects/[id]/stakeholder-activity/route.test.ts` | Manager vs stakeholder audience routing, 403 |

Run from `apps/web`:

```bash
npm test -- lib/domain/projects/stakeholder-activity-timeline.repository.test.ts "app/api/v1/projects/[id]/stakeholder-activity/route.test.ts"
```

## Build

```bash
npm run build
```

(from repository root, per monorepo convention)

## Focused checks

- Lint on touched TSX and route files.
- Manual: open Activity tab as manager — two sections; open client portal as stakeholder — Activity section without internal lines.
