import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Paperclip, ArrowLeft, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-badge-pending text-badge-pending-foreground',
  Approved: 'bg-badge-approved text-badge-approved-foreground',
  Rejected: 'bg-badge-rejected text-badge-rejected-foreground',
  Returned: 'bg-badge-returned text-badge-returned-foreground',
};

const TRANSPORT_GROUPS = [
  'BASIC DRAWING', 'PICTURES', 'ROAD', 'HET', 'EPLS', 'RAIL',
  'AMPHIBIOUS', 'SLINGING', 'ISO CONTAINER', 'MET', 'MAN SV 6T MM',
  'MAN SV 9T MM', 'MAN SV 15T MM', 'PLS', 'MAN SV 9T IMM', 'AIR'
];

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transportFiles, setTransportFiles] = useState<Record<string, string[]>>({});
  const [supportingFiles, setSupportingFiles] = useState<string[]>([]);
  const [commentHistory, setCommentHistory] = useState<any[]>([]);
  const isReadOnly = true;

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('tds_entries')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        if (user && data.submitted_by && data.submitted_by !== user.id) {
          toast({ title: 'Access denied', description: 'This request does not belong to your account.', variant: 'destructive' });
          setEntry(null);
          return;
        }
        setEntry(data);
        await loadFiles(data.id, data.submitted_by, data.nsn);
        await loadCommentHistory(data.id);
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Could not load request details', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, user]);

  const listWithPrefix = async (bucket: string, prefix?: string) => {
    const normalized = prefix ? prefix.replace(/\/$/, '') : undefined;
    if (!normalized) return { data: [] } as any;
    return await supabase.storage
      .from(bucket)
      .list(normalized, { limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } });
  };

  const loadFiles = async (entryId: string, submittedBy: string, nsn?: string) => {
    try {
      const prefixNew = nsn ? `${nsn}/${entryId}` : undefined;
      const prefixOld = `${submittedBy}/${entryId}`;

      // Transportation data
      let transportData: any[] = [];
      if (prefixNew) {
        const r = await listWithPrefix('transportation-data', prefixNew);
        if (r?.data?.length) transportData = r.data;
      }
      if (!transportData.length) {
        const r = await listWithPrefix('transportation-data', prefixOld);
        transportData = r?.data || [];
      }
      const filesByCategory: Record<string, string[]> = {};
      transportData.forEach((f: any) => {
        if (f?.name) {
          const cat = TRANSPORT_GROUPS.find((g) => f.name.startsWith(g));
          if (cat) {
            if (!filesByCategory[cat]) filesByCategory[cat] = [];
            filesByCategory[cat].push(f.name);
          }
        }
      });
      setTransportFiles(filesByCategory);

      // Supporting docs
      let supportData: any[] = [];
      if (prefixNew) {
        const r = await listWithPrefix('supporting-documents', prefixNew);
        if (r?.data?.length) supportData = r.data;
      }
      if (!supportData.length) {
        const r = await listWithPrefix('supporting-documents', prefixOld);
        supportData = r?.data || [];
      }
      setSupportingFiles(supportData.map((f: any) => f.name).filter(Boolean));
    } catch (e) {
      console.error('loadFiles error', e);
    }
  };

  const loadCommentHistory = async (entryId: string) => {
    try {
      const { data, error } = await supabase
        .from('tds_entry_comments')
        .select('*')
        .eq('entry_id', entryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommentHistory(data || []);
    } catch (error) {
      console.error('Error loading comment history:', error);
    }
  };

  const openFile = async (bucket: string, entryObj: any, fileName: string) => {
    const candidatePaths = [
      `${entryObj?.nsn}/${entryObj?.id}/${fileName}`,
      `${entryObj?.submitted_by}/${entryObj?.id}/${fileName}`,
    ].filter(Boolean) as string[];

    // Try each path and open the first one that works
    for (const path of candidatePaths) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 300);
        
        if (!error && data?.signedUrl) {
          window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
          return;
        }
      } catch (_) {
        // Try next path
      }
    }

    toast({
      title: 'File not found',
      description: 'Could not open the file.',
      variant: 'destructive',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Request not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const assetOwnerFields = [
    { label: 'SSR/SR Name', value: entry.ssr_name },
    { label: 'SSR Email', value: entry.ssr_email },
  ];

  const assetDetailsFields = [
    { label: 'Designation', value: entry.designation },
    { label: 'NSN', value: entry.nsn },
    { label: 'Asset Code', value: entry.asset_code },
    { label: 'Short Name', value: entry.short_name },
  ];

  const basicDetailsFields = [
    { label: 'Length (m)', value: entry.length },
    { label: 'Width (m)', value: entry.width },
    { label: 'Height (m)', value: entry.height },
    { label: 'Unladen Weight (kg)', value: entry.unladen_weight },
    { label: 'Laden Weight (kg)', value: entry.laden_weight },
    { label: 'ALEST', value: entry.alest },
    { label: 'LIMS 2.5', value: entry.lims_25 },
    { label: 'LIMS 2.8', value: entry.lims_28 },
    { label: 'Out of Service Date', value: entry.out_of_service_date },
    { label: 'Classification', value: entry.classification },
    { label: 'MLC', value: entry.mlc },
  ];

  const driverInfoFields = [
    { label: 'Licence', value: entry.licence },
    { label: 'Crew Number', value: entry.crew_number },
    { label: 'Passenger Capacity', value: entry.passenger_capacity },
    { label: 'Range', value: entry.range },
    { label: 'Fuel Capacity', value: entry.fuel_capacity },
  ];

  const adamsFields = [
    { label: 'Single Carriage', value: entry.single_carriage },
    { label: 'Dual Carriage', value: entry.dual_carriage },
    { label: 'Max Speed', value: entry.max_speed },
  ];

  const serviceInfoFields = [
    { label: 'Service', value: entry.service },
    { label: 'Owner Nation', value: entry.owner_nation },
    { label: 'RIC Code', value: entry.ric_code },
    { label: 'Asset Type', value: entry.asset_type },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 space-y-6">
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm border-2 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Reference Number</p>
              <p className="text-2xl font-bold text-primary">{entry.reference}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-2 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Current Status</p>
              <Badge className={`text-sm px-4 py-1.5 font-semibold ${STATUS_COLORS[entry.status] || 'bg-muted'}`}>{entry.status}</Badge>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-b-2 border-primary/10">
            <CardTitle className="text-2xl text-primary">Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            {/* Asset Owner Details */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-4 pb-3 text-lg font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">1</span>
                Asset Owner Details
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {assetOwnerFields.map(field => (
                  <div key={field.label} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                    <p className="text-sm font-semibold text-foreground p-2 bg-muted/30 rounded border">{field.value || '—'}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Asset Details */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-4 pb-3 text-lg font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">2</span>
                Asset Details
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {assetDetailsFields.map(field => (
                  <div key={field.label} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                    <p className="text-sm font-semibold text-foreground p-2 bg-muted/30 rounded border">{field.value || '—'}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Basic Details */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-4 pb-3 text-lg font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">3</span>
                Basic Details
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                {basicDetailsFields.map(field => (
                  <div key={field.label} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                    <p className="text-sm font-semibold text-foreground p-2 bg-muted/30 rounded border">{field.value || '—'}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Driver Information */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-4 pb-3 text-lg font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">4</span>
                Driver Information
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                {driverInfoFields.map(field => (
                  <div key={field.label} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                    <p className="text-sm font-semibold text-foreground p-2 bg-muted/30 rounded border">{field.value || '—'}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ADAMS Sections */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-4 pb-3 text-lg font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">5</span>
                ADAMS Sections
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                {adamsFields.map(field => (
                  <div key={field.label} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                    <p className="text-sm font-semibold text-foreground p-2 bg-muted/30 rounded border">{field.value || '—'}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Service Information */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-4 pb-3 text-lg font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">6</span>
                Service Information
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {serviceInfoFields.map(field => (
                  <div key={field.label} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                    <p className="text-sm font-semibold text-foreground p-2 bg-muted/30 rounded border">{field.value || '—'}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Transportation Data */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-4 pb-3 text-lg font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">7</span>
                Transportation Data
              </h3>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {TRANSPORT_GROUPS.map((group) => {
                  const hasFiles = transportFiles[group] && transportFiles[group].length > 0;
                  return (
                    <Button
                      key={group}
                      variant={hasFiles ? 'default' : 'outline'}
                      className={`h-auto min-h-[3rem] flex-col items-start justify-center px-3 py-2 ${hasFiles ? '' : 'opacity-40'}`}
                      disabled={!hasFiles}
                      onClick={() => {
                        if (hasFiles && entry) {
                          transportFiles[group].forEach((fileName, idx) => {
                            setTimeout(() => openFile('transportation-data', entry, fileName), idx * 200);
                          });
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-medium text-left truncate flex-1">{group}</span>
                      </div>
                      {hasFiles && (
                        <span className="text-[10px] text-primary-foreground/80 mt-1">
                          {transportFiles[group].length} file{transportFiles[group].length > 1 ? 's' : ''}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </section>

            {/* Supporting Documents */}
            {supportingFiles.length > 0 && (
              <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
                <h3 className="mb-4 pb-3 text-lg font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">8</span>
                  Supporting Documents
                </h3>
                <div className="grid gap-3 md:grid-cols-3">
                  {supportingFiles.map((fileName, idx) => (
                    <Button key={idx} variant="default" onClick={() => entry && openFile('supporting-documents', entry, fileName)}>
                      <Paperclip className="mr-2 h-4 w-4" />
                      <span className="truncate text-xs">{fileName}</span>
                    </Button>
                  ))}
                </div>
              </section>
            )}

            {/* Terms Acceptance */}
            {entry && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-primary border-b-2 border-primary/20 pb-2">
                  Declaration & Acknowledgement
                </h3>
                <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center ${entry.ssr_approval_confirmed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {entry.ssr_approval_confirmed && <span className="text-white text-xs">✓</span>}
                    </div>
                    <p className="text-sm">
                      SSR approval has been obtained and attached to this request, approved by the Senior Service Representative (SSR) or Service Representative (SR).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center ${entry.authorised_person_confirmed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {entry.authorised_person_confirmed && <span className="text-white text-xs">✓</span>}
                    </div>
                    <p className="text-sm">
                      Confirmed as an authorised representative, duly appointed by the SSR/SR, to submit this Transportation Data Sheet (TDS) request.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center ${entry.data_responsibility_confirmed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {entry.data_responsibility_confirmed && <span className="text-white text-xs">✓</span>}
                    </div>
                    <p className="text-sm">
                      Acknowledged that the Deployment Team (DT) assumes full responsibility for data accuracy, and that QSEE bears no liability for any inaccuracies.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center ${entry.review_responsibility_confirmed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {entry.review_responsibility_confirmed && <span className="text-white text-xs">✓</span>}
                    </div>
                    <p className="text-sm">
                      Acknowledged that the Deployment Team (DT) is solely responsible for conducting thorough reviews of all TDS entries upon creation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Comment History */}
            {commentHistory.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-primary border-b-2 border-primary/20 pb-2 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Admin Comments & Updates ({commentHistory.length})
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {commentHistory.map((item, idx) => (
                    <AccordionItem key={item.id} value={`comment-${idx}`} className="border rounded-lg mb-3 px-4">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex flex-col items-start gap-2 text-left w-full pr-4">
                          <div className="flex items-center gap-3 w-full justify-between">
                            <Badge variant={
                              item.status === 'Approved' ? 'default' :
                              item.status === 'Rejected' ? 'destructive' :
                              item.status === 'Returned' ? 'secondary' :
                              'outline'
                            }>
                              {item.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            By: {item.admin_name}
                          </p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <div className="rounded-md bg-muted/50 p-4">
                          <p className="text-sm whitespace-pre-wrap">{item.comment}</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Button at Bottom */}
        <div className="flex justify-center pb-6">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            size="lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
