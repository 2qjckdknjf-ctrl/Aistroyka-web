"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Badge } from "@/components/ui";

type Item = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

async function fetchNotifications(projectId: string): Promise<{ data: Item[]; unread: number }> {
  const res = await fetch(`/api/v1/projects/${projectId}/stakeholder-notifications?limit=30`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load notifications");
  return res.json();
}

export function ClientPortalNotificationsSection({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["stakeholder-notifications", projectId],
    queryFn: () => fetchNotifications(projectId),
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/projects/${projectId}/stakeholder-notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Could not update");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-notifications", projectId] });
    },
  });

  if (q.isPending) {
    return (
      <Card className="p-4">
        <p className="text-sm text-aistroyka-text-tertiary">Loading updates…</p>
      </Card>
    );
  }

  if (q.isError) {
    return null;
  }

  const items = q.data?.data ?? [];
  const unread = q.data?.unread ?? 0;

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 border-l-4 border-l-aistroyka-info">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-aistroyka-text-primary">Updates for you</h3>
        {unread > 0 ? (
          <Badge className="bg-aistroyka-info/15 text-aistroyka-info">{unread} new</Badge>
        ) : null}
      </div>
      <ul className="mt-3 space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className={`rounded border border-aistroyka-border-subtle p-3 text-sm ${
              n.read_at ? "opacity-80" : "bg-aistroyka-surface-raised/50"
            }`}
          >
            <p className="font-medium text-aistroyka-text-primary">{n.title}</p>
            {n.body ? <p className="mt-1 text-aistroyka-text-secondary">{n.body}</p> : null}
            <p className="mt-2 text-xs text-aistroyka-text-tertiary">
              {new Date(n.created_at).toLocaleString()}
            </p>
            {!n.read_at ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-2"
                loading={markRead.isPending}
                onClick={() => markRead.mutate(n.id)}
              >
                Mark as read
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
