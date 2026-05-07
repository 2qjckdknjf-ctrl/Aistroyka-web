import { redirect } from "next/navigation";

export default async function PortalRootPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/portal/projects`);
}
