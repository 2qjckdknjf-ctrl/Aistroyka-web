"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  variance_amount?: number;
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
  if (!res.ok) return { items: [], summary: { project_id: projectId, planned_total: 0, actual_total: 0, variance_amount: 0, currency: "RUB", over_budget: false, item_count: 0 } };
  const json = await res.json();
  const d = json.data ?? {};
  return {
    items: d.items ?? [],
    summary: d.summary ?? { project_id: projectId, planned_total: 0, actual_total: 0, variance_amount: 0, currency: "RUB", over_budget: false, item_count: 0 },
  };
}

async function updateCostItem(
  projectId: string,
  costItemId: string,
  body: { category?: string; title?: string; planned_amount?: number; actual_amount?: number; status?: string; currency?: string; notes?: string; milestone_id?: string }
): Promise<ProjectCostItem> {
  const res = await fetch(`/api/v1/projects/${projectId}/costs/${costItemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Update failed");
  }
  const json = await res.json();
  return json.data;
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
  const tDetail = useTranslations("dashboardDetail");
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectCostItem | null>(null);

  const createMutation = useMutation({
    mutationFn: (body: { category: string; title: string; planned_amount: number; actual_amount?: number; milestone_id?: string }) =>
      createCostItem(projectId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-costs", projectId] });
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ costItemId, body }: { costItemId: string; body: Parameters<typeof updateCostItem>[2] }) =>
      updateCostItem(projectId, costItemId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-costs", projectId] });
      setEditingItem(null);
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
      <p className="text-aistroyka-text-secondary p-4">{tDetail("failedLoadCosts")}</p>
    );

  const { items, summary } = query.data ?? {
    items: [],
    summary: { project_id: projectId, planned_total: 0, actual_total: 0, variance_amount: 0, currency: "RUB", over_budget: false, item_count: 0 },
  };
  const hasBudgetNoActuals = summary.item_count > 0 && summary.actual_total === 0 && summary.planned_total > 0;
  const milestones = milestonesQuery.data ?? [];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
          {tDetail("budgetAndCosts")}
        </h3>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateOpen(true)}
          aria-label={tDetail("addCostItem")}
        >
          {tDetail("addCostItem")}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-aistroyka-accent">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">
            {tDetail("plannedTotal")}
          </p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
            {formatAmount(summary.planned_total, summary.currency)}
          </p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-info">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">
            {tDetail("actualTotal")}
          </p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
            {formatAmount(summary.actual_total, summary.currency)}
          </p>
        </Card>
        <Card
          className={`border-l-4 ${summary.over_budget ? "border-l-aistroyka-error" : "border-l-aistroyka-success"}`}
        >
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">
            {tDetail("status")}
          </p>
          <p className="mt-1 text-aistroyka-title3 font-semibold">
            {summary.item_count === 0 ? (
              <span className="text-aistroyka-text-tertiary">{tDetail("noBudgetConfigured")}</span>
            ) : summary.over_budget ? (
              <span className="text-aistroyka-error">{tDetail("overBudget")}</span>
            ) : hasBudgetNoActuals ? (
              <span className="text-aistroyka-text-secondary">{tDetail("noActualsYet")}</span>
            ) : (
              <span className="text-aistroyka-success">{tDetail("onBudget")}</span>
            )}
          </p>
          {summary.item_count > 0 && summary.variance_amount !== undefined && summary.variance_amount !== 0 && (
            <p className="mt-0.5 text-aistroyka-caption text-aistroyka-text-secondary">
              {tDetail("variance")}: {summary.variance_amount > 0 ? "+" : ""}{formatAmount(summary.variance_amount, summary.currency)}
            </p>
          )}
        </Card>
        <Card className="border-l-4 border-l-aistroyka-text-tertiary">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">
            {tDetail("costItems")}
          </p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
            {summary.item_count}
          </p>
        </Card>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">💰</span>}
          title={tDetail("noCostItemsYet")}
          subtitle={tDetail("addCostItemsHint")}
          action={
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              {tDetail("addCostItem")}
            </Button>
          }
        />
      ) : (
        <Table aria-label={tDetail("projectCostItems")}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{tDetail("title")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("category")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("planned")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("actual")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("linkedTo")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("created")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("actions")}</TableHeaderCell>
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
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                      className="text-xs"
                      aria-label={`Edit ${item.title}`}
                    >
                      Edit
                    </Button>
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
      {editingItem && (
        <EditCostItemModal
          open={!!editingItem}
          onClose={() => {
            setEditingItem(null);
            updateMutation.reset();
          }}
          projectId={projectId}
          item={editingItem}
          milestones={milestones}
          onSubmit={(body) => updateMutation.mutate({ costItemId: editingItem.id, body })}
          isSubmitting={updateMutation.isPending}
          error={
            updateMutation.isError && updateMutation.error instanceof Error
              ? updateMutation.error.message
              : null
          }
        />
      )}
    </div>
  );
}

const COST_STATUSES = ["planned", "committed", "incurred", "approved", "archived"] as const;

function EditCostItemModal({
  open,
  onClose,
  projectId,
  item,
  milestones,
  onSubmit,
  isSubmitting,
  error,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  item: ProjectCostItem;
  milestones: Milestone[];
  onSubmit: (body: { category?: string; title?: string; planned_amount?: number; actual_amount?: number; status?: string; currency?: string; notes?: string; milestone_id?: string }) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const [category, setCategory] = useState(item.category);
  const [title, setTitle] = useState(item.title);
  const [plannedAmount, setPlannedAmount] = useState(String(item.planned_amount));
  const [actualAmount, setActualAmount] = useState(String(item.actual_amount));
  const [status, setStatus] = useState(item.status);
  const [milestoneId, setMilestoneId] = useState(item.milestone_id ?? "");

  useEffect(() => {
    setCategory(item.category);
    setTitle(item.title);
    setPlannedAmount(String(item.planned_amount));
    setActualAmount(String(item.actual_amount));
    setStatus(item.status);
    setMilestoneId(item.milestone_id ?? "");
  }, [item.id, item.category, item.title, item.planned_amount, item.actual_amount, item.status, item.milestone_id]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const planned = parseFloat(plannedAmount);
    const actual = actualAmount === "" ? undefined : parseFloat(actualAmount);
    if (!t) return;
    if (isNaN(planned) || planned < 0) return;
    if (actual !== undefined && (isNaN(actual) || actual < 0)) return;
    onSubmit({
      category,
      title: t,
      planned_amount: planned,
      actual_amount: actual,
      status,
      milestone_id: milestoneId || undefined,
    });
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={tDetail("editCostItem")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-cost-title"
          label={tDetail("title")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={tDetail("materialsForPhaseExample")}
          required
          disabled={isSubmitting}
        />
        <div>
          <label htmlFor="edit-cost-category" className="mb-1.5 block text-[var(--aistroyka-font-subheadline)] font-medium text-aistroyka-text-primary">
            {tDetail("category")}
          </label>
          <Select id="edit-cost-category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={isSubmitting}>
            <option value="materials">{tDetail("materials")}</option>
            <option value="labor">{tDetail("labor")}</option>
            <option value="equipment">{tDetail("equipment")}</option>
            <option value="services">{tDetail("services")}</option>
            <option value="other">{tDetail("other")}</option>
          </Select>
        </div>
        <Input
          id="edit-cost-planned"
          label={tDetail("plannedAmount")}
          type="number"
          min={0}
          step="0.01"
          value={plannedAmount}
          onChange={(e) => setPlannedAmount(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          id="edit-cost-actual"
          label={tDetail("actualAmount")}
          type="number"
          min={0}
          step="0.01"
          value={actualAmount}
          onChange={(e) => setActualAmount(e.target.value)}
          disabled={isSubmitting}
        />
        <div>
          <label htmlFor="edit-cost-status" className="mb-1.5 block text-[var(--aistroyka-font-subheadline)] font-medium text-aistroyka-text-primary">
            {tDetail("status")}
          </label>
          <Select id="edit-cost-status" value={status} onChange={(e) => setStatus(e.target.value)} disabled={isSubmitting}>
            {COST_STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </Select>
        </div>
        {milestones.length > 0 && (
          <div>
            <label htmlFor="edit-cost-milestone" className="mb-1.5 block text-[var(--aistroyka-font-subheadline)] font-medium text-aistroyka-text-primary">
              {tDetail("linkToMilestoneOptional")}
            </label>
            <Select id="edit-cost-milestone" value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} disabled={isSubmitting}>
              <option value="">{tDetail("none")}</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>{m.title} ({m.target_date})</option>
              ))}
            </Select>
          </div>
        )}
        {error && (
          <p className="text-sm text-aistroyka-error" role="alert">{error}</p>
        )}
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>{tDetail("cancel")}</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || !title.trim() || isNaN(parseFloat(plannedAmount)) || parseFloat(plannedAmount) < 0}>
            {isSubmitting ? tDetail("saving") : tDetail("save")}
          </Button>
        </div>
      </form>
    </Modal>
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
  const tDetail = useTranslations("dashboardDetail");
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
    <Modal open={open} onClose={onClose} title={tDetail("addCostItem")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="cost-title"
          label={tDetail("title")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={tDetail("materialsForPhaseExample")}
          required
          disabled={isSubmitting}
        />
        <div>
          <label htmlFor="cost-category" className="mb-1.5 block text-[var(--aistroyka-font-subheadline)] font-medium text-aistroyka-text-primary">
            {tDetail("category")}
          </label>
          <Select id="cost-category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={isSubmitting}>
            <option value="materials">{tDetail("materials")}</option>
            <option value="labor">{tDetail("labor")}</option>
            <option value="equipment">{tDetail("equipment")}</option>
            <option value="services">{tDetail("services")}</option>
            <option value="other">{tDetail("other")}</option>
          </Select>
        </div>
        <Input
          id="cost-planned"
          label={tDetail("plannedAmount")}
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
          label={tDetail("actualAmountOptional")}
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
              {tDetail("linkToMilestoneOptional")}
            </label>
            <Select id="cost-milestone" value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} disabled={isSubmitting}>
              <option value="">{tDetail("none")}</option>
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
            {tDetail("cancel")}
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || !title.trim() || isNaN(parseFloat(plannedAmount)) || parseFloat(plannedAmount) < 0}>
            {isSubmitting ? tDetail("adding") : tDetail("add")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
