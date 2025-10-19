// src/pages/Form.tsx

// keep your alias if supported; otherwise switch to a relative import
import { saveEntry } from "@/integrations/api";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import desLogo from '@/assets/des-logo.jfif';

const TRANSPORT_GROUPS = [
  'BASIC DRAWING', 'PICTURES', 'ROAD', 'HET', 'EPLS', 'RAIL',
  'AMPHIBIOUS', 'SLINGING', 'ISO CONTAINER', 'MET', 'MAN SV 6T MM',
  'MAN SV 9T MM', 'MAN SV 15T MM', 'PLS', 'MAN SV 9T IMM', 'AIR'
];

type SaveResponse = {
  id: string;
  reference: string; // e.g. TDS-2025-00123
};

export default function Form() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [transportFiles, setTransportFiles] = useState<Record<string, File | null>>({});
  const [supportingFiles, setSupportingFiles] = useState<FileList | null>(null);

  const [termsAccepted, setTermsAccepted] = useState({
    ssrApproval: false,
    authorisedPerson: false,
    dataResponsibility: false,
    reviewResponsibility: false,
  });

  const [formData, setFormData] = useState({
    ssr_name: '',
    ssr_email: '',
    designation: '',
    nsn: '',
    asset_code: '',
    short_name: '',
    length: '',
    width: '',
    height: '',
    unladen_weight: '',
    laden_weight: '',
    alest: '',
    lims_25: '',
    lims_28: '',
    out_of_service_date: '',
    classification: '',
    mlc: '',
    licence: '',
    crew_number: '',
    passenger_capacity: '',
    range: '',
    fuel_capacity: '',
    single_carriage: '',
    dual_carriage: '',
    max_speed: '',
    service: 'Army',
    owner_nation: 'UK',
    ric_code: '',
    asset_type: 'A Vehicles',
  });

  // Pre-fill email from logged-in user if present
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        ssr_email: user.email || '',
      }));
    }
  }, [user]);

  // ---------- Helpers for calculations ----------
  const parseM = (v: string): number => {
    if (!v) return NaN;
    return parseFloat(v.toLowerCase().replace(/\s*m$/,'').replace(',', '.'));
  };

  const parseKg = (v: string): number => {
    if (!v) return NaN;
    return parseFloat(v.toLowerCase().replace(/\s*kg$/, '').replace(',', '.'));
  };

  const fmt = (n: number): string => (isNaN(n) ? '' : (Math.round(n * 100) / 100).toString());

  const calcALEST = (l: number, w: number, h: number, kg: number): string => {
    if ([l, w, h].some(isNaN)) return '';
    const cubic = l * w * h;
    if (!cubic) return '';
    const X = 15 / (56 / cubic);
    let v = X;
    if (!isNaN(kg) && kg > 0) {
      const Y = 15 / (13536 / kg);
      v = Math.max(X, Y);
    }
    return fmt(v);
  };

  const calcLIMS25 = (l: number, w: number): string => {
    if ([l, w].some(isNaN)) return '';
    if (w <= 2.5) return fmt(l);
    return fmt(l * 2);
  };

  const calcLIMS28 = (l: number, w: number): string => {
    if ([l, w].some(isNaN)) return '';
    if (w <= 2.5) return fmt(l);
    if (w >= 2.8) return fmt(l * 2);
    return fmt(l);
  };

  // Auto-calc ALEST/LIMS when inputs change
  useEffect(() => {
    const l = parseM(formData.length);
    const w = parseM(formData.width);
    const h = parseM(formData.height);
    const kg = parseKg(formData.unladen_weight);

    setFormData(prev => ({
      ...prev,
      alest: calcALEST(l, w, h, kg),
      lims_25: calcLIMS25(l, w),
      lims_28: calcLIMS28(l, w),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.length, formData.width, formData.height, formData.unladen_weight]);

  // ---------- Validation + change handlers ----------
  const handleInputChange = (field: string, value: string) => {
    let validatedValue = value;

    switch (field) {
      case 'ssr_name':
        // letters + space only
        validatedValue = value.replace(/[^a-zA-Z\s]/g, '');
        break;

      case 'length':
      case 'width':
      case 'height':
      case 'unladen_weight':
      case 'laden_weight':
        // numbers with up to 2 dp
        if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
          validatedValue = value;
        } else {
          return;
        }
        break;

      case 'range':
      case 'fuel_capacity':
      case 'single_carriage':
      case 'dual_carriage':
      case 'max_speed':
        validatedValue = value.replace(/[^0-9]/g, '');
        break;
    }

    setFormData(prev => ({ ...prev, [field]: validatedValue }));
  };

  const handleReset = () => {
    setFormData({
      ssr_name: '',
      ssr_email: user?.email || '',
      designation: '',
      nsn: '',
      asset_code: '',
      short_name: '',
      length: '',
      width: '',
      height: '',
      unladen_weight: '',
      laden_weight: '',
      alest: '',
      lims_25: '',
      lims_28: '',
      out_of_service_date: '',
      classification: '',
      mlc: '',
      licence: '',
      crew_number: '',
      passenger_capacity: '',
      range: '',
      fuel_capacity: '',
      single_carriage: '',
      dual_carriage: '',
      max_speed: '',
      service: 'Army',
      owner_nation: 'UK',
      ric_code: '',
      asset_type: 'A Vehicles',
    });
    setTransportFiles({});
    setSupportingFiles(null);
    setTermsAccepted({
      ssrApproval: false,
      authorisedPerson: false,
      dataResponsibility: false,
      reviewResponsibility: false,
    });
  };

  // ---------- Submit via saveEntry() ----------
  const handleSubmit = async () => {
    // Required fields
    const requiredFields = [
      { field: 'ssr_name', label: 'SSR/SR Name' },
      { field: 'ssr_email', label: 'SSR/SR Email' },
      { field: 'designation', label: 'Designation' },
      { field: 'nsn', label: 'NSN' },
      { field: 'asset_code', label: 'Asset Code' },
      { field: 'short_name', label: 'Short Name' },
      { field: 'length', label: 'Length' },
      { field: 'width', label: 'Width' },
      { field: 'height', label: 'Height' },
      { field: 'unladen_weight', label: 'Unladen Weight' },
      { field: 'laden_weight', label: 'Laden Weight' },
      { field: 'out_of_service_date', label: 'Out of Service Date' },
      { field: 'classification', label: 'Classification' },
      { field: 'mlc', label: 'MLC' },
      { field: 'service', label: 'Service' },
      { field: 'owner_nation', label: 'Owner Nation' },
      { field: 'ric_code', label: 'RIC Code' },
      { field: 'asset_type', label: 'Asset Type' },
    ];

    const missingFields = requiredFields.filter(({ field }) => !formData[field as keyof typeof formData]);
    if (missingFields.length > 0) {
      toast({
        title: 'Missing Required Fields',
        description: `Please fill in: ${missingFields.map(f => f.label).join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    // Declarations
    const allTermsAccepted = Object.values(termsAccepted).every(Boolean);
    if (!allTermsAccepted) {
      toast({
        title: 'Validation Error',
        description: 'Please accept all declarations and acknowledgements to proceed.',
        variant: 'destructive',
      });
      return;
    }

    // Supporting documents
    if (!supportingFiles || supportingFiles.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please attach SSR/SR email approval as a supporting document.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Build payload expected by your API
      const payload = {
        ...formData,
        submittedAt: new Date().toISOString(),
        submitted_by_email: user?.email ?? null,
        status: 'Pending',
        ssr_approval_confirmed: termsAccepted.ssrApproval,
        authorised_person_confirmed: termsAccepted.authorisedPerson,
        data_responsibility_confirmed: termsAccepted.dataResponsibility,
        review_responsibility_confirmed: termsAccepted.reviewResponsibility,
      };

      // Collect files (prefix transport category in filename so admins can see context)
      const fileBundle: File[] = [];

      Object.entries(transportFiles).forEach(([category, file]) => {
        if (file) {
          const renamed = new File([file], `${category.replace(/\s+/g, '_')}-${file.name}`, { type: file.type });
          fileBundle.push(renamed);
        }
      });

      if (supportingFiles) {
        Array.from(supportingFiles).forEach((file) => fileBundle.push(file));
      }

      // ---- CALL YOUR INTEGRATION HELPER ----
      // Preferred signature (recommended):
      //   saveEntry(payload: Record<string, any>, files?: File[]): Promise<SaveResponse>
      //
      // If your saveEntry expects FormData instead, see the commented block below.

      const res: SaveResponse = await saveEntry(payload, fileBundle);

      /* -------------- ALTERNATIVE (if your saveEntry uses FormData) --------------
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v ?? "")));
      fileBundle.forEach((f) => fd.append("files", f, f.name));
      const res: SaveResponse = await saveEntry(fd) as any;
      --------------------------------------------------------------------------- */

      toast({
        title: 'Success!',
        description: `Request submitted with reference: ${res.reference}`,
      });

      // Navigate like your original behaviour
      if (user) {
        navigate('/');
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message ?? 'Failed to submit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {user && <Header />}
      {!user && (
        <header className="bg-white border-b-4 border-primary shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={desLogo} alt="Ministry of Defence & DE&S" className="h-12" />
                <div className="border-l-2 border-primary/30 pl-4">
                  <h1 className="text-xl font-bold text-primary">TDS Management System</h1>
                  <p className="text-xs text-muted-foreground">JSP 800 Vol 7 - Tie Down Scheme Portal</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/auth')}
                className="border-primary/30 hover:bg-primary/5"
              >
                Staff Login
              </Button>
            </div>
          </div>
        </header>
      )}

      <main className="container mx-auto p-6">
        <Card className="shadow-2xl border-2 max-w-6xl mx-auto">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-b-2 border-primary/10">
            <CardTitle className="text-3xl font-bold text-center">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Tie Down Scheme (TDS) Entry Request
              </span>
            </CardTitle>
            <p className="text-center text-muted-foreground mt-2 text-sm">
              Please complete all mandatory fields marked with <span className="text-destructive font-bold">*</span>
            </p>
          </CardHeader>

          <CardContent className="space-y-8 pt-8">
            {/* 1) Asset Owner Details */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-6 pb-3 text-xl font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">1</span>
                Asset Owner Details
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="ssr_name">SSR/SR Name *</Label>
                  <Input
                    id="ssr_name"
                    value={formData.ssr_name}
                    onChange={(e) => handleInputChange('ssr_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ssr_email">SSR Email *</Label>
                  <Input
                    id="ssr_email"
                    type="email"
                    value={formData.ssr_email}
                    onChange={(e) => handleInputChange('ssr_email', e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>

            {/* 2) Asset Details */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-6 pb-3 text-xl font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">2</span>
                Asset Details
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Designation *</Label>
                  <Input
                    value={formData.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>NSN *</Label>
                  <Input
                    value={formData.nsn}
                    onChange={(e) => handleInputChange('nsn', e.target.value.replace(/\D/g, '').slice(0, 13))}
                    placeholder="13 digits"
                    required
                  />
                </div>
                <div>
                  <Label>Asset Code *</Label>
                  <Input
                    value={formData.asset_code}
                    onChange={(e) => handleInputChange('asset_code', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Short Name *</Label>
                  <Input
                    value={formData.short_name}
                    onChange={(e) => handleInputChange('short_name', e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>

            {/* 3) Basic Details */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-6 pb-3 text-xl font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">3</span>
                Basic Details
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Length (m) *</Label>
                  <Input
                    value={formData.length}
                    onChange={(e) => handleInputChange('length', e.target.value)}
                    placeholder="e.g., 5.5"
                    required
                  />
                </div>
                <div>
                  <Label>Width (m) *</Label>
                  <Input
                    value={formData.width}
                    onChange={(e) => handleInputChange('width', e.target.value)}
                    placeholder="e.g., 2.4"
                    required
                  />
                </div>
                <div>
                  <Label>Height (m) *</Label>
                  <Input
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    placeholder="e.g., 3.0"
                    required
                  />
                </div>
                <div>
                  <Label>Unladen Weight (kg) *</Label>
                  <Input
                    value={formData.unladen_weight}
                    onChange={(e) => handleInputChange('unladen_weight', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Laden Weight (kg) *</Label>
                  <Input
                    value={formData.laden_weight}
                    onChange={(e) => handleInputChange('laden_weight', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>ALEST (auto-calculated)</Label>
                  <Input value={formData.alest} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>LIMS 2.5 (auto-calculated)</Label>
                  <Input value={formData.lims_25} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>LIMS 2.8 (auto-calculated)</Label>
                  <Input value={formData.lims_28} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>Out of Service Date *</Label>
                  <Input
                    type="date"
                    value={formData.out_of_service_date}
                    onChange={(e) => handleInputChange('out_of_service_date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Classification *</Label>
                  <Select value={formData.classification} onValueChange={(v) => handleInputChange('classification', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Official">Official</SelectItem>
                      <SelectItem value="Official-Sensitive">Official-Sensitive</SelectItem>
                      <SelectItem value="Official Secret">Official Secret</SelectItem>
                      <SelectItem value="Official-Sensitive Secret">Official-Sensitive Secret</SelectItem>
                      <SelectItem value="Unclassified">Unclassified</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>MLC *</Label>
                  <Input
                    value={formData.mlc}
                    onChange={(e) => handleInputChange('mlc', e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>

            {/* 4) Driver Information */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-6 pb-3 text-xl font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">4</span>
                Driver Information
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Licence</Label>
                  <Input
                    value={formData.licence}
                    onChange={(e) => handleInputChange('licence', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Crew Number</Label>
                  <Input
                    value={formData.crew_number}
                    onChange={(e) => handleInputChange('crew_number', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Passenger Capacity</Label>
                  <Input
                    value={formData.passenger_capacity}
                    onChange={(e) => handleInputChange('passenger_capacity', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Range (km)</Label>
                  <Input
                    value={formData.range}
                    onChange={(e) => handleInputChange('range', e.target.value)}
                    placeholder="e.g., 500"
                  />
                </div>
                <div>
                  <Label>Fuel Capacity (L)</Label>
                  <Input
                    value={formData.fuel_capacity}
                    onChange={(e) => handleInputChange('fuel_capacity', e.target.value)}
                    placeholder="e.g., 100"
                  />
                </div>
                <div>
                  <Label>Single Carriage (km)</Label>
                  <Input
                    value={formData.single_carriage}
                    onChange={(e) => handleInputChange('single_carriage', e.target.value)}
                    placeholder="e.g., 300"
                  />
                </div>
                <div>
                  <Label>Dual Carriage (km)</Label>
                  <Input
                    value={formData.dual_carriage}
                    onChange={(e) => handleInputChange('dual_carriage', e.target.value)}
                    placeholder="e.g., 400"
                  />
                </div>
                <div>
                  <Label>Max Speed (km/h)</Label>
                  <Input
                    value={formData.max_speed}
                    onChange={(e) => handleInputChange('max_speed', e.target.value)}
                    placeholder="e.g., 120"
                  />
                </div>
              </div>
            </section>

            {/* 5) ADAMS */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-6 pb-3 text-xl font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">5</span>
                ADAMS
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Service *</Label>
                  <Select value={formData.service} onValueChange={(v) => handleInputChange('service', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Army">Army</SelectItem>
                      <SelectItem value="Navy">Navy</SelectItem>
                      <SelectItem value="Air Force">Air Force</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Owner Nation *</Label>
                  <Select value={formData.owner_nation} onValueChange={(v) => handleInputChange('owner_nation', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>RIC Code *</Label>
                  <Input
                    value={formData.ric_code}
                    onChange={(e) => handleInputChange('ric_code', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Asset Type *</Label>
                  <Select value={formData.asset_type} onValueChange={(v) => handleInputChange('asset_type', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A Vehicles">A Vehicles</SelectItem>
                      <SelectItem value="B Vehicles">B Vehicles</SelectItem>
                      <SelectItem value="C Vehicles">C Vehicles</SelectItem>
                      <SelectItem value="E Vehicles">E Vehicles</SelectItem>
                      <SelectItem value="P Vehicles">P Vehicles</SelectItem>
                      <SelectItem value="Z Equipment">Z Equipment</SelectItem>
                      <SelectItem value="R Equipment">R Equipment</SelectItem>
                      <SelectItem value="Weapons">Weapons</SelectItem>
                      <SelectItem value="Aircraft & Helicopters">Aircraft & Helicopters</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* 6) Transportation Data */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-6 pb-3 text-xl font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">6</span>
                Transportation Data
              </h3>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {TRANSPORT_GROUPS.map(group => (
                  <Label
                    key={group}
                    className="flex cursor-pointer flex-col items-start justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 px-3 py-2 h-auto min-h-[3rem] w-full transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={transportFiles[group] ? "text-primary shrink-0" : "text-muted-foreground shrink-0"}
                      >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="text-xs font-medium text-left truncate flex-1">{group}</span>
                    </div>
                    {transportFiles[group] && (
                      <span className="text-[10px] text-primary font-medium">✓ Uploaded</span>
                    )}
                    <Input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setTransportFiles(prev => ({ ...prev, [group]: e.target.files![0] }));
                        }
                      }}
                    />
                  </Label>
                ))}
              </div>
            </section>

            {/* 7) Terms and Conditions */}
            <section className="bg-destructive/5 rounded-lg p-6 border-2 border-destructive/30 shadow-md">
              <h3 className="mb-6 pb-3 text-xl font-bold text-destructive flex items-center gap-3 border-b-2 border-destructive/20">
                <span className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </span>
                Declaration and Acknowledgement *
              </h3>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-destructive flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  All declarations below must be acknowledged and at least one supporting document (SSR/SR email approval) must be attached before submission.
                </p>
              </div>
              <div className="space-y-5">
                <div className="flex items-start gap-3 bg-white rounded-lg p-4 border border-primary/20 hover:border-primary/40 transition-colors">
                  <input
                    type="checkbox"
                    id="ssrApproval"
                    checked={termsAccepted.ssrApproval}
                    onChange={(e) => setTermsAccepted(prev => ({ ...prev, ssrApproval: e.target.checked }))}
                    className="mt-1 h-5 w-5 rounded border-primary/30 text-primary focus:ring-primary"
                    required
                  />
                  <Label htmlFor="ssrApproval" className="cursor-pointer text-sm font-normal leading-relaxed">
                    I confirm that Senior Safety Responsible or Safety Responsible (SSR/SR) approval has been obtained and attached to this request, and that this submission has been duly approved by them.
                  </Label>
                </div>
                <div className="flex items-start gap-3 bg-white rounded-lg p-4 border border-primary/20 hover:border-primary/40 transition-colors">
                  <input
                    type="checkbox"
                    id="authorisedPerson"
                    checked={termsAccepted.authorisedPerson}
                    onChange={(e) => setTermsAccepted(prev => ({ ...prev, authorisedPerson: e.target.checked }))}
                    className="mt-1 h-5 w-5 rounded border-primary/30 text-primary focus:ring-primary"
                    required
                  />
                  <Label htmlFor="authorisedPerson" className="cursor-pointer text-sm font-normal leading-relaxed">
                    I confirm that I am an authorised representative, duly appointed by the SSR/SR, to submit this Tie Down Scheme (TDS) entry request on their behalf.
                  </Label>
                </div>
                <div className="flex items-start gap-3 bg-white rounded-lg p-4 border border-primary/20 hover:border-primary/40 transition-colors">
                  <input
                    type="checkbox"
                    id="dataResponsibility"
                    checked={termsAccepted.dataResponsibility}
                    onChange={(e) => setTermsAccepted(prev => ({ ...prev, dataResponsibility: e.target.checked }))}
                    className="mt-1 h-5 w-5 rounded border-primary/30 text-primary focus:ring-primary"
                    required
                  />
                  <Label htmlFor="dataResponsibility" className="cursor-pointer text-sm font-normal leading-relaxed">
                    I acknowledge that the Delivery Team (DT) assumes full responsibility for the accuracy and completeness of all data provided in this submission, and that the Quality, Safety, Environment and Engineering (QSEE) team bears no liability for any inaccuracies or errors in the supplied information.
                  </Label>
                </div>
                <div className="flex items-start gap-3 bg-white rounded-lg p-4 border border-primary/20 hover:border-primary/40 transition-colors">
                  <input
                    type="checkbox"
                    id="reviewResponsibility"
                    checked={termsAccepted.reviewResponsibility}
                    onChange={(e) => setTermsAccepted(prev => ({ ...prev, reviewResponsibility: e.target.checked }))}
                    className="mt-1 h-5 w-5 rounded border-primary/30 text-primary focus:ring-primary"
                    required
                  />
                  <Label htmlFor="reviewResponsibility" className="cursor-pointer text-sm font-normal leading-relaxed">
                    I acknowledge that the DT is solely responsible for conducting thorough reviews of all TDS entries upon creation to verify data accuracy and identify any discrepancies within the database.
                  </Label>
                </div>
              </div>
            </section>

            {/* 8) Supporting Documents */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-6 pb-3 text-xl font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">7</span>
                Supporting Documents *
              </h3>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 hover:border-primary/50 transition-colors bg-primary/5">
                  <Input
                    type="file"
                    multiple
                    onChange={(e) => setSupportingFiles(e.target.files)}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Please upload SSR/SR email approval and any other relevant documents
                  </p>
                </div>
                {supportingFiles && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Uploaded files:</p>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                      {Array.from(supportingFiles).map(f => (
                        <div key={f.name} className="text-sm flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          {f.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Footer buttons */}
            <div className="flex justify-between items-center gap-4 pt-8 border-t-2 border-primary/10">
              {user && (
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  size="lg"
                  className="min-w-32 border-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              )}
              <div className="flex gap-4 ml-auto">
                <Button
                  onClick={handleReset}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                  className="min-w-32 border-2"
                >
                  Reset Form
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    !Object.values(termsAccepted).every(term => term === true) ||
                    !supportingFiles ||
                    supportingFiles.length === 0
                  }
                  size="lg"
                  className="min-w-40 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
