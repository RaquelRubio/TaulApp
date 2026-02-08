const KEY = "hereat:favorites";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

export function toggleFavorite(id: string): string[] {
  const current = getFavorites();
  const set = new Set(current);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  const next = Array.from(set);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearFavorites() {
  localStorage.removeItem(KEY);
}
