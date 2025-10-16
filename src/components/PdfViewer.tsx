import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type PdfViewerProps = {
  bucket: string;
  path: string;
  expiresIn?: number;
  height?: string;
  publicBucket?: boolean;
};

export default function PdfViewer({
  bucket,
  path,
  expiresIn = 300,
  height = "80vh",
  publicBucket = false,
}: PdfViewerProps) {
  const [url, setUrl] = useState<string>("");
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    (async () => {
      setErr("");
      setUrl("");

      try {
        let finalUrl = "";

        if (publicBucket) {
          const { data } = supabase.storage.from(bucket).getPublicUrl(path);
          if (!data?.publicUrl) throw new Error("getPublicUrl returned empty URL");

          const u = new URL(data.publicUrl);
          u.searchParams.set("response-content-type", "application/pdf");
          u.searchParams.set("response-content-disposition", "inline");
          finalUrl = u.toString();
        } else {
          const { data, error } = await supabase
            .storage
            .from(bucket)
            .createSignedUrl(path, expiresIn, { download: false });

          if (error || !data?.signedUrl) {
            throw new Error(`createSignedUrl failed: ${error?.message || "no URL"}`);
          }

          const u = new URL(data.signedUrl);
          u.searchParams.set("response-content-type", "application/pdf");
          u.searchParams.set("response-content-disposition", "inline");
          finalUrl = u.toString();
        }

        setUrl(finalUrl);
      } catch (e: any) {
        setErr(e?.message || String(e));
      }
    })();
  }, [bucket, path, expiresIn, publicBucket]);

  if (err) {
    return (
      <div className="p-3 border rounded-lg bg-destructive/10">
        <p className="font-semibold">Unable to load PDF</p>
        <p className="text-sm mt-2 text-muted-foreground">{err}</p>
        <p className="text-xs mt-2 opacity-70">
          Please check if the file exists and you have permission to access it.
        </p>
      </div>
    );
  }

  if (!url) return <div className="p-3">Loading PDF...</div>;

  return (
    <div className="w-full">
      <div className="mb-2 flex gap-8">
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Open in new tab
        </a>
        <a href={url} download className="text-primary hover:underline">
          Download
        </a>
      </div>

      <iframe
        title="PDF Preview"
        src={url}
        style={{ width: "100%", height, border: "1px solid #ddd", borderRadius: 8 }}
      />
    </div>
  );
}
