import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Upload, FileText, X, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ASSET_TYPES = [
  'A Vehicles',
  'B Vehicles',
  'Trailers',
  'Containers',
  'Equipment',
  'Weapons Systems',
  'Communications Equipment',
  'Medical Equipment',
  'Engineering Plant',
  'Other'
];

const URGENCY_LEVELS = [
  { value: 'Low', label: 'Low - Within 6 months' },
  { value: 'Normal', label: 'Normal - Within 3 months' },
  { value: 'High', label: 'High - Within 1 month' },
  { value: 'Urgent', label: 'Urgent - Within 2 weeks' }
];

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

interface UploadedFile {
  file: File;
  documentType: string;
  description: string;
}

export default function NewAssetRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [currentDocType, setCurrentDocType] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');

  const [formData, setFormData] = useState({
    task_title: '',
    task_description: '',
    urgency_level: 'Normal',
    required_by_date: '',
    asset_name: '',
    asset_type: '',
    manufacturer: '',
    model_number: '',
    estimated_weight_kg: '',
    estimated_dimensions: '',
    project_team: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    business_justification: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contact_email: user.email || '',
      }));
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!currentDocType) {
      toast({
        title: 'Document Type Required',
        description: 'Please select a document type before uploading.',
        variant: 'destructive',
      });
      return;
    }

    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      file,
      documentType: currentDocType,
      description: currentDescription,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setCurrentDocType('');
    setCurrentDescription('');
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setFormData({
      task_title: '',
      task_description: '',
      urgency_level: 'Normal',
      required_by_date: '',
      asset_name: '',
      asset_type: '',
      manufacturer: '',
      model_number: '',
      estimated_weight_kg: '',
      estimated_dimensions: '',
      project_team: '',
      contact_name: '',
      contact_email: user?.email || '',
      contact_phone: '',
      business_justification: '',
    });
    setUploadedFiles([]);
  };

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = [
      { field: 'task_title', label: 'Task Title' },
      { field: 'task_description', label: 'Task Description' },
      { field: 'asset_name', label: 'Asset Name' },
      { field: 'asset_type', label: 'Asset Type' },
      { field: 'project_team', label: 'Project Team' },
      { field: 'contact_name', label: 'Contact Name' },
      { field: 'contact_email', label: 'Contact Email' },
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

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to submit a request.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Generate reference
      const { data: refData, error: refError } = await supabase
        .rpc('generate_new_asset_reference');

      if (refError) throw refError;

      // Create request entry
      const { data: request, error: requestError } = await supabase
        .from('new_asset_requests')
        .insert([{
          ...formData,
          reference: refData,
          submitted_by: user.id,
          status: 'Pending',
        }])
        .select()
        .single();

      if (requestError) throw requestError;

      // Upload files and create document records
      const uploadPromises = uploadedFiles.map(async ({ file, documentType, description }) => {
        const filePath = `${request.id}/${Date.now()}_${file.name}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('new-asset-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create document record
        const { error: docError } = await supabase
          .from('new_asset_documents')
          .insert({
            request_id: request.id,
            uploaded_by: user.id,
            file_name: file.name,
            file_path: filePath,
            document_type: documentType,
            description: description || null,
          });

        if (docError) throw docError;
      });

      await Promise.all(uploadPromises);

      toast({
        title: 'Success!',
        description: `New asset request submitted with reference: ${refData}`,
      });

      navigate('/');
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Unable to submit your request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4 lg:p-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <Card className="shadow-2xl border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-b-2 border-primary/10">
            <CardTitle className="text-3xl font-bold text-center">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                New Asset TDS Request
              </span>
            </CardTitle>
            <p className="text-center text-muted-foreground mt-2 text-sm">
              Submit a request for TDS documentation for a new asset. Fields marked with <span className="text-destructive font-bold">*</span> are required.
            </p>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            
            {/* Task Information Section */}
            <section className="bg-card rounded-lg border-2 shadow-sm overflow-hidden">
              <h3 className="mb-0 px-6 py-4 text-lg font-bold text-ribbon-foreground bg-ribbon flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-ribbon-foreground/20 flex items-center justify-center text-sm font-bold">1</span>
                Task Information
              </h3>
              <div className="p-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label htmlFor="task_title">Task Title *</Label>
                    <Input
                      id="task_title"
                      value={formData.task_title}
                      onChange={(e) => handleInputChange('task_title', e.target.value)}
                      placeholder="Brief title describing the request"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="task_description">Task Description *</Label>
                    <Textarea
                      id="task_description"
                      value={formData.task_description}
                      onChange={(e) => handleInputChange('task_description', e.target.value)}
                      placeholder="Detailed description of what TDS documentation is required and why"
                      rows={4}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="urgency_level">Urgency Level *</Label>
                    <Select
                      value={formData.urgency_level}
                      onValueChange={(value) => handleInputChange('urgency_level', value)}
                    >
                      <SelectTrigger id="urgency_level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {URGENCY_LEVELS.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="required_by_date">Required By Date</Label>
                    <Input
                      id="required_by_date"
                      type="date"
                      value={formData.required_by_date}
                      onChange={(e) => handleInputChange('required_by_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Basic Asset Information Section */}
            <section className="bg-card rounded-lg border-2 shadow-sm overflow-hidden">
              <h3 className="mb-0 px-6 py-4 text-lg font-bold text-ribbon-foreground bg-ribbon flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-ribbon-foreground/20 flex items-center justify-center text-sm font-bold">2</span>
                Basic Asset Information
              </h3>
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="asset_name">Asset Name *</Label>
                    <Input
                      id="asset_name"
                      value={formData.asset_name}
                      onChange={(e) => handleInputChange('asset_name', e.target.value)}
                      placeholder="Name or designation of the asset"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="asset_type">Asset Type *</Label>
                    <Select
                      value={formData.asset_type}
                      onValueChange={(value) => handleInputChange('asset_type', value)}
                    >
                      <SelectTrigger id="asset_type">
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                      placeholder="Manufacturer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model_number">Model Number</Label>
                    <Input
                      id="model_number"
                      value={formData.model_number}
                      onChange={(e) => handleInputChange('model_number', e.target.value)}
                      placeholder="Model or part number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_weight_kg">Estimated Weight (kg)</Label>
                    <Input
                      id="estimated_weight_kg"
                      value={formData.estimated_weight_kg}
                      onChange={(e) => handleInputChange('estimated_weight_kg', e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="Approximate weight in kg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_dimensions">Estimated Dimensions (L x W x H)</Label>
                    <Input
                      id="estimated_dimensions"
                      value={formData.estimated_dimensions}
                      onChange={(e) => handleInputChange('estimated_dimensions', e.target.value)}
                      placeholder="e.g., 5.0m x 2.5m x 3.0m"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Information Section */}
            <section className="bg-card rounded-lg border-2 shadow-sm overflow-hidden">
              <h3 className="mb-0 px-6 py-4 text-lg font-bold text-ribbon-foreground bg-ribbon flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-ribbon-foreground/20 flex items-center justify-center text-sm font-bold">3</span>
                Contact Information
              </h3>
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="project_team">Project Team *</Label>
                    <Input
                      id="project_team"
                      value={formData.project_team}
                      onChange={(e) => handleInputChange('project_team', e.target.value)}
                      placeholder="Your project team name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_name">Contact Name *</Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => handleInputChange('contact_name', e.target.value)}
                      placeholder="Primary contact person"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email">Contact Email *</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      placeholder="your.email@mod.gov.uk"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      placeholder="Contact phone number"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="business_justification">Business Justification</Label>
                    <Textarea
                      id="business_justification"
                      value={formData.business_justification}
                      onChange={(e) => handleInputChange('business_justification', e.target.value)}
                      placeholder="Explain the business need for this TDS request"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Supporting Documents Section */}
            <section className="bg-card rounded-lg border-2 shadow-sm overflow-hidden">
              <h3 className="mb-0 px-6 py-4 text-lg font-bold text-ribbon-foreground bg-ribbon flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-ribbon-foreground/20 flex items-center justify-center text-sm font-bold">4</span>
                Supporting Documents
              </h3>
              <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload supporting documents such as CAD drawings, technical specifications, business case, etc. 
                  You can add more documents after submission.
                </p>

                {/* Upload Controls */}
                <div className="grid gap-4 md:grid-cols-3 p-4 bg-muted/50 rounded-lg border">
                  <div>
                    <Label htmlFor="doc_type">Document Type</Label>
                    <Select
                      value={currentDocType}
                      onValueChange={setCurrentDocType}
                    >
                      <SelectTrigger id="doc_type">
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
                    <Label htmlFor="doc_description">Description (Optional)</Label>
                    <Input
                      id="doc_description"
                      value={currentDescription}
                      onChange={(e) => setCurrentDescription(e.target.value)}
                      placeholder="Brief description"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="relative w-full">
                      <input
                        type="file"
                        id="file_upload"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileSelect}
                        multiple
                        accept=".pdf,.doc,.docx,.dwg,.dxf,.jpg,.jpeg,.png,.xlsx,.xls"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        disabled={!currentDocType}
                      >
                        <Upload className="h-4 w-4" />
                        Choose Files
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Documents ({uploadedFiles.length})</Label>
                    <div className="border rounded-lg divide-y">
                      {uploadedFiles.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{item.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.documentType}{item.description && ` - ${item.description}`}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={loading}
              >
                Reset Form
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
