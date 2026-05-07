"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Badge, Input } from "@/components/ui";
import type { CustomerEstimateRow } from "@/lib/domain/customer-estimates/customer-estimates.types";

async function fetchCustomerEstimates(projectId: string): Promise<CustomerEstimateRow[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/estimates`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export function CustomerEstimatesManagerPanel({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("RUB");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const query = useQuery({
    queryKey: ["customer-estimates", projectId],
    queryFn: () => fetchCustomerEstimates(projectId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/estimates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          total_amount: Number(amount),
          currency,
          valid_until: validUntil || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Create failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-estimates", projectId] });
      setOpen(false);
      setTitle("");
      setAmount("");
      setDescription("");
      setValidUntil("");
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (estimateId: string) => {
      const res = await fetch(`/api/v1/projects/${projectId}/estimates/${estimateId}/send`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Send failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-estimates", projectId] });
      queryClient.invalidateQueries({ queryKey: ["client-requests", projectId] });
    },
  });

  const rows = query.data ?? [];

  return (
    <Card className="border-l-4 border-l-aistroyka-success p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-aistroyka-text-primary">Customer estimates</h3>
          <p className="mt-1 text-sm text-aistroyka-text-secondary">
            Commercial proposals sent to the customer for approval. This is separate from internal costs.
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "New customer estimate"}
        </Button>
      </div>

      {open ? (
        <div className="mt-4 grid gap-3 rounded border border-aistroyka-border-subtle p-3 sm:grid-cols-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Estimate title" />
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Total amount" />
          <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="Currency" />
          <Input value={validUntil} onChange={(e) => setValidUntil(e.target.value)} type="date" />
          <textarea
            className="rounded border border-aistroyka-border-subtle bg-aistroyka-bg-elevated p-2 text-sm sm:col-span-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Customer-facing description"
          />
          <Button
            type="button"
            size="sm"
            disabled={!title.trim() || !amount || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Create draft
          </Button>
          {createMutation.isError ? (
            <p className="text-sm text-aistroyka-error">{(createMutation.error as Error).message}</p>
          ) : null}
        </div>
      ) : null}

      <ul className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-aistroyka-text-tertiary">No customer estimates yet.</li>
        ) : (
          rows.map((row) => (
            <li key={row.id} className="rounded border border-aistroyka-border-subtle p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-aistroyka-text-primary">{row.title}</p>
                  <p className="text-aistroyka-text-secondary">
                    {Number(row.total_amount).toLocaleString()} {row.currency}
                  </p>
                </div>
                <Badge className="bg-aistroyka-surface-raised text-aistroyka-text-secondary">{row.status}</Badge>
              </div>
              {row.status === "draft" ? (
                <Button
                  type="button"
                  size="sm"
                  className="mt-2"
                  disabled={sendMutation.isPending}
                  onClick={() => sendMutation.mutate(row.id)}
                >
                  Send for approval
                </Button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
