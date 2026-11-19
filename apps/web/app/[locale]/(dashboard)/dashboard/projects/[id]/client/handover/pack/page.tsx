import { HandoverPackPreviewClient } from "../../../handover/pack/HandoverPackPreviewClient";

export default async function ClientHandoverPackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <HandoverPackPreviewClient
      projectId={id}
      backHref={`/dashboard/projects/${id}/client`}
      backLabelKey="backToClientPortal"
    />
  );
}
