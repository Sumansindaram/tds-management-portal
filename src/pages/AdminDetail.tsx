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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, ArrowLeft, CheckCircle, XCircle, RotateCcw, Home, FileText, Paperclip, Clock, Download, Filter } from 'lucide-react';
import jsPDF from 'jspdf';

const TRANSPORT_GROUPS = [
  'BASIC DRAWING', 'PICTURES', 'ROAD', 'HET', 'EPLS', 'RAIL',
  'AMPHIBIOUS', 'SLINGING', 'ISO CONTAINER', 'MET', 'MAN SV 6T MM',
  'MAN SV 9T MM', 'MAN SV 15T MM', 'PLS', 'MAN SV 9T IMM', 'AIR'
];

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-badge-pending text-yellow-900',
  Approved: 'bg-badge-approved text-white',
  Rejected: 'bg-badge-rejected text-white',
  Returned: 'bg-badge-returned text-white',
};

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
  const [commentHistory, setCommentHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
      await loadFiles(data.id, data.submitted_by, data.nsn);
      
      // Load comment history
      await loadCommentHistory(data.id);
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

  const loadFiles = async (entryId: string, submittedBy: string, nsn?: string) => {
    try {
      const transportPrefixNew = nsn ? `${nsn}/${entryId}` : undefined;
      const transportPrefixOld = `${submittedBy}/${entryId}`;

      // Helper to list with explicit options and normalized path
      const listWithPrefix = async (bucket: string, prefix?: string) => {
        const normalized = prefix ? prefix.replace(/\/$/, '') : undefined;
        if (!normalized) return { data: [] } as any;
        return await supabase.storage
          .from(bucket)
          .list(normalized, { limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } });
      };

      // Transportation Data
      let transportData: any[] = [];
      if (transportPrefixNew) {
        const resNew = await listWithPrefix('transportation-data', transportPrefixNew);
        if (resNew?.data?.length) transportData = resNew.data;
      }
      if (!transportData.length) {
        const resOld = await listWithPrefix('transportation-data', transportPrefixOld);
        transportData = resOld?.data || [];
      }

      if (transportData.length) {
        const filesByCategory: Record<string, string[]> = {};
        transportData.forEach((file: any) => {
          if (file.name) {
            const category = TRANSPORT_GROUPS.find((g) => file.name.startsWith(g));
            if (category) {
              if (!filesByCategory[category]) filesByCategory[category] = [];
              filesByCategory[category].push(file.name);
            }
          }
        });
        setTransportFiles(filesByCategory);
      } else {
        setTransportFiles({});
      }

      // Supporting Documents
      let supportData: any[] = [];
      if (transportPrefixNew) {
        const resNew = await listWithPrefix('supporting-documents', transportPrefixNew);
        if (resNew?.data?.length) supportData = resNew.data;
      }
      if (!supportData.length) {
        const resOld = await listWithPrefix('supporting-documents', transportPrefixOld);
        supportData = resOld?.data || [];
      }

      setSupportingFiles(supportData.map((f: any) => f.name).filter(Boolean));
    } catch (error) {
      console.error('Error loading files:', error);
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

  const exportToPDF = () => {
    if (!entry || commentHistory.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(18);
    doc.text('Comment History Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Reference: ${entry.reference}`, 20, 35);
    doc.text(`Designation: ${entry.designation}`, 20, 42);
    doc.text(`Current Status: ${entry.status}`, 20, 49);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 56);
    
    // Comments
    let yPos = 70;
    doc.setFontSize(14);
    doc.text('Comment Timeline', 20, yPos);
    yPos += 10;
    
    commentHistory.forEach((item, idx) => {
      // Check if we need a new page
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${item.status} - ${new Date(item.created_at).toLocaleString()}`, 20, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`By: ${item.admin_name}`, 25, yPos);
      yPos += 6;
      
      // Wrap comment text
      const splitComment = doc.splitTextToSize(item.comment, pageWidth - 50);
      doc.text(splitComment, 25, yPos);
      yPos += (splitComment.length * 6) + 8;
    });
    
    doc.save(`${entry.reference}_comment_history.pdf`);
    
    toast({
      title: 'Success',
      description: 'Comment history exported to PDF',
    });
  };

  // Filter comment history based on search and status
  const filteredCommentHistory = commentHistory.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.admin_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
      // Get current user's profile for admin name
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      // Update entry status and comment
      const { error } = await supabase
        .from('tds_entries')
        .update({
          status: newStatus,
          admin_comment: comment || null,
        })
        .eq('id', entry.id);

      if (error) throw error;

      // Insert comment into history
      if (comment.trim()) {
        const { error: historyError } = await supabase
          .from('tds_entry_comments')
          .insert({
            entry_id: entry.id,
            admin_id: user?.id,
            admin_name: profile?.full_name || user?.email || 'Admin',
            status: newStatus,
            comment: comment,
          });

        if (historyError) console.error('Error saving comment history:', historyError);
      }

      // Reload comment history
      await loadCommentHistory(entry.id);

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
      console.error('Status update error:', error);
      toast({
        title: 'Error',
        description: 'Unable to update status. Please try again or contact support if the issue persists.',
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
    { label: 'Single Carriage', value: entry.single_carriage },
    { label: 'Dual Carriage', value: entry.dual_carriage },
    { label: 'Max Speed', value: entry.max_speed },
  ];

  const adamsDataFields = [
    { label: 'Service', value: entry.service },
    { label: 'Owner Nation', value: entry.owner_nation },
    { label: 'RIC Code', value: entry.ric_code },
    { label: 'Asset Type', value: entry.asset_type },
  ];
 
   const isReadOnly = entry.status !== 'Pending' && !isEditing;
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/20 via-background to-muted/10">
      <Header />
      <main className="container mx-auto p-6 lg:p-8 space-y-6">
        {/* Reference and Status Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm border-2 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                Reference Number
              </p>
              <p className="text-2xl font-bold text-primary">
                {entry.reference}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-2 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                Current Status
              </p>
              <Badge 
                className={`text-sm px-4 py-1.5 font-semibold ${STATUS_COLORS[entry.status] || ''}`}
              >
                {entry.status}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Card className={`shadow-lg border-2 ${entry.status !== 'Pending' && !isEditing ? 'opacity-75' : ''}`}>
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
                    <p className="text-sm font-semibold text-card-foreground p-2 bg-muted/30 rounded border">{field.value || '—'}</p>
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
                    <p className="text-sm font-semibold text-card-foreground p-2 bg-muted/30 rounded border">{field.value || '—'}</p>
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
                    <p className="text-sm font-semibold text-card-foreground p-2 bg-muted/30 rounded border">{field.value || '—'}</p>
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
                    <p className="text-sm font-semibold text-card-foreground p-2 bg-muted/30 rounded border">{field.value || '—'}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ADAMS Data */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-4 pb-3 text-lg font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">5</span>
                ADAMS Data
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {adamsDataFields.map(field => (
                  <div key={field.label} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                    <p className="text-sm font-semibold text-card-foreground p-2 bg-muted/30 rounded border">{field.value || '—'}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Transportation Data Files */}
            <section className="bg-card rounded-lg p-6 border-2 shadow-sm">
              <h3 className="mb-4 pb-3 text-lg font-bold text-primary flex items-center gap-3 border-b-2 border-primary/20">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">6</span>
                Transportation Data
              </h3>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {TRANSPORT_GROUPS.map(group => {
                  const hasFiles = transportFiles[group] && transportFiles[group].length > 0;
                  return (
                    <Button
                      key={group}
                      variant={hasFiles ? "default" : "secondary"}
                      className={`h-auto min-h-[3rem] flex-col items-start justify-center px-3 py-2 ${hasFiles ? 'bg-[hsl(var(--maroon))] text-[hsl(var(--maroon-foreground))] hover:bg-[hsl(var(--maroon))]/90' : "bg-muted text-card-foreground"}`}
                      disabled={!hasFiles}
                       onClick={() => {
                         if (hasFiles && entry) {
                           transportFiles[group].forEach((fileName) => {
                             openFile('transportation-data', entry, fileName);
                           });
                         }
                       }}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-medium text-left truncate flex-1">{group}</span>
                      </div>
                      {hasFiles && (
                        <span className="text-[10px] opacity-80 mt-1">
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
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold">7</span>
                  Supporting Documents
                </h3>
                <div className="grid gap-3 md:grid-cols-3">
                  {supportingFiles.map((fileName, idx) => (
                    <Button
                      key={idx}
                      variant="default"
                       onClick={() => {
                         if (entry) {
                           openFile('supporting-documents', entry, fileName);
                         }
                       }}
                    >
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
                      I confirm that Senior Safety Responsible or Safety Responsible (SSR/SR) approval has been obtained and attached to this request, and that this submission has been duly approved by them.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center ${entry.authorised_person_confirmed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {entry.authorised_person_confirmed && <span className="text-white text-xs">✓</span>}
                    </div>
                    <p className="text-sm">
                      I confirm that I am an authorised representative, duly appointed by the SSR/SR, to submit this Tie Down Scheme (TDS) entry request on their behalf.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center ${entry.data_responsibility_confirmed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {entry.data_responsibility_confirmed && <span className="text-white text-xs">✓</span>}
                    </div>
                    <p className="text-sm">
                      I acknowledge that the Delivery Team (DT) assumes full responsibility for the accuracy and completeness of all data provided in this submission, and that the Quality, Safety, Environment and Engineering (QSEE) team bears no liability for any inaccuracies or errors in the supplied information.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center ${entry.review_responsibility_confirmed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {entry.review_responsibility_confirmed && <span className="text-white text-xs">✓</span>}
                    </div>
                    <p className="text-sm">
                      I acknowledge that the DT is solely responsible for conducting thorough reviews of all TDS entries upon creation to verify data accuracy and identify any discrepancies within the database.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Comment History */}
            {commentHistory.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Comment History ({filteredCommentHistory.length})
                  </h3>
                  <Button
                    onClick={exportToPDF}
                    variant="default"
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export to PDF
                  </Button>
                </div>
                
                {/* Filters */}
                <div className="grid gap-3 md:grid-cols-2 p-4 bg-muted/30 rounded-lg border">
                  <div className="space-y-2">
                    <Label htmlFor="search" className="text-xs flex items-center gap-2">
                      <Filter className="h-3 w-3" />
                      Search comments or admin name
                    </Label>
                    <Input
                      id="search"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status-filter" className="text-xs">Filter by status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="status-filter">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent className="bg-card text-card-foreground border-primary/20">
                        <SelectItem value="all" className="text-card-foreground data-[highlighted]:bg-primary/10 data-[highlighted]:text-card-foreground">All statuses</SelectItem>
                        <SelectItem value="Approved" className="text-card-foreground data-[highlighted]:bg-primary/10 data-[highlighted]:text-card-foreground">Approved</SelectItem>
                        <SelectItem value="Rejected" className="text-card-foreground data-[highlighted]:bg-primary/10 data-[highlighted]:text-card-foreground">Rejected</SelectItem>
                        <SelectItem value="Returned" className="text-card-foreground data-[highlighted]:bg-primary/10 data-[highlighted]:text-card-foreground">Returned</SelectItem>
                        <SelectItem value="Pending" className="text-card-foreground data-[highlighted]:bg-primary/10 data-[highlighted]:text-card-foreground">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredCommentHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No comments match your filters
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {filteredCommentHistory.map((historyItem, idx) => (
                      <AccordionItem key={historyItem.id} value={`item-${idx}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <Badge variant={
                              historyItem.status === 'Approved' ? 'default' :
                              historyItem.status === 'Rejected' ? 'destructive' :
                              historyItem.status === 'Returned' ? 'secondary' : 'outline'
                            }>
                              {historyItem.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(historyItem.created_at).toLocaleString()}
                            </span>
                            <span className="text-sm font-medium">
                              by {historyItem.admin_name}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="rounded-lg bg-muted/50 p-4 mt-2">
                            <p className="text-sm whitespace-pre-wrap">{historyItem.comment}</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            )}

            {/* User Comment from Submission */}
            {entry?.user_comment && (
              <div className="space-y-2 bg-accent/10 rounded-lg p-4 border-2 border-accent/30">
                <h3 className="text-lg font-bold text-accent flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  User Comment
                </h3>
                <div className="rounded-md bg-card p-4 border">
                  <p className="text-sm whitespace-pre-wrap text-foreground">{entry.user_comment}</p>
                </div>
              </div>
            )}

            {entry.admin_comment && (
              <div className="rounded-lg bg-muted p-4">
                <p className="mb-1 text-sm font-semibold">Latest Admin Comment:</p>
                <p className="text-sm">{entry.admin_comment}</p>
              </div>
            )}

            <div className={`space-y-2 ${isReadOnly ? 'pointer-events-none opacity-60' : ''}`}>
              <Label htmlFor="comment">Admin Comment</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your comments here..."
                rows={4}
                disabled={entry.status !== 'Pending' && !isEditing}
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
                  <>
                    <Button
                      onClick={async () => {
                        if (comment.trim()) {
                          await updateStatus(entry.status);
                        } else {
                          toast({
                            title: 'Comment Required',
                            description: 'Please enter a comment to update.',
                            variant: 'destructive',
                          });
                        }
                      }}
                      disabled={updating || !comment.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Update Comment
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setComment('');
                      }}
                      variant="default"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Cancel Edit
                    </Button>
                  </>
                )}
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
                  variant="default"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Edit Decision
                </Button>
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t flex justify-start">
              <Button
                onClick={() => navigate('/admin')}
                variant="secondary"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}