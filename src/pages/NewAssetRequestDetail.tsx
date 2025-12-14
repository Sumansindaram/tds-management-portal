import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Upload, FileText, X, Plus, Loader2, ExternalLink } from 'lucide-react';

interface NewAssetRequest {
  id: string;
  reference: string;
  submitted_by: string;
  created_at: string;
  updated_at: string;
  status: string;
  task_title: string;
  task_description: string;
  urgency_level: string;
  required_by_date: string | null;
  asset_name: string;
  asset_type: string;
  manufacturer: string | null;
  model_number: string | null;
  estimated_weight_kg: string | null;
  estimated_dimensions: string | null;
  project_team: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  business_justification: string | null;
  admin_comment: string | null;
}

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  description: string | null;
  created_at: string;
  uploaded_by: string;
}

const DOCUMENT_TYPES = [
  'CAD Drawing',
  'Technical Specification',
  'Business Case',
  'Weight Certificate',
  'Manufacturer Documentation',
  'Safety Assessment',
  'Risk Assessment',
  'Other'
];

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'Returned', 'Rejected'];

export default function NewAssetRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState<NewAssetRequest | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [currentDocType, setCurrentDocType] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isOwner = request?.submitted_by === user?.id;
  const canEdit = isAdmin || (isOwner && ['Pending', 'Returned'].includes(request?.status || ''));
  const canAddDocuments = isAdmin || isOwner;

  useEffect(() => {
    if (id) {
      fetchRequest();
      fetchDocuments();
    }
  }, [id]);

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('new_asset_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRequest(data);
      setNewStatus(data.status);
      setAdminComment(data.admin_comment || '');
    } catch (error) {
      console.error('Error fetching request:', error);
      toast({
        title: 'Error',
        description: 'Unable to load request details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('new_asset_documents')
        .select('*')
        .eq('request_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user || !id) return;

    if (!currentDocType) {
      toast({
        title: 'Document Type Required',
        description: 'Please select a document type before uploading.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const filePath = `${id}/${Date.now()}_${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('new-asset-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: docError } = await supabase
          .from('new_asset_documents')
          .insert({
            request_id: id,
            uploaded_by: user.id,
            file_name: file.name,
            file_path: filePath,
            document_type: currentDocType,
            description: currentDescription || null,
          });

        if (docError) throw docError;
      }

      toast({
        title: 'Success',
        description: 'Documents uploaded successfully.',
      });
      
      setCurrentDocType('');
      setCurrentDescription('');
      fetchDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Unable to upload documents.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('new-asset-documents')
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Unable to download document.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async () => {
    if (!isAdmin || !id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('new_asset_requests')
        .update({
          status: newStatus,
          admin_comment: adminComment || null,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Request updated successfully.',
      });
      
      fetchRequest();
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Unable to update request.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'In Progress': return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'Completed': return 'bg-green-500/20 text-green-700 dark:text-green-300';
      case 'Returned': return 'bg-orange-500/20 text-orange-700 dark:text-orange-300';
      case 'Rejected': return 'bg-red-500/20 text-red-700 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-4 lg:p-8 max-w-5xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-4 lg:p-8 max-w-5xl text-center">
          <h1 className="text-2xl font-bold mb-4">Request Not Found</h1>
          <Button onClick={() => navigate('/new-asset-requests')}>
            Back to Requests
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4 lg:p-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/new-asset-requests')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Requests
        </Button>

        {/* Header Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <span className="font-mono text-primary">{request.reference}</span>
                  <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                </CardTitle>
                <p className="text-lg text-muted-foreground mt-2">{request.task_title}</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Created: {new Date(request.created_at).toLocaleString()}</p>
                <p>Updated: {new Date(request.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Information */}
            <Card>
              <CardHeader className="bg-ribbon text-ribbon-foreground">
                <CardTitle className="text-lg">Task Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-muted-foreground">Task Description</Label>
                  <p className="mt-1">{request.task_description}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Urgency Level</Label>
                    <p className="mt-1">{request.urgency_level}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Required By</Label>
                    <p className="mt-1">{request.required_by_date ? new Date(request.required_by_date).toLocaleDateString() : 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Asset Information */}
            <Card>
              <CardHeader className="bg-ribbon text-ribbon-foreground">
                <CardTitle className="text-lg">Asset Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Asset Name</Label>
                    <p className="mt-1 font-medium">{request.asset_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Asset Type</Label>
                    <p className="mt-1">{request.asset_type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Manufacturer</Label>
                    <p className="mt-1">{request.manufacturer || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Model Number</Label>
                    <p className="mt-1">{request.model_number || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estimated Weight</Label>
                    <p className="mt-1">{request.estimated_weight_kg ? `${request.estimated_weight_kg} kg` : 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estimated Dimensions</Label>
                    <p className="mt-1">{request.estimated_dimensions || 'Not specified'}</p>
                  </div>
                </div>
                {request.business_justification && (
                  <div className="mt-4">
                    <Label className="text-muted-foreground">Business Justification</Label>
                    <p className="mt-1">{request.business_justification}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader className="bg-ribbon text-ribbon-foreground">
                <CardTitle className="text-lg">Supporting Documents</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {canAddDocuments && (
                  <div className="grid gap-4 md:grid-cols-3 p-4 bg-muted/50 rounded-lg border">
                    <div>
                      <Label>Document Type</Label>
                      <Select value={currentDocType} onValueChange={setCurrentDocType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={currentDescription}
                        onChange={(e) => setCurrentDescription(e.target.value)}
                        placeholder="Brief description"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="relative w-full">
                        <input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileUpload}
                          multiple
                          disabled={uploading || !currentDocType}
                        />
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          disabled={uploading || !currentDocType}
                        >
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          Upload
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No documents uploaded yet</p>
                  </div>
                ) : (
                  <div className="border rounded-lg divide-y">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.document_type}{doc.description && ` - ${doc.description}`} • {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader className="bg-ribbon text-ribbon-foreground">
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div>
                  <Label className="text-muted-foreground">Project Team</Label>
                  <p className="mt-1 font-medium">{request.project_team}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Name</Label>
                  <p className="mt-1">{request.contact_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="mt-1">
                    <a href={`mailto:${request.contact_email}`} className="text-primary hover:underline">
                      {request.contact_email}
                    </a>
                  </p>
                </div>
                {request.contact_phone && (
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="mt-1">{request.contact_phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Actions */}
            {isAdmin && (
              <Card>
                <CardHeader className="bg-ribbon text-ribbon-foreground">
                  <CardTitle className="text-lg">Admin Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label>Update Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Admin Comment</Label>
                    <Textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      placeholder="Add a comment for the submitter"
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleStatusUpdate} 
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Update Request
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Admin Comment Display */}
            {request.admin_comment && !isAdmin && (
              <Card>
                <CardHeader className="bg-muted">
                  <CardTitle className="text-lg">Admin Comment</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p>{request.admin_comment}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
