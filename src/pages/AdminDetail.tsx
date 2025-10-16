import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, CheckCircle, XCircle, RotateCcw, Home, FileText, Paperclip } from 'lucide-react';

const TRANSPORT_GROUPS = [
  'BASIC DRAWING', 'PICTURES', 'ROAD', 'HET', 'EPLS', 'RAIL',
  'AMPHIBIOUS', 'SLINGING', 'ISO CONTAINER', 'MET', 'MAN SV 6T MM',
  'MAN SV 9T MM', 'MAN SV 15T MM', 'PLS', 'MAN SV 9T IMM', 'AIR'
];

export default function AdminDetail() {
  const { id } = useParams();
  const { role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [comment, setComment] = useState('');
  const [transportFiles, setTransportFiles] = useState<Record<string, string[]>>({});
  const [supportingFiles, setSupportingFiles] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id && (role === 'admin' || role === 'super_admin')) {
      loadEntry();
    }
  }, [id, role]);

  const loadEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('tds_entries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEntry(data);
      
      // Load files from storage
      await loadFiles(data.id, data.submitted_by);
    } catch (error) {
      console.error('Error loading entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to load entry details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (entryId: string, submittedBy: string) => {
    try {
      // Load transportation data files
      const { data: transportData } = await supabase.storage
        .from('transportation-data')
        .list(`${submittedBy}/${entryId}`);

      if (transportData) {
        const filesByCategory: Record<string, string[]> = {};
        transportData.forEach(file => {
          const category = TRANSPORT_GROUPS.find(g => file.name.startsWith(g));
          if (category) {
            if (!filesByCategory[category]) filesByCategory[category] = [];
            filesByCategory[category].push(file.name);
          }
        });
        setTransportFiles(filesByCategory);
      }

      // Load supporting documents
      const { data: supportData } = await supabase.storage
        .from('supporting-documents')
        .list(`${submittedBy}/${entryId}`);

      if (supportData) {
        setSupportingFiles(supportData.map(f => f.name));
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const openFile = async (bucket: string, filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) throw error;
      
      if (data) {
        const url = URL.createObjectURL(data);
        window.open(url, '_blank');
        // Clean up the URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error: any) {
      console.error('Error opening file:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to open file',
        variant: 'destructive',
      });
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!entry) return;

    if ((newStatus === 'Rejected' || newStatus === 'Returned') && !comment.trim()) {
      toast({
        title: 'Comment Required',
        description: `Please provide a comment for ${newStatus} status`,
        variant: 'destructive',
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('tds_entries')
        .update({
          status: newStatus,
          admin_comment: comment || null,
        })
        .eq('id', entry.id);

      if (error) throw error;

      // Update local state immediately
      setEntry({ ...entry, status: newStatus, admin_comment: comment || null });
      setIsEditing(false);
      setComment('');

      // Call edge function to send email
      await supabase.functions.invoke('send-tds-notification', {
        body: {
          email: entry.ssr_email,
          name: entry.ssr_name,
          reference: entry.reference,
          status: newStatus,
          comment: comment,
        },
      });

      toast({
        title: 'Success',
        description: `Status updated to ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              <p className="text-muted-foreground">Entry not found</p>
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 space-y-6">
        {/* Reference and Status at top */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Reference
              </p>
              <p className="text-2xl font-bold text-foreground">
                {entry.reference}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Status
              </p>
              <Badge variant="outline" className="text-lg px-4 py-1">
                {entry.status}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary">Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {fields
                .filter(f => f.label !== 'Reference' && f.label !== 'Status')
                .map(field => (
                  <div key={field.label} className="space-y-1.5 rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {field.label}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {field.value || '—'}
                    </p>
                  </div>
                ))}
            </div>

            {/* Transportation Data Files */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary border-b-2 border-primary/20 pb-2">
                Transportation Data
              </h3>
              <div className="grid gap-3 md:grid-cols-4">
                {TRANSPORT_GROUPS.map(group => {
                  const hasFiles = transportFiles[group] && transportFiles[group].length > 0;
                  return (
                    <Button
                      key={group}
                      variant={hasFiles ? "default" : "outline"}
                      className={hasFiles ? "" : "opacity-40"}
                      disabled={!hasFiles}
                      onClick={() => {
                        if (hasFiles && entry) {
                          transportFiles[group].forEach(fileName => {
                            openFile('transportation-data', `${entry.submitted_by}/${entry.id}/${fileName}`);
                          });
                        }
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <span className="text-xs font-medium">{group}</span>
                      {hasFiles && (
                        <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                          {transportFiles[group].length}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Supporting Documents */}
            {supportingFiles.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-primary border-b-2 border-primary/20 pb-2">
                  Supporting Documents
                </h3>
                <div className="grid gap-3 md:grid-cols-3">
                  {supportingFiles.map((fileName, idx) => (
                    <Button
                      key={idx}
                      variant="default"
                      onClick={() => {
                        if (entry) {
                          openFile('supporting-documents', `${entry.submitted_by}/${entry.id}/${fileName}`);
                        }
                      }}
                    >
                      <Paperclip className="mr-2 h-4 w-4" />
                      <span className="truncate text-xs">{fileName}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {entry.admin_comment && (
              <div className="rounded-lg bg-muted p-4">
                <p className="mb-1 text-sm font-semibold">Previous Admin Comment:</p>
                <p className="text-sm">{entry.admin_comment}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="comment">Admin Comment</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your comments here..."
                rows={4}
              />
            </div>

            {entry.status === 'Pending' || isEditing ? (
              <div className="flex flex-wrap gap-3 border-t pt-6">
                <Button
                  onClick={() => updateStatus('Approved')}
                  disabled={updating}
                  className="bg-success hover:bg-success/90"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => updateStatus('Rejected')}
                  disabled={updating}
                  variant="destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => updateStatus('Returned')}
                  disabled={updating}
                  className="bg-warning hover:bg-warning/90"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Return
                </Button>
                {isEditing && (
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setComment('');
                    }}
                    variant="outline"
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button
                  onClick={() => navigate('/admin')}
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to List
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 border-t pt-6">
                <div className="flex-1 rounded-lg bg-muted/50 p-4 border-2 border-dashed">
                  <p className="text-sm font-semibold text-muted-foreground">
                    This request has been {entry.status.toLowerCase()}. To change the decision, click the Edit button.
                  </p>
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="ml-auto"
                >
                  Edit Decision
                </Button>
                <Button
                  onClick={() => navigate('/admin')}
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to List
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}