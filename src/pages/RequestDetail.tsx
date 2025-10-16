import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Paperclip } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PdfViewer from '@/components/PdfViewer';

const TRANSPORT_GROUPS = [
  'BASIC DRAWING', 'PICTURES', 'ROAD', 'HET', 'EPLS', 'RAIL',
  'AMPHIBIOUS', 'SLINGING', 'ISO CONTAINER', 'MET', 'MAN SV 6T MM',
  'MAN SV 9T MM', 'MAN SV 15T MM', 'PLS', 'MAN SV 9T IMM', 'AIR'
];

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transportFiles, setTransportFiles] = useState<Record<string, string[]>>({});
  const [supportingFiles, setSupportingFiles] = useState<string[]>([]);
  const [pdfDialog, setPdfDialog] = useState<{ bucket: string; path: string } | null>(null);
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

  const openFile = (bucket: string, entryObj: any, fileName: string) => {
    const candidatePaths = [
      `${entryObj?.nsn}/${entryObj?.id}/${fileName}`,
      `${entryObj?.submitted_by}/${entryObj?.id}/${fileName}`,
    ].filter(Boolean) as string[];

    setPdfDialog({ bucket, path: candidatePaths[0] });
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

  const fields = [
    { label: 'Reference', value: entry.reference },
    { label: 'Status', value: entry.status },
    { label: 'SSR Name', value: entry.ssr_name },
    { label: 'SSR Email', value: entry.ssr_email },
    { label: 'Designation', value: entry.designation },
    { label: 'NSN', value: entry.nsn },
    { label: 'Asset Code', value: entry.asset_code },
    { label: 'Short Name', value: entry.short_name },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 space-y-6">
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

        <Card className={`shadow-lg ${isReadOnly ? 'opacity-90' : ''}`}>
          <CardHeader>
            <CardTitle className="text-primary">Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 pointer-events-none">
              {fields.map((field) => (
                <div key={field.label} className="space-y-1.5 rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field.label}</p>
                  <p className="text-lg font-semibold text-foreground">{field.value || '—'}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary border-b-2 border-primary/20 pb-2">Transportation Data</h3>
              <div className="grid gap-3 md:grid-cols-4">
                {TRANSPORT_GROUPS.map((group) => {
                  const hasFiles = transportFiles[group] && transportFiles[group].length > 0;
                  return (
                    <Button
                      key={group}
                      variant={hasFiles ? 'default' : 'outline'}
                      className={hasFiles ? '' : 'opacity-40'}
                      disabled={!hasFiles}
                      onClick={() => {
                        if (hasFiles && entry) {
                          transportFiles[group].forEach((fileName, idx) => {
                            setTimeout(() => openFile('transportation-data', entry, fileName), idx * 200);
                          });
                        }
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <span className="text-xs font-medium">{group}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

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
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!pdfDialog} onOpenChange={() => setPdfDialog(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Document Viewer</DialogTitle>
          </DialogHeader>
          {pdfDialog && (
            <PdfViewer
              bucket={pdfDialog.bucket}
              path={pdfDialog.path}
              height="75vh"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
