# Step 9 — Role & access review

| Surface | Gate |
|---------|------|
| Intelligence tab | Tenant member with project access; `requireTenant` + `getProject` |
| `operational` block | Same as intelligence JSON — no extra secrets |
| `/admin/ai` + AI runtime panel | `requireAdmin` read + tenant context |
| `/api/v1/admin/ops/ai-runtime` | Unchanged: admin-only, tenant-scoped rows |

**No change** to expose audit or runtime drilldown to non-admin users.

Manager sees truncated ref only; full correlation remains admin/logs.
