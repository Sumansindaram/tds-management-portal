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

  const basicFields = [
    { label: 'SSR Name', value: entry.ssr_name },
    { label: 'SSR Email', value: entry.ssr_email },
    { label: 'Designation', value: entry.designation },
    { label: 'NSN', value: entry.nsn },
    { label: 'Asset Code', value: entry.asset_code },
    { label: 'Short Name', value: entry.short_name },
    { label: 'Length', value: entry.length },
    { label: 'Width', value: entry.width },
    { label: 'Height', value: entry.height },
    { label: 'Unladen Weight', value: entry.unladen_weight },
    { label: 'Laden Weight', value: entry.laden_weight },
    { label: 'ALEST', value: entry.alest },
    { label: 'LIMS 2.5', value: entry.lims_25 },
    { label: 'LIMS 2.8', value: entry.lims_28 },
    { label: 'Out of Service Date', value: entry.out_of_service_date },
    { label: 'MLC', value: entry.mlc },
    { label: 'Service', value: entry.service },
    { label: 'Owner Nation', value: entry.owner_nation },
    { label: 'RIC Code', value: entry.ric_code },
    { label: 'Asset Type', value: entry.asset_type },
  ];

  const driverFields = [
    { label: 'Licence', value: entry.licence },
    { label: 'Crew Number', value: entry.crew_number },
    { label: 'Passenger Capacity', value: entry.passenger_capacity },
    { label: 'Range', value: entry.range },
    { label: 'Fuel Capacity', value: entry.fuel_capacity },
  ];

  const adamsFields = [
    { label: 'Single Carriage', value: entry.single_carriage },
    { label: 'Dual Carriage', value: entry.dual_carriage },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 space-y-6">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/dashboard')}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Reference</p>
              <p className="text-2xl font-bold text-foreground">{entry.reference}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Status</p>
              <Badge variant="outline" className="text-lg px-4 py-1">{entry.status}</Badge>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary">Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Details */}
            <div>
              <h3 className="text-lg font-bold text-primary border-b-2 border-primary/20 pb-2 mb-4">Basic Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {basicFields.map((field) => (
                  <div key={field.label} className="space-y-1.5 rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field.label}</p>
                    <p className="text-lg font-semibold text-foreground">{field.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Driver Information */}
            <div>
              <h3 className="text-lg font-bold text-primary border-b-2 border-primary/20 pb-2 mb-4">Driver Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {driverFields.map((field) => (
                  <div key={field.label} className="space-y-1.5 rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field.label}</p>
                    <p className="text-lg font-semibold text-foreground">{field.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ADAMS Sections */}
            <div>
              <h3 className="text-lg font-bold text-primary border-b-2 border-primary/20 pb-2 mb-4">ADAMS Sections</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {adamsFields.map((field) => (
                  <div key={field.label} className="space-y-1.5 rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field.label}</p>
                    <p className="text-lg font-semibold text-foreground">{field.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transportation Data */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary border-b-2 border-primary/20 pb-2">Transportation Data</h3>
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
            </div>

            {/* Supporting Documents */}
            {supportingFiles.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-primary border-b-2 border-primary/20 pb-2">Supporting Documents</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  {supportingFiles.map((fileName, idx) => (
                    <Button key={idx} variant="default" onClick={() => entry && openFile('supporting-documents', entry, fileName)}>
                      <Paperclip className="mr-2 h-4 w-4" />
                      <span className="truncate text-xs">{fileName}</span>
                    </Button>
                  ))}
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
      </main>
    </div>
  );
}
