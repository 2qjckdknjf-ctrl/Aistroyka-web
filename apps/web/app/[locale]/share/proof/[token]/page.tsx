import { Card } from "@/components/ui";

async function getProofPack(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const res = await fetch(`${base}/api/v1/share/proof/${token}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data as {
    project: { name: string };
    progress: { tasks_done: number; tasks_total: number };
    media: { id: string; category: string; file_url: string; uploaded_at: string | null }[];
    documents: { id: string; title: string; type: string; status: string }[];
    decisions: { id: string; title: string; status: string }[];
    approved_commercial_changes: { id: string; title: string; amount: number; currency: string; status: string }[];
  };
}

export default async function ProofSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const pack = await getProofPack(token);
  if (!pack) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <Card className="p-6">
          <h1 className="text-aistroyka-title3 font-semibold">Proof pack unavailable</h1>
          <p className="mt-2 text-aistroyka-text-secondary">This link may be expired, revoked, or invalid.</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <Card className="border-l-4 border-l-aistroyka-accent p-6">
        <h1 className="text-aistroyka-title font-bold">{pack.project.name}</h1>
        <p className="mt-2 text-aistroyka-text-secondary">
          Proof pack: {pack.progress.tasks_done} / {pack.progress.tasks_total} tasks complete
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-aistroyka-title3 font-semibold">Evidence photos</h2>
        {pack.media.length === 0 ? (
          <p className="mt-2 text-aistroyka-text-secondary">No shared evidence photos yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pack.media.map((item) => (
              <figure key={item.id} className="overflow-hidden rounded border border-aistroyka-border-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.file_url} alt={item.category} className="h-44 w-full object-cover" />
                <figcaption className="p-2 text-xs uppercase text-aistroyka-text-tertiary">{item.category}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <h2 className="font-semibold">Shared documents</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {pack.documents.map((doc) => (
              <li key={doc.id}>{doc.title} · {doc.status}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Decisions</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {pack.decisions.map((decision) => (
              <li key={decision.id}>{decision.title} · {decision.status}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Approved commercial changes</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {pack.approved_commercial_changes.map((item) => (
              <li key={item.id}>{item.title}: {item.amount.toLocaleString()} {item.currency}</li>
            ))}
          </ul>
        </Card>
      </div>
    </main>
  );
}
