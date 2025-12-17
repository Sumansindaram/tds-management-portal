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
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Upload, FileText, X, Plus, ClipboardList, Truck, FileCheck, Info, Ruler, Weight, Settings, File, FileEdit, FilePlus } from 'lucide-react';
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

const PROTECTIVE_MARKINGS = [
  'Official',
  'Official-Sensitive',
  'Secret',
  'Top Secret'
];

const REASON_FOR_TASK = [
  'New Entry',
  'Amendment to existing entry',
  'UOR',
  'R&D'
];

const LICENCE_CATEGORIES = [
  'B', 'C', 'C+E', 'D', 'D+E', 'H', 'Military Only', 'N/A'
];

const TASKS_DATA_SHEETS = [
  { id: 'basic_data', label: 'Basic Data' },
  { id: 'slinging', label: 'Slinging' },
  { id: 'let', label: 'LET' },
  { id: 'road', label: 'Road' },
  { id: 'rail', label: 'Rail' },
  { id: 'het', label: 'HET' },
  { id: 'drops', label: 'DROPS' },
  { id: 'epls', label: 'EPLS' },
  { id: 'container_mje', label: 'Container (MJE)' },
  { id: 'container_ym', label: 'Container (YM)' },
  { id: 'special_request', label: 'Special Request/Task' },
];

const DOCUMENT_TYPES = [
  'CAD Drawing (.dxf/.dwg)',
  'Technical Specification',
  'BIRD Form',
  'Weight Certificate',
  'CoG Data',
  'Lashing Point Data',
  'Manufacturer Documentation',
  'Business Case',
  'Safety Assessment',
  'Risk Assessment',
  'SSR Approval Document',
  'Other'
];

