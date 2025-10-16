import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type PdfViewerProps = {
  bucket: string;
  path: string;
  expiresIn?: number;
  height?: string;
};

export default function PdfViewer({
  bucket,
  path,
  expiresIn = 300,
  height = "80vh",
}: PdfViewerProps) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(path, expiresIn, { download: false });

      if (error || !data?.signedUrl) {
        console.error("Signed URL error:", error);
        setUrl("");
        return;
      }

      // Force HTTPS inline PDF preview (NO blob:)
      const u = new URL(data.signedUrl);
      u.searchParams.set("response-content-type", "application/pdf");
      u.searchParams.set("response-content-disposition", "inline");

      setUrl(u.toString());
    })();
  }, [bucket, path, expiresIn]);

  if (!url) return <div>Unable to load PDF.</div>;

  return (
    <div className="w-full">
      <div className="mb-2 flex gap-8">
        <a href={url} target="_blank" rel="noopener noreferrer">Open in new tab</a>
        <a href={url} download>Download</a>
      </div>

      <iframe
        title="PDF Preview"
        src={url}
        style={{ width: "100%", height, border: "1px solid #ddd", borderRadius: 8 }}
      />
    </div>
  );
}
