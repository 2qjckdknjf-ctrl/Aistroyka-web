const STORAGE_KEY = "aistroyka_cockpit_saved_views";

export interface SavedView {
  id: string;
  name: string;
  params: Record<string, string>;
  createdAt: string;
}

export function getSavedViews(): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedView[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveView(name: string, params: Record<string, string>): SavedView {
  const view: SavedView = {
    id: `v_${Date.now()}`,
    name,
    params: { ...params },
    createdAt: new Date().toISOString(),
  };
  const list = getSavedViews();
  list.unshift(view);
  const trimmed = list.slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return view;
}

export function deleteSavedView(id: string): void {
  const list = getSavedViews().filter((v) => v.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
