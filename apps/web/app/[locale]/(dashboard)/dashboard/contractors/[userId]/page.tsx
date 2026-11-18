import { ContractorDetailCanonPage } from "./ContractorDetailCanonPage";

export default async function ContractorDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <ContractorDetailCanonPage userId={userId} />;
}
