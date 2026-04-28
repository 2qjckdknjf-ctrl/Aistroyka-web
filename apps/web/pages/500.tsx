import React from "react";

export default function Custom500Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>500</h1>
        <p style={{ marginTop: "0.75rem" }}>Internal Server Error</p>
      </div>
    </main>
  );
}
