import { GovernanceCaseDetailCanonPage } from "./GovernanceCaseDetailCanonPage";

export default async function GovernanceCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GovernanceCaseDetailCanonPage caseId={id} />;
}
