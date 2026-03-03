import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Plus_Jakarta_Sans } from "next/font/google";
import { QueryProvider } from "@/lib/query/QueryProvider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "cyrillic-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aistroyka",
  description: "AI Construction Intelligence",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#6342C4",
};

const LOCALES = ["ru", "en", "es", "it"] as const;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const locale = headersList.get("x-next-intl-locale") ?? "ru";
  const lang = LOCALES.includes(locale as (typeof LOCALES)[number])
    ? locale
    : "ru";

  return (
    <html lang={lang} className={plusJakarta.variable}>
      <body className="min-h-screen font-sans antialiased [padding-bottom:env(safe-area-inset-bottom)]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
