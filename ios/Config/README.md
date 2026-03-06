# iOS Config

- **Config.example.xcconfig** — Placeholders only. Copy to `Secrets.xcconfig` and fill in, or set env in Xcode Scheme → Run → Environment Variables.
- **BASE_URL** — API base (e.g. https://aistroyka.ai or http://localhost:3000).
- **SUPABASE_URL** / **SUPABASE_ANON_KEY** — From Supabase Dashboard → Project Settings → API.
- Do not commit real keys. Add `Secrets.xcconfig` to .gitignore if you create it in this folder.
