import { createClient } from "@/lib/supabase/server";

/** Read-only. If table public.billing exists with (id, plan, status, current_period_end), rows are shown; else empty state. */
export default async function BillingPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("billing")
    .select("id, plan, status, current_period_end")
    .order("current_period_end", { ascending: false });

  const list = Array.isArray(rows) ? rows : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold">Billing</h1>
      <p className="mt-1 text-sm text-gray-600">Read-only. No actions.</p>
      <div className="mt-4 overflow-x-auto border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-2 font-medium">Plan</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Period end</th>
            </tr>
          </thead>
          <tbody>
            {list.length > 0 ? (
              list.map((r: { id: string; plan: string | null; status: string | null; current_period_end: string | null }) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="px-3 py-2">{r.plan ?? "—"}</td>
                  <td className="px-3 py-2">{r.status ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {r.current_period_end
                      ? new Date(r.current_period_end).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-gray-500">
                  No billing records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
