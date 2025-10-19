import { useEffect, useState, useMemo } from "react";
import { listEntries } from "@/integrations/api";
import { Link } from "react-router-dom";

type Row = {
  id: string;
  reference?: string;
  assetName: string;
  assetOwnerName: string;
  classification: string;
  transportMode: string;
  createdAt?: string;
};

export default function AdminList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await listEntries(); // Expect an array of entries
        // Map defensively to expected columns
        const mapped = (data ?? []).map((d: any) => ({
          id: String(d.id ?? d._id),
          reference: d.reference ?? d.ref ?? null,
          assetName: d.assetName ?? d.asset?.name ?? "",
          assetOwnerName: d.assetOwnerName ?? d.owner?.name ?? "",
          classification: d.classification ?? "Official",
          transportMode: d.transportMode ?? d.mode ?? "",
          createdAt: d.createdAt ?? d.created_at ?? null,
        })) as Row[];
        setRows(mapped);
      } catch (e: any) {
        setErr(e?.message || "Failed to load entries.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(r =>
      [r.reference, r.assetName, r.assetOwnerName, r.classification, r.transportMode]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(term))
    );
  }, [q, rows]);

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin — Requests</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by ref, asset, owner…"
          className="w-64 rounded-md border p-2"
        />
      </div>

      {loading && <div className="rounded border bg-white p-4">Loading…</div>}
      {err && <div className="rounded border bg-red-50 p-4 text-red-800">{err}</div>}

      {!loading && !err && (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3">Reference</th>
                <th className="p-3">Asset</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Created</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 font-mono">{r.reference ?? "—"}</td>
                  <td className="p-3">{r.assetName}</td>
                  <td className="p-3">{r.assetOwnerName}</td>
                  <td className="p-3">{r.transportMode}</td>
                  <td className="p-3">{r.classification}</td>
                  <td className="p-3">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
                  <td className="p-3">
                    <Link
                      to={`/admin/detail/${encodeURIComponent(r.id)}`}
                      className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-500" colSpan={7}>No matches.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
