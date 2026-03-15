"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Skeleton,
  EmptyState,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Button,
  Card,
  Modal,
  Input,
  Select,
} from "@/components/ui";

interface ProjectCostItem {
  id: string;
  project_id: string;
  category: string;
  title: string;
  planned_amount: number;
  actual_amount: number;
  currency: string;
  status: string;
  milestone_id?: string | null;
  created_at: string;
}

interface ProjectBudgetSummary {
  project_id: string;
  planned_total: number;
  actual_total: number;
  currency: string;
  over_budget: boolean;
  item_count: number;
}

interface Milestone {
  id: string;
  title: string;
  target_date: string;
}

async function fetchCosts(projectId: string): Promise<{
  items: ProjectCostItem[];
  summary: ProjectBudgetSummary;
}> {
  const res = await fetch(`/api/v1/projects/${projectId}/costs`, {
    credentials: "include",
  });
  if (!res.ok) return { items: [], summary: { project_id: projectId, planned_total: 0, actual_total: 0, currency: "RUB", over_budget: false, item_count: 0 } };
  const json = await res.json();
  const d = json.data ?? {};
  return {
    items: d.items ?? [],
    summary: d.summary ?? { project_id: projectId, planned_total: 0, actual_total: 0, currency: "RUB", over_budget: false, item_count: 0 },
  };
}

async function fetchMilestones(projectId: string): Promise<Milestone[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/milestones`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function createCostItem(
  projectId: string,
  body: { category: string; title: string; planned_amount: number; actual_amount?: number; milestone_id?: string }
): Promise<ProjectCostItem> {
  const res = await fetch(`/api/v1/projects/${projectId}/costs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Create failed");
  }
  const json = await res.json();
  return json.data;
}

function formatAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currency}`;
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    materials: "Materials",
    labor: "Labor",
    equipment: "Equipment",
    services: "Services",
    other: "Other",
  };
  return map[cat] ?? cat;
}

function statusLabel(status: string): string {
  return status.replace("_", " ");
}

export function ProjectCostsPanel({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: (body: { category: string; title: string; planned_amount: number; actual_amount?: number; milestone_id?: string }) =>
      createCostItem(projectId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-costs", projectId] });
      setCreateOpen(false);
    },
  });

  const query = useQuery({
    queryKey: ["project-costs", projectId],
    queryFn: () => fetchCosts(projectId),
    enabled: !!projectId,
  });
  const milestonesQuery = useQuery({
    queryKey: ["project-milestones", projectId],
    queryFn: () => fetchMilestones(projectId),
    enabled: !!projectId,
  });

  if (query.isPending) return <Skeleton className="h-48" />;
  if (query.isError)
    return (
      <p className="text-aistroyka-text-secondary p-4">Failed to load costs.</p>
    );

  const { items, summary } = query.data ?? {
    items: [],
    summary: { project_id: projectId, planned_total: 0, actual_total: 0, currency: "RUB", over_budget: false, item_count: 0 },
  };
  const milestones = milestonesQuery.data ?? [];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
          Budget & costs
        </h3>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateOpen(true)}
          aria-label="Add cost item"
        >
          Add cost item
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-aistroyka-accent">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">
            Planned total
          </p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
            {formatAmount(summary.planned_total, summary.currency)}
          </p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-info">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">
            Actual total
          </p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
            {formatAmount(summary.actual_total, summary.currency)}
          </p>
        </Card>
        <Card
          className={`border-l-4 ${summary.over_budget ? "border-l-aistroyka-error" : "border-l-aistroyka-success"}`}
        >
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">
            Status
          </p>
          <p className="mt-1 text-aistroyka-title3 font-semibold">
            {summary.over_budget ? (
              <span className="text-aistroyka-error">Over budget</span>
            ) : (
              <span className="text-aistroyka-success">On budget</span>
            )}
          </p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-text-tertiary">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">
            Cost items
          </p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
            {summary.item_count}
          </p>
        </Card>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">💰</span>}
          title="No cost items yet"
          subtitle="Add cost items to track planned vs actual spending."
          action={
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              Add cost item
            </Button>
          }
        />
      ) : (
        <Table aria-label="Project cost items">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Planned</TableHeaderCell>
              <TableHeaderCell>Actual</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Linked to</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const overrun = item.actual_amount > item.planned_amount;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{categoryLabel(item.category)}</TableCell>
                  <TableCell className="text-aistroyka-text-secondary">
                    {formatAmount(item.planned_amount, item.currency)}
                  </TableCell>
                  <TableCell>
                    <span className={overrun ? "text-aistroyka-error font-medium" : ""}>
                      {formatAmount(item.actual_amount, item.currency)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-aistroyka-text-tertiary/20 text-aistroyka-text-tertiary">
                      {statusLabel(item.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-aistroyka-text-secondary text-sm">
                    {item.milestone_id
                      ? (milestones.find((m) => m.id === item.milestone_id)?.title ?? item.milestone_id.slice(0, 8) + "…")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-aistroyka-text-secondary text-sm">
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <CreateCostItemModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          createMutation.reset();
        }}
        projectId={projectId}
        milestones={milestones}
        onSubmit={(body) => createMutation.mutate(body)}
        isSubmitting={createMutation.isPending}
        error={
          createMutation.isError && createMutation.error instanceof Error
            ? createMutation.error.message
            : null
        }
      />
    </div>
  );
}

function CreateCostItemModal({
  open,
  onClose,
  projectId,
  milestones,
  onSubmit,
  isSubmitting,
  error,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  milestones: Milestone[];
  onSubmit: (body: { category: string; title: string; planned_amount: number; actual_amount?: number; milestone_id?: string }) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [category, setCategory] = useState<string>("other");
  const [title, setTitle] = useState("");
  const [plannedAmount, setPlannedAmount] = useState("");
  const [actualAmount, setActualAmount] = useState("");
  const [milestoneId, setMilestoneId] = useState<string>("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const planned = parseFloat(plannedAmount);
    if (!t) return;
    if (isNaN(planned) || planned < 0) return;
    onSubmit({
      category,
      title: t,
      planned_amount: planned,
      actual_amount: actualAmount ? parseFloat(actualAmount) : undefined,
      milestone_id: milestoneId || undefined,
    });
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Add cost item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="cost-title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Materials for phase 1"
          required
          disabled={isSubmitting}
        />
        <div>
          <label htmlFor="cost-category" className="mb-1.5 block text-[var(--aistroyka-font-subheadline)] font-medium text-aistroyka-text-primary">
            Category
          </label>
          <Select id="cost-category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={isSubmitting}>
            <option value="materials">Materials</option>
            <option value="labor">Labor</option>
            <option value="equipment">Equipment</option>
            <option value="services">Services</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <Input
          id="cost-planned"
          label="Planned amount"
          type="number"
          min={0}
          step="0.01"
          value={plannedAmount}
          onChange={(e) => setPlannedAmount(e.target.value)}
          placeholder="0"
          required
          disabled={isSubmitting}
        />
        <Input
          id="cost-actual"
          label="Actual amount (optional)"
          type="number"
          min={0}
          step="0.01"
          value={actualAmount}
          onChange={(e) => setActualAmount(e.target.value)}
          placeholder="0"
          disabled={isSubmitting}
        />
        {milestones.length > 0 && (
          <div>
            <label htmlFor="cost-milestone" className="mb-1.5 block text-[var(--aistroyka-font-subheadline)] font-medium text-aistroyka-text-primary">
              Link to milestone (optional)
            </label>
            <Select id="cost-milestone" value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} disabled={isSubmitting}>
              <option value="">None</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.target_date})
                </option>
              ))}
            </Select>
          </div>
        )}
        {error && (
          <p className="text-sm text-aistroyka-error" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || !title.trim() || isNaN(parseFloat(plannedAmount)) || parseFloat(plannedAmount) < 0}>
            {isSubmitting ? "Adding…" : "Add"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
