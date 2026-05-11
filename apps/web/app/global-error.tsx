"use client";

/**
 * Root error UI when the root layout throws. Keeps UX without `pages/500`, which conflicts with
 * standalone/OpenNext webpack cache + prerender worker edge cases on this codebase.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0b1220", color: "#e8eef8" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <h1 style={{ margin: 0, fontSize: "1.75rem" }}>500</h1>
            <p style={{ marginTop: "0.75rem", opacity: 0.9 }}>Something went wrong. Please try again.</p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                marginTop: "1.5rem",
                padding: "0.55rem 1.1rem",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                background: "#38bdf8",
                color: "#0b1220",
              }}
            >
              Retry
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
