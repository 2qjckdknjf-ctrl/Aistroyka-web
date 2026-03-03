import type { ReactNode } from "react";
import { Nav } from "./Nav";

/**
 * App shell: topbar (Nav) + main content. iOS-like structure adapted for web.
 * Uses design tokens for spacing and surfaces.
 */
export function AppLayout({
  children,
  userEmail,
}: {
  children: ReactNode;
  userEmail?: string;
}) {
  return (
    <div className="min-h-screen bg-aistroyka-bg-primary">
      <Nav userEmail={userEmail} />
      <main className="mx-auto max-w-6xl px-aistroyka-4 py-aistroyka-6">
        {children}
      </main>
    </div>
  );
}
