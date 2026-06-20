import type { Metadata } from "next";
import { assertPlatformOwnerPageAccess } from "@/lib/platform-owner/require-platform-owner-page";

export const metadata: Metadata = {
  title: "Owner",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function OwnerCabinetLayout({ children }: { children: React.ReactNode }) {
  await assertPlatformOwnerPageAccess();
  return (
    <div className="min-h-screen bg-aistroyka-bg-primary text-aistroyka-text-primary">
      <header className="surface-glass-chrome border-b border-[var(--lg-border)] px-aistroyka-4 py-aistroyka-3">
        <p className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
          Isolated control layer
        </p>
      </header>
      <main className="mx-auto max-w-3xl px-aistroyka-4 py-aistroyka-8">{children}</main>
    </div>
  );
}
