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

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aistroyka.ai";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Aistroyka — AI Construction Intelligence",
    template: "%s | Aistroyka",
  },
  description: "AI Construction Intelligence — control progress, risks, and quality on site.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Aistroyka",
    title: "Aistroyka — AI Construction Intelligence",
    description: "AI-powered construction intelligence platform: projects, tasks, daily reports, photo evidence, and AI analytics.",
    images: [{ url: "/brand/aistroyka-logo.svg", width: 140, height: 32, alt: "Aistroyka" }],
  },
  icons: {
    icon: [
      { url: "/brand/aistroyka-icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
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
