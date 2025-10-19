import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Helpers
const nameRegex = /^[A-Za-z]+(?:\.?\s[A-Za-z]+)*\.?$/; // letters, spaces, one optional dot segment (e.g., "Mr. John", "S Rani", "Rani")
const mNumberRegex = /^(?:\d{1,3})(?:\.\d{1,2})?$/;    // 0–999 with up to 2 dp
const toMetersDisplay = (v: string) => (v ? `${v} m` : "");

type FormState = {
  // Left column
  assetOwnerName: string;
  assetOwnerEmail: string;
  organisationUnit: string;

  assetName: string;
  assetCode?: string;
  classification: "Official" | "Official-Sensitive" | "Secret" | "Top-Secret";

  length_m: string;
  width_m: string;
  height_m: string;
  weight_kg?: string;
  notes?: string;

  // Right column
  ssrName: string;          // SSR / SR Name
  driverName?: string;
  driverEmail?: string;
  transportMode: "Road" | "Rail" | "Air" | "Sea" | "Container";
  requiredByDate?: string;  // ISO date
};

type ValidationErrors = Partial<Record<keyof FormState, string>>;

export default function Form() {
  const { user } = useAuth();
  const [values, setValues] = useState<FormState>({
    assetOwnerName: "",
    assetOwnerEmail: "",
    organisationUnit: "",

    assetName: "",
    assetCode: "",
    classification: "Official",

    length_m: "",
    width_m: "",
    height_m: "",
    weight_kg: "",
    notes: "",

    ssrName: "",
    driverName: "",
    driverEmail: "",
    transportMode: "Road",
    requiredByDate: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [refId, setRefId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live validation
  const errors: ValidationErrors = useMemo(() => {
    const e: ValidationErrors = {};
    if (!values.assetOwnerName.trim()) e.assetOwnerName = "Required.";
    if (!values.assetOwnerEmail.trim()) e.assetOwnerEmail = "Required.";
    else if (!/^\S+@\S+\.\S+$/.test(values.assetOwnerEmail)) e.assetOwnerEmail = "Invalid email.";

    if (!values.assetName.trim()) e.assetName = "Required.";
    if (!values.ssrName.trim()) e.ssrName = "Required.";
    else if (!nameRegex.test(values.ssrName.trim())) {
      e.ssrName = "Only letters, spaces, and at most one optional dot (e.g., 'Mr. A', 'S Rani', 'Rani').";
    }

    // L/W/H must be ≤3 digits before decimal and ≤2 after; non-negative; display 'm' after entry
    if (!values.length_m.trim()) e.length_m = "Required.";
    else if (!mNumberRegex.test(values.length_m)) e.length_m = "Max 3 digits before and 2 after decimal (e.g., 12.34).";

    if (!values.width_m.trim()) e.width_m = "Required.";
    else if (!mNumberRegex.test(values.width_m)) e.width_m = "Max 3 digits before and 2 after decimal.";

    if (!values.height_m.trim()) e.height_m = "Required.";
    else if (!mNumberRegex.test(values.height_m)) e.height_m = "Max 3 digits before and 2 after decimal.";

    if (values.weight_kg && !/^\d+(\.\d{1,2})?$/.test(values.weight_kg)) {
      e.weight_kg = "Use numbers only (up to 2 decimals).";
    }

    if (values.driverEmail && !/^\S+@\S+\.\S+$/.test(values.driverEmail)) {
      e.driverEmail = "Invalid email.";
    }

    return e;
  }, [values]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  function update<K extends keyof FormState>(key: K, v: FormState[K]) {
    setValues(s => ({ ...s, [key]: v }));
  }

  function onFilesChange(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const merged = [...prev];
      for (const f of arr) if (!existingNames.has(f.name)) merged.push(f);
      return merged;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRefId(null);
    if (!isValid) {
      setError("Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    try {
      // Upload files to Supabase storage first
      const uploadedFiles: string[] = [];
      if (files.length > 0) {
        for (const file of files) {
          const fileName = `${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('supporting-documents')
            .upload(fileName, file);
          
          if (uploadError) throw uploadError;
          uploadedFiles.push(fileName);
        }
      }

      // Insert into tds_entries table
      const { data, error: insertError } = await supabase
        .from('tds_entries')
        .insert({
          submitted_by: user?.id,
          short_name: values.assetName,
          asset_code: values.assetCode || '',
          designation: values.assetName,
          nsn: '',
          ssr_name: values.ssrName,
          ssr_email: values.assetOwnerEmail,
          classification: values.classification,
          service: values.transportMode,
          asset_type: values.transportMode,
          owner_nation: '',
          ric_code: '',
          alest: '',
          lims_25: '',
          lims_28: '',
          mlc: '',
          length: values.length_m,
          width: values.width_m,
          height: values.height_m,
          unladen_weight: values.weight_kg || '0',
          laden_weight: values.weight_kg || '0',
          out_of_service_date: values.requiredByDate || new Date().toISOString().split('T')[0],
          status: 'Pending',
        } as any)
        .select('id, reference')
        .single();

      if (insertError) throw insertError;

      const reference = data?.reference || data?.id;
      setRefId(reference);
      
      // Reset form
      setValues(s => ({
        ...s,
        assetOwnerName: "",
        assetOwnerEmail: "",
        organisationUnit: "",
        assetName: "",
        assetCode: "",
        length_m: "",
        width_m: "",
        height_m: "",
        weight_kg: "",
        notes: "",
      }));
      setFiles([]);
    } catch (err: any) {
      setError(err?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="text-2xl font-semibold mb-4">TDS Management — New Request</h1>

      {/* Success / Error banners */}
      {refId && (
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3">
          <div className="font-medium">Submitted successfully.</div>
          <div>Reference: <span className="font-mono">{refId}</span></div>
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3">
          <div className="font-medium">There’s a problem</div>
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-5">
          <Section title="Asset Owner Details">
            <Field
              label="Asset Owner Name"
              required
              value={values.assetOwnerName}
              onChange={v => update("assetOwnerName", v)}
              error={errors.assetOwnerName}
            />
            <Field
              label="Asset Owner Email"
              type="email"
              required
              value={values.assetOwnerEmail}
              onChange={v => update("assetOwnerEmail", v)}
              error={errors.assetOwnerEmail}
            />
            <Field
              label="Organisation / Unit"
              value={values.organisationUnit}
              onChange={v => update("organisationUnit", v)}
            />
          </Section>

          <Section title="Asset Details">
            <Field
              label="Asset Name"
              required
              value={values.assetName}
              onChange={v => update("assetName", v)}
              error={errors.assetName}
            />
            <Field
              label="Asset Code (optional)"
              value={values.assetCode || ""}
              onChange={v => update("assetCode", v)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field
                label="Length"
                required
                placeholder="e.g., 4.25"
                value={values.length_m}
                onChange={v => update("length_m", v.replace(/[^\d.]/g, ""))}
                suffix={toMetersDisplay(values.length_m)}
                error={errors.length_m}
              />
              <Field
                label="Width"
                required
                placeholder="e.g., 1.95"
                value={values.width_m}
                onChange={v => update("width_m", v.replace(/[^\d.]/g, ""))}
                suffix={toMetersDisplay(values.width_m)}
                error={errors.width_m}
              />
              <Field
                label="Height"
                required
                placeholder="e.g., 2.60"
                value={values.height_m}
                onChange={v => update("height_m", v.replace(/[^\d.]/g, ""))}
                suffix={toMetersDisplay(values.height_m)}
                error={errors.height_m}
              />
            </div>
            <Field
              label="Weight (kg, optional)"
              placeholder="e.g., 1280"
              value={values.weight_kg || ""}
              onChange={v => update("weight_kg", v.replace(/[^\d.]/g, ""))}
              error={errors.weight_kg}
            />
            <Field
              label="Notes / Context (optional)"
              textarea
              value={values.notes || ""}
              onChange={v => update("notes", v)}
            />
          </Section>

          <Section title="Classification">
            <select
              className="w-full rounded-md border p-2"
              value={values.classification}
              onChange={(e) => update("classification", e.target.value as FormState["classification"])}
            >
              <option value="Official">Official</option>
              <option value="Official-Sensitive">Official-Sensitive</option>
              <option value="Secret">Secret</option>
              <option value="Top-Secret">Top-Secret</option>
            </select>
          </Section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">
          <Section title="Driver Information">
            <Field
              label="SSR / SR Name"
              required
              placeholder="e.g., Rani Sindaram or Mr. Rani"
              value={values.ssrName}
              onChange={v => update("ssrName", v)}
              error={errors.ssrName}
              helper="Only letters, spaces and one optional dot."
            />
            <Field
              label="Driver Name (optional)"
              value={values.driverName || ""}
              onChange={v => update("driverName", v)}
            />
            <Field
              label="Driver Email (optional)"
              type="email"
              value={values.driverEmail || ""}
              onChange={v => update("driverEmail", v)}
              error={errors.driverEmail}
            />
          </Section>

          <Section title="Transportation Data">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Mode</label>
                <select
                  className="w-full rounded-md border p-2"
                  value={values.transportMode}
                  onChange={(e) => update("transportMode", e.target.value as FormState["transportMode"])}
                >
                  <option>Road</option>
                  <option>Rail</option>
                  <option>Air</option>
                  <option>Sea</option>
                  <option>Container</option>
                </select>
              </div>
              <Field
                label="Required By (optional)"
                type="date"
                value={values.requiredByDate || ""}
                onChange={v => update("requiredByDate", v)}
              />
            </div>
          </Section>

          <Section title="File Upload + Send">
            <div className="space-y-2">
              <label className="text-sm">Attach drawings / photos / TDS evidence (multiple)</label>
              <input
                type="file"
                multiple
                onChange={(e) => onFilesChange(e.target.files)}
                className="w-full rounded border p-2"
              />
              {files.length > 0 && (
                <ul className="text-sm list-disc pl-5">
                  {files.map(f => <li key={f.name}>{f.name}</li>)}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </Section>
        </div>
      </form>
    </div>
  );
}

/* ---------------- UI bits ---------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  error,
  placeholder,
  textarea,
  helper,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  textarea?: boolean;
  helper?: string;
  suffix?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {textarea ? (
        <textarea
          className={`w-full rounded-md border p-2 ${error ? "border-red-500" : ""}`}
          rows={4}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="relative">
          <input
            className={`w-full rounded-md border p-2 pr-16 ${error ? "border-red-500" : ""}`}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {suffix && (
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              {suffix}
            </div>
          )}
        </div>
      )}
      {helper && !error && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
