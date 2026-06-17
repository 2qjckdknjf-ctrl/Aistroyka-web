"use client";

import "./design-tokens.css";

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
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "var(--aistroyka-bg-primary)",
          color: "var(--aistroyka-text-primary)",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "var(--aistroyka-space-8)",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <h1 style={{ margin: 0, fontSize: "var(--aistroyka-font-title)" }}>500</h1>
            <p style={{ marginTop: "var(--aistroyka-space-3)", color: "var(--aistroyka-text-secondary)" }}>
              Something went wrong. Please try again.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                marginTop: "var(--aistroyka-space-6)",
                padding: "var(--aistroyka-space-3) var(--aistroyka-space-5)",
                borderRadius: "var(--aistroyka-radius-lg)",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                background: "var(--aistroyka-accent)",
                color: "var(--aistroyka-text-inverse)",
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
