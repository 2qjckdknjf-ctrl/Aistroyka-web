import type { Metadata } from "next";
import { assertPlatformOwnerPageAccess } from "@/lib/platform-owner/require-platform-owner-page";

export const metadata: Metadata = {
  title: "Owner",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function OwnerCabinetLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await assertPlatformOwnerPageAccess({ locale, returnPath: `/${locale}/owner` });
  return (
    <div className="min-h-screen bg-aistroyka-bg-primary text-aistroyka-text-primary">
      <header className="border-b border-aistroyka-border-subtle bg-aistroyka-surface px-aistroyka-4 py-aistroyka-3">
        <p className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
          Isolated control layer
        </p>
      </header>
      <main className="mx-auto max-w-3xl px-aistroyka-4 py-aistroyka-8">{children}</main>
    </div>
  );
}
