import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { EmptyState } from "@/components/ui";

/** Read-only. If table public.billing exists with (id, plan, status, current_period_end), rows are shown; else empty state. */
export default async function BillingPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("billing")
    .select("id, plan, status, current_period_end")
    .order("current_period_end", { ascending: false });

  const list = Array.isArray(rows) ? rows : [];

  return (
    <>
      <Card className="mb-aistroyka-8 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          Billing
        </h1>
        <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">Read-only. No actions.</p>
      </Card>
      {list.length > 0 ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[260px] text-left text-aistroyka-subheadline">
              <thead>
                <tr className="border-b border-aistroyka-border-subtle bg-aistroyka-surface-raised">
                  <th className="table-cell font-semibold text-aistroyka-text-primary">Plan</th>
                  <th className="table-cell font-semibold text-aistroyka-text-primary">Status</th>
                  <th className="table-cell font-semibold text-aistroyka-text-primary">Period end</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r: { id: string; plan: string | null; status: string | null; current_period_end: string | null }) => (
                  <tr
                    key={r.id}
                    className="border-b border-aistroyka-border-subtle last:border-0 transition-colors hover:bg-aistroyka-surface-raised/50"
                  >
                    <td className="table-cell text-aistroyka-text-primary">{r.plan ?? "—"}</td>
                    <td className="table-cell text-aistroyka-text-primary">{r.status ?? "—"}</td>
                    <td className="table-cell text-aistroyka-text-secondary tabular-nums">
                      {r.current_period_end ? new Date(r.current_period_end).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={
              <svg className="h-aistroyka-empty-icon w-aistroyka-empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
            title="No billing records"
            subtitle="Billing data will appear here when available."
          />
        </Card>
      )}
    </>
  );
}
