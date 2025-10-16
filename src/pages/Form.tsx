import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TRANSPORT_GROUPS = [
  'BASIC DRAWING', 'PICTURES', 'ROAD', 'HET', 'EPLS', 'RAIL',
  'AMPHIBIOUS', 'SLINGING', 'ISO CONTAINER', 'MET', 'MAN SV 6T MM',
  'MAN SV 9T MM', 'MAN SV 15T MM', 'PLS', 'MAN SV 9T IMM', 'AIR'
];

export default function Form() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [transportFiles, setTransportFiles] = useState<Record<string, File | null>>({});
  const [supportingFiles, setSupportingFiles] = useState<FileList | null>(null);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random()}`);

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

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        ssr_email: user.email || '',
      }));
    }
  }, [user]);

  const parseM = (v: string): number => {
    if (!v) return NaN;
    return parseFloat(v.toLowerCase().replace(/\s*m$/,'').replace(',', '.'));
  };

  const parseKg = (v: string): number => {
    if (!v) return NaN;
    return parseFloat(v.toLowerCase().replace(/\s*kg$/, '').replace(',', '.'));
  };

  const fmt = (n: number): string => {
    return isNaN(n) ? '' : (Math.round(n * 100) / 100).toString();
  };

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
  }, [formData.length, formData.width, formData.height, formData.unladen_weight]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
  };

  const handleSubmit = async () => {
    // Validate supporting documents
    if (!supportingFiles || supportingFiles.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please attach at least one supporting document.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Generate reference
      const { data: refData, error: refError } = await supabase
        .rpc('generate_tds_reference');

      if (refError) throw refError;

      // Create entry (public submission - no auth required)
      const { data: entry, error: entryError } = await supabase
        .from('tds_entries')
        .insert([{
          ...formData,
          reference: refData,
          submitted_by: user?.id || null,
          status: 'Pending',
        }])
        .select()
        .single();

      if (entryError) throw entryError;

      // Upload files using session ID for non-authenticated users
      const uploadPromises: Promise<any>[] = [];
      const uploaderId = user?.id || sessionId;

      // Transport files
      Object.entries(transportFiles).forEach(([category, file]) => {
        if (file) {
          const path = `${formData.nsn}/${entry.id}/${category}_${file.name}`;
          uploadPromises.push(
            supabase.storage
              .from('transportation-data')
              .upload(path, file)
          );
        }
      });

      // Supporting files
      if (supportingFiles) {
        Array.from(supportingFiles).forEach(file => {
          const path = `${formData.nsn}/${entry.id}/${file.name}`;
          uploadPromises.push(
            supabase.storage
              .from('supporting-documents')
              .upload(path, file)
          );
        });
      }

      await Promise.all(uploadPromises);

      toast({
        title: 'Success!',
        description: `Request submitted with reference: ${refData}`,
      });

      // Reset form before navigation/reload
      handleReset();

      if (user) {
        navigate('/');
      } else {
        // Small delay to show success message before reload
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {user && <Header />}
      {!user && (
        <header className="bg-primary text-primary-foreground shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold">JSP 800 Vol 7</h1>
                <p className="text-sm opacity-90">Tie Down Scheme (TDS) Portal</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate('/auth')}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                Staff Login
              </Button>
            </div>
          </div>
        </header>
      )}
      <main className="container mx-auto p-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary">TDS New Entry Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Asset Owner Details */}
            <section>
              <h3 className="mb-4 border-b-2 border-primary/20 pb-2 text-lg font-bold text-primary">
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

            {/* Asset Details */}
            <section>
              <h3 className="mb-4 border-b-2 border-primary/20 pb-2 text-lg font-bold text-primary">
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

            {/* Basic Details */}
            <section>
              <h3 className="mb-4 border-b-2 border-primary/20 pb-2 text-lg font-bold text-primary">
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
                  <Label>MLC *</Label>
                  <Input
                    value={formData.mlc}
                    onChange={(e) => handleInputChange('mlc', e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Driver Information */}
            <section>
              <h3 className="mb-4 border-b-2 border-primary/20 pb-2 text-lg font-bold text-primary">
                Driver Information
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {['licence', 'crew_number', 'passenger_capacity', 'range', 'fuel_capacity', 'single_carriage', 'dual_carriage', 'max_speed'].map(field => (
                  <div key={field}>
                    <Label>{field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                    <Input
                      value={formData[field as keyof typeof formData]}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* ADAMS */}
            <section>
              <h3 className="mb-4 border-b-2 border-primary/20 pb-2 text-lg font-bold text-primary">
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

            {/* Transportation Data */}
            <section>
              <h3 className="mb-4 border-b-2 border-primary/20 pb-2 text-lg font-bold text-primary">
                Transportation Data
              </h3>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {TRANSPORT_GROUPS.map(group => (
                  <Label
                    key={group}
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 p-4 text-center transition-colors hover:border-primary hover:bg-primary/5 min-h-[100px]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={transportFiles[group] ? "text-primary" : "text-muted-foreground"}
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="text-sm font-medium">{group}</span>
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
                    {transportFiles[group] && (
                      <span className="text-xs text-primary font-medium">
                        ✓ {transportFiles[group]?.name.slice(0, 15)}...
                      </span>
                    )}
                  </Label>
                ))}
              </div>
            </section>

            {/* Supporting Documents */}
            <section>
              <h3 className="mb-4 border-b-2 border-primary/20 pb-2 text-lg font-bold text-primary">
                Supporting Documents *
              </h3>
              <Input
                type="file"
                multiple
                onChange={(e) => setSupportingFiles(e.target.files)}
              />
              {supportingFiles && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {Array.from(supportingFiles).map(f => (
                    <div key={f.name}>• {f.name}</div>
                  ))}
                </div>
              )}
            </section>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                onClick={handleReset}
                disabled={loading}
                variant="outline"
                size="lg"
                className="min-w-32"
              >
                Reset Form
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                size="lg"
                className="min-w-32"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}