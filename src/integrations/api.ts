// src/integrations/api.ts
export type Entry = Record<string, any>;

export async function saveEntry(data: Entry) {
  const res = await fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save entry");
  return res.json(); // { ok:true, id, when }
}

export async function listEntries() {
  const res = await fetch("/api/entries");
  if (!res.ok) throw new Error("Failed to list entries");
  return res.json() as Promise<{ ok: boolean; items: { id: string; size?: number }[] }>;
}

export async function getEntry(id: string) {
  const res = await fetch(`/api/entries/${id}`);
  if (!res.ok) throw new Error("Failed to fetch entry");
  return res.json() as Promise<{ ok: boolean; entry: Entry }>;
}
