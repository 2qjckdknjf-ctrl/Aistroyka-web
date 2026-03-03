# Workspace consolidation report

**Date:** 2025-02-23  
**Goal:** Single Cursor workspace for both engine and web, unified folder structure, shared reports, git history preserved where it existed.

---

## 1. Old paths detected

| Project | Path | Notes |
|--------|------|--------|
| **Web** | `/Users/alex/Desktop/AISTROYKA/AISTROYKA-WEB` | Next.js app; had its own `.git` |
| **Engine** | No folder named `Aistroyk` found. Engine content lived at `/Users/alex/Desktop/AISTROYKA` (sibling to `AISTROYKA-WEB`): `src/`, `supabase/`, `docs/`, `package.json`, Vite config, etc. | No separate `.git` at parent level |

Searches used: `find ~ -maxdepth 5 -type d -name "AISTROYKA-WEB"` and `find ~ -maxdepth 5 -type d -name "Aistroyk"`. Only AISTROYKA-WEB matched; engine was inferred from the parent directory contents.

---

## 2. New final structure

```
~/Projects/AISTROYKA/
├── apps/
│   └── web/                    # former AISTROYKA-WEB (Next.js, Cloudflare)
├── engine/
│   └── Aistroyk/               # engine content from Desktop/AISTROYKA
├── reports/                    # shared reports
├── README.md                   # workspace overview, build/deploy, rules
├── reports/README.md           # report naming conventions
└── workspace-consolidation-report.md  # this file (also in apps/web)
```

---

## 3. Git status in each subproject

### apps/web

- **.git:** Preserved (entire AISTROYKA-WEB directory was moved).
- **Status (at consolidation time):** On `main`, with modified and untracked files (e.g. `.gitignore`, `middleware.ts`, `package.json`, `wrangler.toml`, env examples, several new reports and docs).

### engine/Aistroyk

- **.git:** None. The original engine content lived in the parent `Desktop/AISTROYKA` folder, which did not have its own git repo; only the `AISTROYKA-WEB` subfolder had git.
- **Recommendation:** If you want version control for the engine, run `git init` in `engine/Aistroyk` and create an initial commit.

---

## 4. Commands to build / deploy — Web

From workspace root:

```bash
cd apps/web
npm install
npm run dev              # local dev
npm run build            # production build
npm run cf:deploy        # deploy (default)
npm run cf:deploy:dev
npm run cf:deploy:staging
npm run cf:deploy:prod
```

---

## 5. Commands to run engine

From workspace root:

```bash
cd engine/Aistroyk
npm install
npm run dev              # Vite dev server
npm run build            # tsc + vite build
npm run worker           # analysis worker
npm run lint             # ESLint
```

---

## 6. Issues encountered

1. **No `Aistroyk` directory:** The "engine" was not a folder named `Aistroyk` but the parent `Desktop/AISTROYKA` contents (excluding `AISTROYKA-WEB`). Those contents were moved into `engine/Aistroyk` to match the requested layout.
2. **Single .git:** Only the web app had git history; the engine side had no repo. Moving preserved web's `.git`; engine remains unversioned unless you run `git init` in `engine/Aistroyk`.
3. **Original Desktop folder:** After moving both web and engine, `/Users/alex/Desktop/AISTROYKA` is effectively empty (or only system files). You can remove it or keep it as a backup; no further moves were performed there.

---

**Next step:** Open `~/Projects/AISTROYKA` in Cursor as the single workspace root.
