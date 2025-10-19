import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEntry } from "@/integrations/api";

export default function AdminDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const d = await getEntry(id);
        setData(d);
      } catch (e: any) {
        setErr(e?.message || "Failed to load entry.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (!id) return <div className="p-4">Invalid id.</div>;

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin — Request Detail</h1>
        <Link to="/admin" className="rounded border px-3 py-1 hover:bg-gray-50">Back</Link>
      </div>

      {loading && <div className="rounded border bg-white p-4">Loading…</div>}
      {err && <div className="rounded border bg-red-50 p-4 text-red-800">{err}</div>}

      {data && (
        <div className="space-y-6">
          <Card title="Summary">
            <KV label="Reference" value={data.reference ?? data.id} mono />
            <KV label="Created" value={data.createdAt ? new Date(data.createdAt).toLocaleString() : "—"} />
            <KV label="Classification" value={data.classification} />
            <KV label="Transport Mode" value={data.transportMode} />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Asset Owner Details">
              <KV label="Owner" value={data.assetOwnerName} />
              <KV label="Owner Email" value={data.assetOwnerEmail} />
              <KV label="Organisation/Unit" value={data.organisationUnit} />
            </Card>

            <Card title="Driver Information">
              <KV label="SSR / SR" value={data.ssrName} />
              <KV label="Driver Name" value={data.driverName} />
              <KV label="Driver Email" value={data.driverEmail} />
              <KV label="Required By" value={data.requiredByDate} />
            </Card>
          </div>

          <Card title="Asset Details">
            <KV label="Asset Name" value={data.assetName} />
            <KV label="Asset Code" value={data.assetCode} />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <KV label="Length (m)" value={fmtNum(data.length_m)} />
              <KV label="Width (m)" value={fmtNum(data.width_m)} />
              <KV label="Height (m)" value={fmtNum(data.height_m)} />
              <KV label="Weight (kg)" value={fmtNum(data.weight_kg)} />
            </div>
            <KV label="Notes" value={data.notes} />
          </Card>

          <Card title="Attachments">
            {Array.isArray(data.files) && data.files.length > 0 ? (
              <ul className="list-disc pl-5">
                {data.files.map((f: any, i: number) => {
                  // We accept either {name,url} or a string URL
                  const name = f?.name ?? `file-${i + 1}`;
                  const url = f?.url ?? f;
                  return (
                    <li key={i}>
                      <a className="text-blue-700 underline" href={url} target="_blank" rel="noreferrer">
                        {name}
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-sm text-gray-500">No attachments.</div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function KV({ label, value, mono }: { label: string; value?: any; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-44 shrink-0 text-sm text-gray-600">{label}</div>
      <div className={`text-sm ${mono ? "font-mono" : ""}`}>{value ?? "—"}</div>
    </div>
  );
}

function fmtNum(n: any) {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return String(num);
}
