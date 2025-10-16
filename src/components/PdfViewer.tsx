import { useEffect, useRef, useState } from "react";
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
  const [httpsUrl, setHttpsUrl] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const objectUrlRef = useRef<string>("");

  useEffect(() => {
    (async () => {
      setErr("");
      setHttpsUrl("");

      try {
        // 1) Get an https URL (signed or public)
        let signed: string;
        if (publicBucket) {
          const { data } = supabase.storage.from(bucket).getPublicUrl(path);
          if (!data?.publicUrl) throw new Error("getPublicUrl returned empty URL");
          const u = new URL(data.publicUrl);
          u.searchParams.set("response-content-type", "application/pdf");
          u.searchParams.set("response-content-disposition", "inline");
          signed = u.toString();
        } else {
          const { data, error } = await supabase
            .storage
            .from(bucket)
            .createSignedUrl(path, expiresIn, { download: false });
          if (error || !data?.signedUrl)
            throw new Error(`createSignedUrl failed: ${error?.message || "no URL"}`);
          const u = new URL(data.signedUrl);
          u.searchParams.set("response-content-type", "application/pdf");
          u.searchParams.set("response-content-disposition", "inline");
          signed = u.toString();
        }
        setHttpsUrl(signed);

        // 2) Fetch -> blob -> object URL (so iframe uses blob:, avoiding CSP frame-src issues)
        const res = await fetch(signed);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        const blob = await res.blob();

        // Cleanup previous object URL
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = URL.createObjectURL(blob);

        // Set the iframe src to the blob URL
        const iframe = document.getElementById("pdfFrame") as HTMLIFrameElement | null;
        if (iframe) iframe.src = objectUrlRef.current;
      } catch (e: any) {
        setErr(e?.message || String(e));
      }
    })();

    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
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

  return (
    <div className="w-full">
      <div className="mb-2 flex gap-8">
        {httpsUrl && (
          <>
            <a href={httpsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Open in new tab
            </a>
            <a href={httpsUrl} download className="text-primary hover:underline">
              Download
            </a>
          </>
        )}
      </div>
      <iframe
        id="pdfFrame"
        title="PDF Preview"
        style={{ width: "100%", height, border: "1px solid #ddd", borderRadius: 8 }}
      />
    </div>
  );
}
