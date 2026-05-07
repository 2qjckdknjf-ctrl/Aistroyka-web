import { HandoverPackPreviewClient } from "./HandoverPackPreviewClient";

export default async function HandoverPackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HandoverPackPreviewClient projectId={id} />;
}
