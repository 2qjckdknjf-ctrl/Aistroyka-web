# Why `apps/web` Has Its Own Lockfile

The GitHub Actions deploy workflows (production and staging) build and deploy from **`apps/web`**. For that to work reliably:

1. **`npm ci`** requires a **`package-lock.json`** next to **`package.json`**. Without it, `npm ci` fails or behaves inconsistently.
2. **`actions/setup-node`** with `cache: "npm"` uses **`cache-dependency-path`** to decide what to cache. The path must exist **after checkout** on the runner. If the path is missing (e.g. because `apps/web` was not in the repo), the step fails with: *"Some specified paths were not resolved, unable to cache dependencies."*

Therefore:

- **`apps/web`** must have its own **`package-lock.json`** committed in the repo.
- The workflows set **`cache-dependency-path: apps/web/package-lock.json`** so the npm cache is keyed to that lockfile and caching works.

After adding `apps/web` (including its lockfile) to the repo and setting this path in both deploy workflows, CI no longer errors on the cache step and builds remain cacheable.