const REQUEST_TYPES = [
  { id: 'new', label: 'New Request', description: 'Request TDS for a new asset', icon: FilePlus },
  { id: 'full_amendment', label: 'Full Amendment', description: 'Comprehensive amendment to existing TDS entry', icon: FileEdit },
  { id: 'partial_amendment', label: 'Partial Amendment', description: 'Amend specific fields or drawings only', icon: FileText },
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
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [requestType, setRequestType] = useState<'new' | 'full_amendment' | 'partial_amendment'>('new');
  
  // Section toggles for partial amendment
  const [sectionToggles, setSectionToggles] = useState({
    ptSponsor: false,
    equipmentDetails: false,
    taskRequirements: false,
    driverInfo: false,
    overviewTasking: false,
    dimensional: false,
    weight: false,
    otherInfo: false,
    drawings: false,
  });

  // Declarations for submission
  const [declarations, setDeclarations] = useState({
    ssrApprovalAttached: false,
    dataAccuracyConfirmed: false,
    authorisedPerson: false,
  });

  // Existing TDS reference for amendments
  const [existingReference, setExistingReference] = useState('');
  const [amendmentNotes, setAmendmentNotes] = useState('');

  const [formData, setFormData] = useState({
    // Part 1 - PT/Sponsor Info
    project_team: '',
    poc_name: '',
    tel_no: '',
    contact_email: '',
    uin: '',
    rac: '',
    management_code: '',
    blb_code: '',
    
    // Part 2 - Equipment Details
    asset_name: '',
    short_name: '',
    nsn: '',
    asset_type: '',
    ric_code: '',
    protective_marking: 'Official',
    manufacturer: '',
    model_number: '',
    
    // Part 3 - Task Requirements
    reason_for_task: 'New Entry',
    bird_completed: false,
    tech_drawings_attached: false,
    proposed_trial_dates: '',
    delivery_date_to_service: '',
    task_description: '',
    
    // Part 4 - Driver Information
    licence_category: '',
    crew_number: '',
    passenger_capacity: '',
    fuel_capacity_litres: '',
    range_km: '',
    speed_single_carriageway: '',
    speed_dual_carriageway: '',
    max_speed: '',
    
    // Overview & Tasking
    overview: '',
    tasking_description: '',
    
    // BIRD - Dimensional Information
    length_mm: '',
    width_mm: '',
    height_mm: '',
    ground_clearance_mm: '',
    approach_angle: '',
    departure_angle: '',
    front_track_width_mm: '',
    rear_track_width_mm: '',
    
    // BIRD - Weight Information
    laden_weight_kg: '',
    unladen_weight_kg: '',
    mlc_laden: '',
    mlc_unladen: '',
    
    // BIRD - Other Information
    turning_circle: '',
    cog_height: '',
    cog_longitudinal: '',
    cog_lateral: '',
    tyre_size: '',
    tyre_type: '',
    lashing_point_info: '',
    lifting_eye_positions: '',
    removable_items: '',
    additional_remarks: '',
    
    // Legacy fields
    task_title: '',
    urgency_level: 'Normal',
    required_by_date: '',
    estimated_weight_kg: '',
    estimated_dimensions: '',
    contact_name: '',
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

  // Update reason_for_task based on request type
  useEffect(() => {
    if (requestType === 'new') {
      setFormData(prev => ({ ...prev, reason_for_task: 'New Entry' }));
    } else {
      setFormData(prev => ({ ...prev, reason_for_task: 'Amendment to existing entry' }));
    }
  }, [requestType]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(t => t !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSectionToggle = (section: keyof typeof sectionToggles) => {
    setSectionToggles(prev => ({ ...prev, [section]: !prev[section] }));
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
      project_team: '',
      poc_name: '',
      tel_no: '',
      contact_email: user?.email || '',
      uin: '',
      rac: '',
      management_code: '',
      blb_code: '',
      asset_name: '',
      short_name: '',
      nsn: '',
      asset_type: '',
      ric_code: '',
      protective_marking: 'Official',
      manufacturer: '',
      model_number: '',
      reason_for_task: 'New Entry',
      bird_completed: false,
      tech_drawings_attached: false,
      proposed_trial_dates: '',
      delivery_date_to_service: '',
      task_description: '',
      licence_category: '',
      crew_number: '',
      passenger_capacity: '',
      fuel_capacity_litres: '',
      range_km: '',
      speed_single_carriageway: '',
      speed_dual_carriageway: '',
      max_speed: '',
      overview: '',
      tasking_description: '',
      length_mm: '',
      width_mm: '',
      height_mm: '',
      ground_clearance_mm: '',
      approach_angle: '',
      departure_angle: '',
      front_track_width_mm: '',
      rear_track_width_mm: '',
      laden_weight_kg: '',
      unladen_weight_kg: '',
      mlc_laden: '',
      mlc_unladen: '',
      turning_circle: '',
      cog_height: '',
      cog_longitudinal: '',
      cog_lateral: '',
      tyre_size: '',
      tyre_type: '',
      lashing_point_info: '',
      lifting_eye_positions: '',
      removable_items: '',
      additional_remarks: '',
      task_title: '',
      urgency_level: 'Normal',
      required_by_date: '',
      estimated_weight_kg: '',
      estimated_dimensions: '',
      contact_name: '',
      contact_phone: '',
      business_justification: '',
    });
    setUploadedFiles([]);
    setSelectedTasks([]);
    setDeclarations({
      ssrApprovalAttached: false,
      dataAccuracyConfirmed: false,
      authorisedPerson: false,
    });
    setSectionToggles({
      ptSponsor: false,
      equipmentDetails: false,
      taskRequirements: false,
      driverInfo: false,
      overviewTasking: false,
      dimensional: false,
      weight: false,
      otherInfo: false,
      drawings: false,
    });
    setExistingReference('');
    setAmendmentNotes('');
  };

  const isPartialAmendment = requestType === 'partial_amendment';
  const isAmendment = requestType === 'full_amendment' || requestType === 'partial_amendment';

  // Check if section should be shown
  const shouldShowSection = (section: keyof typeof sectionToggles) => {
    if (!isPartialAmendment) return true;
    return sectionToggles[section];
  };

  // Check if any section is enabled for partial amendment
  const hasAnySectionEnabled = Object.values(sectionToggles).some(v => v);

  // Validation for declarations
  const areDeclarationsComplete = declarations.ssrApprovalAttached && 
    declarations.dataAccuracyConfirmed && 
    declarations.authorisedPerson;

  const handleSubmit = async () => {
    // Validate declarations
    if (!areDeclarationsComplete) {
      toast({
        title: 'Declarations Required',
        description: 'Please confirm all declarations before submitting.',
        variant: 'destructive',
      });
      return;
    }

    // Validate SSR approval document for amendments
    if (isAmendment && !uploadedFiles.some(f => f.documentType === 'SSR Approval Document')) {
      toast({
        title: 'SSR Approval Required',
        description: 'Please attach the SSR Approval Document before submitting an amendment.',
        variant: 'destructive',
      });
      return;
    }

    // Validate existing reference for amendments
    if (isAmendment && !existingReference) {
      toast({
        title: 'Existing Reference Required',
        description: 'Please enter the existing TDS reference number for the entry you wish to amend.',
        variant: 'destructive',
      });
      return;
    }

    // For partial amendment, check at least one section is selected
    if (isPartialAmendment && !hasAnySectionEnabled) {
      toast({
        title: 'Section Selection Required',
        description: 'Please select at least one section to amend.',
        variant: 'destructive',
      });
      return;
    }

    // Validate required fields based on request type
    const requiredFields = isPartialAmendment ? [
      { field: 'project_team', label: 'Project Team' },
      { field: 'poc_name', label: 'POC Name' },
      { field: 'contact_email', label: 'Email' },
    ] : [
      { field: 'project_team', label: 'Project Team' },
      { field: 'poc_name', label: 'POC Name' },
      { field: 'contact_email', label: 'Email' },
      { field: 'asset_name', label: 'Equipment Designation' },
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

      // Create task title
      const requestTypeLabel = REQUEST_TYPES.find(t => t.id === requestType)?.label || 'Request';
      const taskTitle = isPartialAmendment 
        ? `${requestTypeLabel}: ${existingReference} - ${Object.entries(sectionToggles).filter(([_, v]) => v).map(([k]) => k).join(', ')}`
        : `${requestTypeLabel}: ${formData.asset_name}${formData.short_name ? ` (${formData.short_name})` : ''}`;

      // Build sections to amend for partial amendment
      const sectionsToAmend = isPartialAmendment ? Object.entries(sectionToggles)
        .filter(([_, enabled]) => enabled)
        .map(([section]) => section) : null;

      // Create request entry
      const { data: request, error: requestError } = await supabase
        .from('new_asset_requests')
        .insert([{
          reference: refData,
          submitted_by: user.id,
          status: 'Pending',
          task_title: taskTitle,
          task_description: isPartialAmendment 
            ? `Amendment to ${existingReference}. Sections: ${sectionsToAmend?.join(', ')}. Notes: ${amendmentNotes}`
            : formData.task_description || formData.tasking_description,
          urgency_level: formData.urgency_level,
          required_by_date: formData.required_by_date || null,
          asset_name: formData.asset_name || existingReference,
          asset_type: formData.asset_type || 'Amendment',
          manufacturer: formData.manufacturer || null,
          model_number: formData.model_number || null,
          estimated_weight_kg: formData.laden_weight_kg || formData.estimated_weight_kg || null,
          estimated_dimensions: formData.estimated_dimensions || (formData.length_mm ? `${formData.length_mm}mm x ${formData.width_mm}mm x ${formData.height_mm}mm` : null),
          project_team: formData.project_team,
          contact_name: formData.poc_name || formData.contact_name,
          contact_email: formData.contact_email,
          contact_phone: formData.tel_no || formData.contact_phone || null,
          business_justification: formData.business_justification || null,
          // New fields
          poc_name: formData.poc_name || null,
          tel_no: formData.tel_no || null,
          uin: formData.uin || null,
          rac: formData.rac || null,
          management_code: formData.management_code || null,
          blb_code: formData.blb_code || null,
          short_name: formData.short_name || null,
          nsn: formData.nsn || null,
          ric_code: formData.ric_code || null,
          protective_marking: formData.protective_marking || null,
          reason_for_task: formData.reason_for_task || null,
          tasks_required: isPartialAmendment ? { requestType, existingReference, sectionsToAmend, amendmentNotes } : selectedTasks,
          bird_completed: formData.bird_completed,
          tech_drawings_attached: formData.tech_drawings_attached,
          proposed_trial_dates: formData.proposed_trial_dates || null,
          delivery_date_to_service: formData.delivery_date_to_service || null,
          licence_category: formData.licence_category || null,
          crew_number: formData.crew_number || null,
          passenger_capacity: formData.passenger_capacity || null,
          fuel_capacity_litres: formData.fuel_capacity_litres || null,
          range_km: formData.range_km || null,
          speed_single_carriageway: formData.speed_single_carriageway || null,
          speed_dual_carriageway: formData.speed_dual_carriageway || null,
          max_speed: formData.max_speed || null,
          overview: formData.overview || null,
          tasking_description: formData.tasking_description || null,
          length_mm: formData.length_mm || null,
          width_mm: formData.width_mm || null,
          height_mm: formData.height_mm || null,
          ground_clearance_mm: formData.ground_clearance_mm || null,
          approach_angle: formData.approach_angle || null,
          departure_angle: formData.departure_angle || null,
          front_track_width_mm: formData.front_track_width_mm || null,
          rear_track_width_mm: formData.rear_track_width_mm || null,
          laden_weight_kg: formData.laden_weight_kg || null,
          unladen_weight_kg: formData.unladen_weight_kg || null,
          mlc_laden: formData.mlc_laden || null,
          mlc_unladen: formData.mlc_unladen || null,
          turning_circle: formData.turning_circle || null,
          cog_height: formData.cog_height || null,
          cog_longitudinal: formData.cog_longitudinal || null,
          cog_lateral: formData.cog_lateral || null,
          tyre_size: formData.tyre_size || null,
          tyre_type: formData.tyre_type || null,
          lashing_point_info: formData.lashing_point_info || null,
          lifting_eye_positions: formData.lifting_eye_positions || null,
          removable_items: formData.removable_items || null,
          additional_remarks: formData.additional_remarks || null,
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
        description: `${REQUEST_TYPES.find(t => t.id === requestType)?.label} submitted with reference: ${refData}`,
      });

      navigate('/new-asset-requests');
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

  const SectionHeader = ({ number, title, icon: Icon, toggleKey }: { number: number; title: string; icon: any; toggleKey?: keyof typeof sectionToggles }) => (
    <div className="flex items-center justify-between px-6 py-4 bg-ribbon">
      <h3 className="text-lg font-bold text-ribbon-foreground flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-ribbon-foreground/20 flex items-center justify-center text-sm font-bold">{number}</span>
        <Icon className="h-5 w-5" />
        {title}
      </h3>
      {isPartialAmendment && toggleKey && (
        <div className="flex items-center gap-2">
          <Label htmlFor={`toggle-${toggleKey}`} className="text-ribbon-foreground text-sm">
            {sectionToggles[toggleKey] ? 'Amending' : 'No changes'}
          </Label>
          <Switch
            id={`toggle-${toggleKey}`}
            checked={sectionToggles[toggleKey]}
            onCheckedChange={() => handleSectionToggle(toggleKey)}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="w-full p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="secondary"
            onClick={() => navigate('/new-asset-requests')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Requests
          </Button>

          <Card className="shadow-2xl border-2">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b-2 border-primary/20">
              <CardTitle className="text-3xl font-bold text-center">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  New TDS Request
                </span>
              </CardTitle>
              <p className="text-center text-muted-foreground mt-2 text-sm">
                Basic Information Requirement Data (BIRD) Form - Fields marked with <span className="text-destructive font-bold">*</span> are required
              </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Request Type Selector */}
              <section className="bg-card rounded-lg border-2 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-primary/10 border-b">
                  <h3 className="text-lg font-bold text-foreground">Select Request Type</h3>
                </div>
                <div className="p-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {REQUEST_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = requestType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setRequestType(type.id as typeof requestType)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/10 ring-2 ring-primary/30' 
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={`font-semibold ${isSelected ? 'text-primary' : ''}`}>{type.label}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Existing Reference for Amendments */}
                  {isAmendment && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
                      <Label htmlFor="existingReference" className="font-semibold">Existing TDS Reference Number *</Label>
                      <Input
                        id="existingReference"
                        value={existingReference}
                        onChange={(e) => setExistingReference(e.target.value)}
                        placeholder="e.g., TDS-000123"
                        className="mt-2"
                      />
                      <p className="text-sm text-muted-foreground mt-1">Enter the reference number of the existing TDS entry you wish to amend.</p>
                    </div>
                  )}

                  {/* Amendment Notes for Partial */}
                  {isPartialAmendment && (
                    <div className="mt-4 p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      <Label htmlFor="amendmentNotes" className="font-semibold">Amendment Details *</Label>
                      <Textarea
                        id="amendmentNotes"
                        value={amendmentNotes}
                        onChange={(e) => setAmendmentNotes(e.target.value)}
                        placeholder="Describe what specific changes are needed. E.g., 'Update weight from 34,000kg to 36,500kg' or 'Update front view drawing to include new antenna'"
                        className="mt-2"
                        rows={3}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Toggle ON only the sections below that require amendments. Disabled sections will not be shown.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* PART 1 - PT/Sponsor Information */}
              <section className={`bg-card rounded-lg border-2 shadow-sm overflow-hidden ${isPartialAmendment && !sectionToggles.ptSponsor ? 'opacity-50' : ''}`}>
                <SectionHeader number={1} title="PART 1 – PT/SPONSOR" icon={ClipboardList} toggleKey="ptSponsor" />
                {shouldShowSection('ptSponsor') && (
                  <div className="p-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <Label htmlFor="project_team">Project Team *</Label>
                        <Input
                          id="project_team"
                          value={formData.project_team}
                          onChange={(e) => handleInputChange('project_team', e.target.value)}
                          placeholder="e.g., LEOC-LCV-MIV"
                        />
                      </div>
                      <div>
                        <Label htmlFor="poc_name">POC (Point of Contact) *</Label>
                        <Input
                          id="poc_name"
                          value={formData.poc_name}
                          onChange={(e) => handleInputChange('poc_name', e.target.value)}
                          placeholder="e.g., James Meaden"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tel_no">Tel No</Label>
                        <Input
                          id="tel_no"
                          value={formData.tel_no}
                          onChange={(e) => handleInputChange('tel_no', e.target.value)}
                          placeholder="e.g., 03001578711"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_email">Email *</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          value={formData.contact_email}
                          onChange={(e) => handleInputChange('contact_email', e.target.value)}
                          placeholder="e.g., name@mod.gov.uk"
                        />
                      </div>
                      <div>
                        <Label htmlFor="uin">UIN</Label>
                        <Input
                          id="uin"
                          value={formData.uin}
                          onChange={(e) => handleInputChange('uin', e.target.value)}
                          placeholder="e.g., P0317A"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rac">RAC</Label>
                        <Input
                          id="rac"
                          value={formData.rac}
                          onChange={(e) => handleInputChange('rac', e.target.value)}
                          placeholder="e.g., ASF080"
                        />
                      </div>
                      <div>
                        <Label htmlFor="management_code">Management (MG) Code</Label>
                        <Input
                          id="management_code"
                          value={formData.management_code}
                          onChange={(e) => handleInputChange('management_code', e.target.value)}
                          placeholder="e.g., D00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="blb_code">Bottom Level Budget (BLB) Code</Label>
                        <Input
                          id="blb_code"
                          value={formData.blb_code}
                          onChange={(e) => handleInputChange('blb_code', e.target.value)}
                          placeholder="e.g., 8575"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* PART 2 - Equipment Details */}
              <section className={`bg-card rounded-lg border-2 shadow-sm overflow-hidden ${isPartialAmendment && !sectionToggles.equipmentDetails ? 'opacity-50' : ''}`}>
                <SectionHeader number={2} title="PART 2 – EQUIPMENT DETAILS" icon={Truck} toggleKey="equipmentDetails" />
                {shouldShowSection('equipmentDetails') && (
                  <div className="p-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="sm:col-span-2">
                        <Label htmlFor="asset_name">Full Equipment Designation / Name {!isPartialAmendment && '*'}</Label>
                        <Input
                          id="asset_name"
                          value={formData.asset_name}
                          onChange={(e) => handleInputChange('asset_name', e.target.value)}
                          placeholder="e.g., Mechanised Infantry Vehicle"
                        />
                      </div>
                      <div>
                        <Label htmlFor="short_name">Short Equipment Name / Abbreviations</Label>
                        <Input
                          id="short_name"
                          value={formData.short_name}
                          onChange={(e) => handleInputChange('short_name', e.target.value)}
                          placeholder="e.g., MIV"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nsn">NSN (NATO Stock Number)</Label>
                        <Input
                          id="nsn"
                          value={formData.nsn}
                          onChange={(e) => handleInputChange('nsn', e.target.value)}
                          placeholder="e.g., 2355-12-420-0842"
                        />
                      </div>
                      <div>
                        <Label htmlFor="asset_type">Asset Type {!isPartialAmendment && '*'}</Label>
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
                        <Label htmlFor="ric_code">RIC Code</Label>
                        <Input
                          id="ric_code"
                          value={formData.ric_code}
                          onChange={(e) => handleInputChange('ric_code', e.target.value)}
                          placeholder="e.g., TBD"
                        />
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
                        <Label htmlFor="protective_marking">Protective Marking Status</Label>
                        <Select
                          value={formData.protective_marking}
                          onValueChange={(value) => handleInputChange('protective_marking', value)}
                        >
                          <SelectTrigger id="protective_marking">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PROTECTIVE_MARKINGS.map(marking => (
                              <SelectItem key={marking} value={marking}>{marking}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* PART 3 - Task Requirement Details */}
              <section className={`bg-card rounded-lg border-2 shadow-sm overflow-hidden ${isPartialAmendment && !sectionToggles.taskRequirements ? 'opacity-50' : ''}`}>
                <SectionHeader number={3} title="PART 3 – TASK REQUIREMENT DETAILS" icon={FileCheck} toggleKey="taskRequirements" />
                {shouldShowSection('taskRequirements') && (
                  <div className="p-6 space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <Label htmlFor="reason_for_task">Reason for Task</Label>
                        <Select
                          value={formData.reason_for_task}
                          onValueChange={(value) => handleInputChange('reason_for_task', value)}
                        >
                          <SelectTrigger id="reason_for_task">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REASON_FOR_TASK.map(reason => (
                              <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="proposed_trial_dates">Proposed Trial Dates</Label>
                        <Input
                          id="proposed_trial_dates"
                          value={formData.proposed_trial_dates}
                          onChange={(e) => handleInputChange('proposed_trial_dates', e.target.value)}
                          placeholder="e.g., CW19 2024"
                        />
                      </div>
                      <div>
                        <Label htmlFor="delivery_date_to_service">Required Delivery Date</Label>
                        <Input
                          id="delivery_date_to_service"
                          type="date"
                          value={formData.delivery_date_to_service}
                          onChange={(e) => handleInputChange('delivery_date_to_service', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Tasks/Data Sheets Required */}
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Tasks/Data Sheets Required (In consultation with MTSR)</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {TASKS_DATA_SHEETS.map(task => (
                          <div key={task.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={task.id}
                              checked={selectedTasks.includes(task.id)}
                              onCheckedChange={() => handleTaskToggle(task.id)}
                            />
                            <Label htmlFor={task.id} className="text-sm cursor-pointer">{task.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="bird_completed"
                          checked={formData.bird_completed}
                          onCheckedChange={(checked) => handleInputChange('bird_completed', checked as boolean)}
                        />
                        <Label htmlFor="bird_completed" className="cursor-pointer">BIRD Form Completed</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="tech_drawings_attached"
                          checked={formData.tech_drawings_attached}
                          onCheckedChange={(checked) => handleInputChange('tech_drawings_attached', checked as boolean)}
                        />
                        <Label htmlFor="tech_drawings_attached" className="cursor-pointer">Tech Drawings Attached (.dxf or .dwg)</Label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="task_description">Task Description / Special Requirements</Label>
                      <Textarea
                        id="task_description"
                        value={formData.task_description}
                        onChange={(e) => handleInputChange('task_description', e.target.value)}
                        placeholder="Describe the specific TDS requirements, special requests, or additional notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* PART 4 - Equipment Master Driver Information */}
              <section className={`bg-card rounded-lg border-2 shadow-sm overflow-hidden ${isPartialAmendment && !sectionToggles.driverInfo ? 'opacity-50' : ''}`}>
                <SectionHeader number={4} title="PART 4 – EQUIPMENT MASTER DRIVER INFORMATION" icon={Info} toggleKey="driverInfo" />
                {shouldShowSection('driverInfo') && (
                  <div className="p-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <Label htmlFor="licence_category">Licence Category</Label>
                        <Select
                          value={formData.licence_category}
                          onValueChange={(value) => handleInputChange('licence_category', value)}
                        >
                          <SelectTrigger id="licence_category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {LICENCE_CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="crew_number">No. of Crew</Label>
                        <Input
                          id="crew_number"
                          value={formData.crew_number}
                          onChange={(e) => handleInputChange('crew_number', e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="e.g., 3"
                        />
                      </div>
                      <div>
                        <Label htmlFor="passenger_capacity">No. of Passengers</Label>
                        <Input
                          id="passenger_capacity"
                          value={formData.passenger_capacity}
                          onChange={(e) => handleInputChange('passenger_capacity', e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="e.g., 8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fuel_capacity_litres">Fuel Capacity (Litres)</Label>
                        <Input
                          id="fuel_capacity_litres"
                          value={formData.fuel_capacity_litres}
                          onChange={(e) => handleInputChange('fuel_capacity_litres', e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="e.g., 562"
                        />
                      </div>
                      <div>
                        <Label htmlFor="range_km">Range (Km)</Label>
                        <Input
                          id="range_km"
                          value={formData.range_km}
                          onChange={(e) => handleInputChange('range_km', e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="e.g., 530"
                        />
                      </div>
                      <div>
                        <Label htmlFor="speed_single_carriageway">Speed Single Carriageway</Label>
                        <Input
                          id="speed_single_carriageway"
                          value={formData.speed_single_carriageway}
                          onChange={(e) => handleInputChange('speed_single_carriageway', e.target.value)}
                          placeholder="e.g., 40 mph"
                        />
                      </div>
                      <div>
                        <Label htmlFor="speed_dual_carriageway">Speed Dual Carriageway</Label>
                        <Input
                          id="speed_dual_carriageway"
                          value={formData.speed_dual_carriageway}
                          onChange={(e) => handleInputChange('speed_dual_carriageway', e.target.value)}
                          placeholder="e.g., 40 mph"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_speed">Max Speed</Label>
                        <Input
                          id="max_speed"
                          value={formData.max_speed}
                          onChange={(e) => handleInputChange('max_speed', e.target.value)}
                          placeholder="e.g., 103 km/h"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* OVERVIEW & TASKING */}
              <section className={`bg-card rounded-lg border-2 shadow-sm overflow-hidden ${isPartialAmendment && !sectionToggles.overviewTasking ? 'opacity-50' : ''}`}>
                <SectionHeader number={5} title="OVERVIEW & TASKING" icon={FileText} toggleKey="overviewTasking" />
                {shouldShowSection('overviewTasking') && (
                  <div className="p-6 space-y-4">
                    <div>
                      <Label htmlFor="overview">Overview</Label>
                      <Textarea
                        id="overview"
                        value={formData.overview}
                        onChange={(e) => handleInputChange('overview', e.target.value)}
                        placeholder="Provide an overview of the equipment and its deployability requirements..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tasking_description">Tasking Details</Label>
                      <Textarea
                        id="tasking_description"
                        value={formData.tasking_description}
                        onChange={(e) => handleInputChange('tasking_description', e.target.value)}
                        placeholder="Describe the specific tasking requirements, theoretical assessments needed, physical trialling requirements..."
                        rows={4}
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* BIRD - Dimensional Information */}
              <section className={`bg-card rounded-lg border-2 shadow-sm overflow-hidden ${isPartialAmendment && !sectionToggles.dimensional ? 'opacity-50' : ''}`}>
                <SectionHeader number={6} title="BIRD – DIMENSIONAL INFORMATION" icon={Ruler} toggleKey="dimensional" />
                {shouldShowSection('dimensional') && (
                  <div className="p-6">
                    <p className="text-sm text-muted-foreground mb-4">All dimensions should be provided in millimetres (mm). Drawings must be supplied electronically in .DXF or .DWG formats.</p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <Label htmlFor="length_mm">Length (mm)</Label>
                        <Input
                          id="length_mm"
                          value={formData.length_mm}
                          onChange={(e) => handleInputChange('length_mm', e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="e.g., 8909"
                        />
                      </div>
                      <div>
                        <Label htmlFor="width_mm">Width (mm)</Label>
                        <Input
                          id="width_mm"
                          value={formData.width_mm}
                          onChange={(e) => handleInputChange('width_mm', e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="e.g., 2999"
                        />
                      </div>
                      <div>
                        <Label htmlFor="height_mm">Height (mm)</Label>
                        <Input
                          id="height_mm"
                          value={formData.height_mm}
                          onChange={(e) => handleInputChange('height_mm', e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="e.g., 3747"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ground_clearance_mm">Ground Clearance (mm)</Label>
                        <Input
                          id="ground_clearance_mm"
                          value={formData.ground_clearance_mm}
                          onChange={(e) => handleInputChange('ground_clearance_mm', e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="e.g., 400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="approach_angle">Approach Angle (degrees)</Label>
                        <Input
                          id="approach_angle"
                          value={formData.approach_angle}
                          onChange={(e) => handleInputChange('approach_angle', e.target.value)}
                          placeholder="e.g., 40"
                        />
                      </div>
                      <div>
                        <Label htmlFor="departure_angle">Departure Angle (degrees)</Label>
                        <Input
                          id="departure_angle"
                          value={formData.departure_angle}
                          onChange={(e) => handleInputChange('departure_angle', e.target.value)}
                          placeholder="e.g., 35"
                        />
                      </div>
                      <div>
                        <Label htmlFor="front_track_width_mm">Front Track Width (mm)</Label>
                        <Input
                          id="front_track_width_mm"
                          value={formData.front_track_width_mm}
                          onChange={(e) => handleInputChange('front_track_width_mm', e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="e.g., 2582"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rear_track_width_mm">Rear Track Width (mm)</Label>
                        <Input
                          id="rear_track_width_mm"
                          value={formData.rear_track_width_mm}
                          onChange={(e) => handleInputChange('rear_track_width_mm', e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="e.g., 2582"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* BIRD - Weight Information */}
              <section className={`bg-card rounded-lg border-2 shadow-sm overflow-hidden ${isPartialAmendment && !sectionToggles.weight ? 'opacity-50' : ''}`}>
                <SectionHeader number={7} title="BIRD – WEIGHT INFORMATION" icon={Weight} toggleKey="weight" />
                {shouldShowSection('weight') && (
                  <div className="p-6">
                    <p className="text-sm text-muted-foreground mb-4">All weights should be provided in kilograms (kg).</p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <Label htmlFor="laden_weight_kg">Maximum Laden Weight (kg)</Label>
                        <Input
                          id="laden_weight_kg"
                          value={formData.laden_weight_kg}
                          onChange={(e) => handleInputChange('laden_weight_kg', e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="e.g., 38500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="unladen_weight_kg">Minimum Unladen Weight (kg)</Label>
                        <Input
                          id="unladen_weight_kg"
                          value={formData.unladen_weight_kg}
                          onChange={(e) => handleInputChange('unladen_weight_kg', e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="e.g., 34129"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mlc_laden">Bridge Classification Laden (MLC)</Label>
                        <Input
                          id="mlc_laden"
                          value={formData.mlc_laden}
                          onChange={(e) => handleInputChange('mlc_laden', e.target.value)}
                          placeholder="e.g., MLC 48"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mlc_unladen">Bridge Classification Unladen (MLC)</Label>
                        <Input
                          id="mlc_unladen"
                          value={formData.mlc_unladen}
                          onChange={(e) => handleInputChange('mlc_unladen', e.target.value)}
                          placeholder="e.g., MLC 38"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* BIRD - Other Information */}
              <section className={`bg-card rounded-lg border-2 shadow-sm overflow-hidden ${isPartialAmendment && !sectionToggles.otherInfo ? 'opacity-50' : ''}`}>
                <SectionHeader number={8} title="BIRD – OTHER INFORMATION" icon={Settings} toggleKey="otherInfo" />
                {shouldShowSection('otherInfo') && (
                  <div className="p-6 space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <Label htmlFor="turning_circle">Turning Circle</Label>
                        <Input
                          id="turning_circle"
                          value={formData.turning_circle}
                          onChange={(e) => handleInputChange('turning_circle', e.target.value)}
                          placeholder="e.g., 20 m"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tyre_size">Tyre Size</Label>
                        <Input
                          id="tyre_size"
                          value={formData.tyre_size}
                          onChange={(e) => handleInputChange('tyre_size', e.target.value)}
                          placeholder="e.g., 415/80R685"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tyre_type">Tyre Type</Label>
                        <Input
                          id="tyre_type"
                          value={formData.tyre_type}
                          onChange={(e) => handleInputChange('tyre_type', e.target.value)}
                          placeholder="e.g., 415/80R685TR X FORCE ZL"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-3 block">Centre of Gravity (CoG) Information</Label>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <Label htmlFor="cog_height">CoG Height from Ground (mm)</Label>
                          <Input
                            id="cog_height"
                            value={formData.cog_height}
                            onChange={(e) => handleInputChange('cog_height', e.target.value)}
                            placeholder="e.g., 1356"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cog_longitudinal">Longitudinal Position (mm)</Label>
                          <Input
                            id="cog_longitudinal"
                            value={formData.cog_longitudinal}
                            onChange={(e) => handleInputChange('cog_longitudinal', e.target.value)}
                            placeholder="e.g., 2572"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cog_lateral">Lateral Position (mm)</Label>
                          <Input
                            id="cog_lateral"
                            value={formData.cog_lateral}
                            onChange={(e) => handleInputChange('cog_lateral', e.target.value)}
                            placeholder="e.g., 1300"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="lifting_eye_positions">Lifting Eye Positions</Label>
                        <Textarea
                          id="lifting_eye_positions"
                          value={formData.lifting_eye_positions}
                          onChange={(e) => handleInputChange('lifting_eye_positions', e.target.value)}
                          placeholder="e.g., 2 front upper (1 left, 1 right), 2 back (1 left, 1 right)"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lashing_point_info">Lashing Point Information</Label>
                        <Textarea
                          id="lashing_point_info"
                          value={formData.lashing_point_info}
                          onChange={(e) => handleInputChange('lashing_point_info', e.target.value)}
                          placeholder="e.g., 4 front (2 upper, 2 lower), 2 back (1 left, 1 right)"
                          rows={2}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="removable_items">Removable Items (Antenna, Canvas, Tool bins, etc.)</Label>
                      <Textarea
                        id="removable_items"
                        value={formData.removable_items}
                        onChange={(e) => handleInputChange('removable_items', e.target.value)}
                        placeholder="List any removable items that may need to be removed prior to transport..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="additional_remarks">Additional Information or Remarks</Label>
                      <Textarea
                        id="additional_remarks"
                        value={formData.additional_remarks}
                        onChange={(e) => handleInputChange('additional_remarks', e.target.value)}
                        placeholder="Any additional information or remarks..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* Supporting Documents Section */}
              <section className={`bg-card rounded-lg border-2 shadow-sm overflow-hidden ${isPartialAmendment && !sectionToggles.drawings ? 'opacity-50' : ''}`}>
                <SectionHeader number={9} title="SUPPORTING DOCUMENTATION" icon={File} toggleKey="drawings" />
                {(shouldShowSection('drawings') || isAmendment) && (
                  <div className="p-6 space-y-6">
                    <p className="text-sm text-muted-foreground">
                      Attach supporting documents including CAD drawings (.dxf/.dwg), technical specifications, CoG data, lashing point data, etc.
                      {isAmendment && <span className="text-destructive font-semibold"> SSR Approval Document is required for amendments.</span>}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 items-end">
                      <div className="flex-1 min-w-[200px]">
                        <Label htmlFor="doc_type">Document Type</Label>
                        <Select value={currentDocType} onValueChange={setCurrentDocType}>
                          <SelectTrigger id="doc_type">
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPES.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <Label htmlFor="doc_description">Description (Optional)</Label>
                        <Input
                          id="doc_description"
                          value={currentDescription}
                          onChange={(e) => setCurrentDescription(e.target.value)}
                          placeholder="Brief description of document"
                        />
                      </div>
                      <div>
                        <Label htmlFor="file_upload" className="cursor-pointer">
                          <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                            <Upload className="h-4 w-4" />
                            <span>Upload File</span>
                          </div>
                          <input
                            id="file_upload"
                            type="file"
                            onChange={handleFileSelect}
                            className="hidden"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.dxf,.dwg,.jpg,.jpeg,.png,.gif"
                          />
                        </Label>
                      </div>
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label className="font-semibold">Attached Documents ({uploadedFiles.length})</Label>
                        <div className="grid gap-2">
                          {uploadedFiles.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.documentType}{item.description && ` - ${item.description}`}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFile(index)}
                                className="flex-shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Declarations Section */}
              <section className="bg-card rounded-lg border-2 border-primary/30 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-primary/10 border-b border-primary/20">
                  <h3 className="text-lg font-bold text-foreground">Declarations *</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">All declarations must be confirmed before submission.</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/30">
                      <Checkbox
                        id="ssrApprovalAttached"
                        checked={declarations.ssrApprovalAttached}
                        onCheckedChange={(checked) => setDeclarations(prev => ({ ...prev, ssrApprovalAttached: checked as boolean }))}
                        className="mt-0.5"
                      />
                      <Label htmlFor="ssrApprovalAttached" className="cursor-pointer text-sm leading-relaxed">
                        I confirm that SSR (Safety Responsible) approval has been obtained and the approval document is attached to this submission.
                      </Label>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/30">
                      <Checkbox
                        id="dataAccuracyConfirmed"
                        checked={declarations.dataAccuracyConfirmed}
                        onCheckedChange={(checked) => setDeclarations(prev => ({ ...prev, dataAccuracyConfirmed: checked as boolean }))}
                        className="mt-0.5"
                      />
                      <Label htmlFor="dataAccuracyConfirmed" className="cursor-pointer text-sm leading-relaxed">
                        I confirm that all data provided in this form is accurate to the best of my knowledge and I take responsibility for the accuracy of the information submitted.
                      </Label>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/30">
                      <Checkbox
                        id="authorisedPerson"
                        checked={declarations.authorisedPerson}
                        onCheckedChange={(checked) => setDeclarations(prev => ({ ...prev, authorisedPerson: checked as boolean }))}
                        className="mt-0.5"
                      />
                      <Label htmlFor="authorisedPerson" className="cursor-pointer text-sm leading-relaxed">
                        I confirm that I am an authorised person to submit this request on behalf of the Project Team.
                      </Label>
                    </div>
                  </div>
                </div>
              </section>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading}
                  className="sm:w-auto"
                >
                  Reset Form
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !areDeclarationsComplete}
                  className="sm:w-auto min-w-[200px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Submit {REQUEST_TYPES.find(t => t.id === requestType)?.label}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
