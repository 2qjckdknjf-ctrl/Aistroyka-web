import { PublicHeader } from "@/components/public";
import { PublicFooter } from "@/components/public";
import { getAppUrl } from "@/lib/app-url";

/**
 * Layout for all public marketing pages: header + footer, no auth required.
 * Does not wrap (dashboard) or (auth) routes.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const baseUrl = getAppUrl();
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Aistroyka",
    url: baseUrl,
    logo: `${baseUrl}/brand/aistroyka-logo.png`,
    description: "AI Construction Intelligence — control progress, risks, and quality on site.",
  };
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Aistroyka",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS",
    description: "AI-powered construction intelligence platform: projects, tasks, daily reports, photo evidence, and AI analytics.",
    url: baseUrl,
    image: `${baseUrl}/brand/aistroyka-logo.png`,
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-main)]" style={{ background: "linear-gradient(180deg, #0B0F19 0%, #05070d 100%)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
