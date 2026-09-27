import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Exo_2, Inter } from "next/font/google";
import { QueryProvider } from "@/lib/query/QueryProvider";
import { AppGlassRoot } from "@/components/design/liquid-glass/AppGlassRoot";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic-ext"],
  variable: "--font-body",
  display: "swap",
});

const exo2 = Exo_2({
  subsets: ["latin", "cyrillic-ext"],
  variable: "--font-heading",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aistroyka.ai";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Aistroyka — construction operations for a controlled pilot",
    template: "%s | Aistroyka",
  },
  description: "Controlled-pilot construction operations: projects, field reports, and photo evidence. A person decides.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Aistroyka",
    title: "Aistroyka — construction operations for a controlled pilot",
    description: "Controlled-pilot construction operations: projects, tasks, daily reports, and photo evidence. A person decides.",
    images: [{ url: "/brand/social/aistroyka-og.png", width: 1200, height: 630, alt: "AISTROYKA" }],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B0F19",
};

const LOCALES = ["ru", "en", "es", "it"] as const;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let lang: (typeof LOCALES)[number] = "ru";
  try {
    const headersList = await headers();
    const fromHeader = headersList.get("x-next-intl-locale")?.trim();
    const fromPath = headersList.get("x-aistroyka-pathname")?.match(/^\/(ru|en|es|it)(?=\/|$)/)?.[1];
    const locale = fromHeader || fromPath || "ru";
    lang = LOCALES.includes(locale as (typeof LOCALES)[number])
      ? (locale as (typeof LOCALES)[number])
      : "ru";
  } catch {
    // headers() can throw in Edge/Workers; keep default locale (see dashboard layout)
  }

  return (
    <html lang={lang} className={`${inter.variable} ${exo2.variable} overflow-x-clip`}>
      <body className="min-h-screen min-w-0 font-sans antialiased [padding-bottom:env(safe-area-inset-bottom)] [padding-left:env(safe-area-inset-left)] [padding-right:env(safe-area-inset-right)]">
        <AppGlassRoot />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
