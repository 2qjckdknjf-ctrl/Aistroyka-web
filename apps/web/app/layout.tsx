import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Space_Grotesk } from "next/font/google";
import { QueryProvider } from "@/lib/query/QueryProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic-ext"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aistroyka.ai";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Aistroyka — AI Construction Intelligence",
    template: "%s | Aistroyka",
  },
  description: "AI Construction Intelligence — control progress, risks, and quality on site. AI construction platform, construction intelligence, AI project management.",
  keywords: ["AI construction platform", "construction intelligence", "AI project management", "construction analytics", "construction AI"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Aistroyka",
    title: "Aistroyka — AI Construction Intelligence",
    description: "AI-powered construction intelligence platform: projects, tasks, daily reports, photo evidence, and AI analytics.",
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
  const headersList = await headers();
  const locale = headersList.get("x-next-intl-locale") ?? "ru";
  const lang = LOCALES.includes(locale as (typeof LOCALES)[number])
    ? locale
    : "ru";

  return (
    <html lang={lang} className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen font-sans antialiased [padding-bottom:env(safe-area-inset-bottom)]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
