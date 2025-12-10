import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, ArrowLeft, Trash2, Search, Pencil, History, User, Mail, Phone, Building2, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import BulkAssetsUpload from '@/components/BulkAssetsUpload';

interface SSR {
  id: string;
  delivery_team: string;
  title: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_type: string;
  status: string;
}

interface Asset {
  id: string;
  nsn: string;
  asset_code: string;
  designation: string;
  asset_type: string;
  short_name: string;
  status: string;
}

interface SSRChangeHistory {
  id: string;
  previous_title: string;
  previous_first_name: string;
  previous_last_name: string;
  previous_email: string;
  previous_phone: string;
  previous_role_type: string;
  replaced_by_first_name: string;
  replaced_by_last_name: string;
  reason: string;
  changed_at: string;
}

export default function SSRDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, user } = useAuth();
  const [ssr, setSSR] = useState<SSR | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [changeHistory, setChangeHistory] = useState<SSRChangeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [showEditAssetDialog, setShowEditAssetDialog] = useState(false);
  const [showEditSSRDialog, setShowEditSSRDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isReplacement, setIsReplacement] = useState(false);
  const [replacementReason, setReplacementReason] = useState('');
  
  const [assetFormData, setAssetFormData] = useState({
    nsn: '',
    asset_code: '',
    designation: '',
    asset_type: '',
    short_name: '',
    status: 'active'
  });

  const [ssrFormData, setSSRFormData] = useState({
    delivery_team: '',
    title: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role_type: '',
    status: 'active'
  });

  const isAdmin = role === 'admin' || role === 'super_admin';

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = assets.filter(asset =>
        asset.nsn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.asset_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAssets(filtered);
    } else {
      setFilteredAssets(assets);
    }
  }, [searchQuery, assets]);

  const loadData = async () => {
    try {
      const { data: ssrData, error: ssrError } = await supabase
        .from('ssrs')
        .select('*')
        .eq('id', id)
        .single();

      if (ssrError) throw ssrError;
      setSSR(ssrData);

      const { data: assetsData, error: assetsError } = await supabase
        .from('ssr_assets')
        .select('*')
        .eq('ssr_id', id)
        .order('created_at', { ascending: false });

      if (assetsError) throw assetsError;
      setAssets(assetsData || []);
      setFilteredAssets(assetsData || []);

      // Load change history
      const { data: historyData } = await supabase
        .from('ssr_change_history')
        .select('*')
        .eq('ssr_record_id', id)
        .order('changed_at', { ascending: false });

      setChangeHistory(historyData || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('ssr_assets')
        .insert([{ ...assetFormData, ssr_id: id }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Asset added successfully'
      });
      setShowAssetDialog(false);
      resetAssetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleEditAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    
    try {
      const { error } = await supabase
        .from('ssr_assets')
        .update(assetFormData)
        .eq('id', editingAsset.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Asset updated successfully'
      });
      setShowEditAssetDialog(false);
      setEditingAsset(null);
      resetAssetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleEditSSR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssr) return;

    try {
      // Check if this is a replacement (different person)
      const isPersonReplaced = 
        ssr.first_name !== ssrFormData.first_name ||
        ssr.last_name !== ssrFormData.last_name ||
        ssr.email !== ssrFormData.email;

      if (isPersonReplaced && isReplacement) {
        // Log the change history
        const { error: historyError } = await supabase
          .from('ssr_change_history')
          .insert([{
            ssr_record_id: ssr.id,
            previous_title: ssr.title,
            previous_first_name: ssr.first_name,
            previous_last_name: ssr.last_name,
            previous_email: ssr.email,
            previous_phone: ssr.phone,
            previous_role_type: ssr.role_type,
            replaced_by_title: ssrFormData.title,
            replaced_by_first_name: ssrFormData.first_name,
            replaced_by_last_name: ssrFormData.last_name,
            replaced_by_email: ssrFormData.email,
            replaced_by_user_id: user?.id,
            reason: replacementReason || 'SSR replacement'
          }]);

        if (historyError) throw historyError;
      }

      const { error } = await supabase
        .from('ssrs')
        .update(ssrFormData)
        .eq('id', ssr.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: isReplacement ? 'SSR replaced successfully. History logged.' : 'SSR updated successfully'
      });
      setShowEditSSRDialog(false);
      setIsReplacement(false);
      setReplacementReason('');
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const { error } = await supabase
        .from('ssr_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Asset deleted successfully'
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const resetAssetForm = () => {
    setAssetFormData({
      nsn: '',
      asset_code: '',
      designation: '',
      asset_type: '',
      short_name: '',
      status: 'active'
    });
  };

  const openEditAssetDialog = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetFormData({
      nsn: asset.nsn,
      asset_code: asset.asset_code,
      designation: asset.designation,
      asset_type: asset.asset_type,
      short_name: asset.short_name || '',
      status: asset.status
    });
    setShowEditAssetDialog(true);
  };

  const openEditSSRDialog = () => {
    if (ssr) {
      setSSRFormData({
        delivery_team: ssr.delivery_team,
        title: ssr.title || '',
        first_name: ssr.first_name,
        last_name: ssr.last_name,
        email: ssr.email,
        phone: ssr.phone || '',
        role_type: ssr.role_type,
        status: ssr.status
      });
      setShowEditSSRDialog(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!ssr) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6 lg:p-8">
          <Card className="p-6">
            <p className="text-center">SSR not found</p>
            <Button onClick={() => navigate('/ssr-directory')} className="mt-4">
              Back to Directory
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="container mx-auto p-6 lg:p-8">
        <Button variant="default" onClick={() => navigate('/ssr-directory')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Directory
        </Button>

        {/* SSR Contact Details Card - Professional Design */}
        <Card className="p-0 mb-6 overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-r from-ribbon via-ribbon/90 to-ribbon/80 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">SSR Contact Details</h1>
                <p className="text-white/70 text-sm">Safety Leadership Directory Record</p>
              </div>
              <div className="flex gap-2">
                {changeHistory.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowHistoryDialog(true)}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <History className="h-4 w-4 mr-2" />
                    History ({changeHistory.length})
                  </Button>
                )}
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={openEditSSRDialog}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit SSR
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-ribbon/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-ribbon" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Delivery Team</p>
                  <p className="font-semibold text-foreground mt-0.5">{ssr.delivery_team}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-ribbon/10 rounded-lg">
                  <User className="h-5 w-5 text-ribbon" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Name</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {ssr.title} {ssr.first_name} {ssr.last_name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-ribbon/10 rounded-lg">
                  <Mail className="h-5 w-5 text-ribbon" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Email</p>
                  <p className="font-semibold text-foreground mt-0.5">{ssr.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-ribbon/10 rounded-lg">
                  <Phone className="h-5 w-5 text-ribbon" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Phone</p>
                  <p className="font-semibold text-foreground mt-0.5">{ssr.phone || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-ribbon/10 rounded-lg">
                  <Shield className="h-5 w-5 text-ribbon" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Role Type</p>
                  <p className="font-semibold text-foreground mt-0.5">{ssr.role_type}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-ribbon/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-ribbon" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-0.5 ${
                    ssr.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {ssr.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Assets Managed Card - Professional Design */}
        <Card className="p-0 overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-r from-secondary via-secondary/95 to-secondary/90 p-6 border-b border-border/50">
            <h2 className="text-xl font-bold text-foreground">Assets Managed</h2>
            <p className="text-muted-foreground text-sm mt-1">Equipment and vehicles assigned to this SSR</p>
          </div>
          
          <div className="p-6 bg-card">
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="list">Asset List</TabsTrigger>
                {isAdmin && <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>}
              </TabsList>

              <TabsContent value="list">
                <div className="flex justify-between items-center mb-4 gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by NSN, designation, or type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {isAdmin && (
                    <Button onClick={() => setShowAssetDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Asset
                    </Button>
                  )}
                </div>

                {filteredAssets.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No assets match your search' : 'No assets assigned yet'}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>NSN</TableHead>
                          <TableHead>Asset Code</TableHead>
                          <TableHead>Designation</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Short Name</TableHead>
                          <TableHead>Status</TableHead>
                          {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAssets.map((asset) => (
                          <TableRow key={asset.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-sm">{asset.nsn}</TableCell>
                            <TableCell className="font-medium">{asset.asset_code}</TableCell>
                            <TableCell className="max-w-xs truncate">{asset.designation}</TableCell>
                            <TableCell>{asset.asset_type}</TableCell>
                            <TableCell>{asset.short_name || 'N/A'}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                asset.status === 'active' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                              }`}>
                                {asset.status}
                              </span>
                            </TableCell>
                            {isAdmin && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditAssetDialog(asset)}
                                  >
                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteAsset(asset.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {isAdmin && (
                <TabsContent value="bulk">
                  <BulkAssetsUpload ssrId={id!} onSuccess={loadData} />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </Card>
      </main>

      {/* Add Asset Dialog */}
      <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAsset} className="space-y-4">
            <div>
              <Label>NSN *</Label>
              <Input
                required
                value={assetFormData.nsn}
                onChange={(e) => setAssetFormData({ ...assetFormData, nsn: e.target.value })}
                placeholder="e.g., 2320-99-123-4567"
              />
            </div>
            <div>
              <Label>Asset Code *</Label>
              <Input
                required
                value={assetFormData.asset_code}
                onChange={(e) => setAssetFormData({ ...assetFormData, asset_code: e.target.value })}
              />
            </div>
            <div>
              <Label>Designation *</Label>
              <Input
                required
                value={assetFormData.designation}
                onChange={(e) => setAssetFormData({ ...assetFormData, designation: e.target.value })}
              />
            </div>
            <div>
              <Label>Asset Type *</Label>
              <Select value={assetFormData.asset_type} onValueChange={(value) => setAssetFormData({ ...assetFormData, asset_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A Vehicles">A Vehicles</SelectItem>
                  <SelectItem value="B Vehicles">B Vehicles</SelectItem>
                  <SelectItem value="C Vehicles">C Vehicles</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Short Name</Label>
              <Input
                value={assetFormData.short_name}
                onChange={(e) => setAssetFormData({ ...assetFormData, short_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={assetFormData.status} onValueChange={(value) => setAssetFormData({ ...assetFormData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAssetDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Asset</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog open={showEditAssetDialog} onOpenChange={setShowEditAssetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditAsset} className="space-y-4">
            <div>
              <Label>NSN *</Label>
              <Input
                required
                value={assetFormData.nsn}
                onChange={(e) => setAssetFormData({ ...assetFormData, nsn: e.target.value })}
              />
            </div>
            <div>
              <Label>Asset Code *</Label>
              <Input
                required
                value={assetFormData.asset_code}
                onChange={(e) => setAssetFormData({ ...assetFormData, asset_code: e.target.value })}
              />
            </div>
            <div>
              <Label>Designation *</Label>
              <Input
                required
                value={assetFormData.designation}
                onChange={(e) => setAssetFormData({ ...assetFormData, designation: e.target.value })}
              />
            </div>
            <div>
              <Label>Asset Type *</Label>
              <Select value={assetFormData.asset_type} onValueChange={(value) => setAssetFormData({ ...assetFormData, asset_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A Vehicles">A Vehicles</SelectItem>
                  <SelectItem value="B Vehicles">B Vehicles</SelectItem>
                  <SelectItem value="C Vehicles">C Vehicles</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Short Name</Label>
              <Input
                value={assetFormData.short_name}
                onChange={(e) => setAssetFormData({ ...assetFormData, short_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={assetFormData.status} onValueChange={(value) => setAssetFormData({ ...assetFormData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEditAssetDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit SSR Dialog */}
      <Dialog open={showEditSSRDialog} onOpenChange={setShowEditSSRDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit SSR Contact</DialogTitle>
            <DialogDescription>
              Update SSR details. If replacing with a new person, enable "SSR Replacement" to log the change.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSSR} className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="isReplacement"
                  checked={isReplacement}
                  onChange={(e) => setIsReplacement(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isReplacement" className="font-medium cursor-pointer">
                  This is an SSR Replacement (new person taking over)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Enable this if a new person is replacing the current SSR. The previous SSR's details will be logged in history.
              </p>
              {isReplacement && (
                <div className="mt-3">
                  <Label>Reason for replacement</Label>
                  <Textarea
                    placeholder="e.g., Previous SSR has left the team, role transfer, etc."
                    value={replacementReason}
                    onChange={(e) => setReplacementReason(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Delivery Team *</Label>
                <Input
                  required
                  value={ssrFormData.delivery_team}
                  onChange={(e) => setSSRFormData({ ...ssrFormData, delivery_team: e.target.value })}
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={ssrFormData.title}
                  onChange={(e) => setSSRFormData({ ...ssrFormData, title: e.target.value })}
                />
              </div>
              <div>
                <Label>First Name *</Label>
                <Input
                  required
                  value={ssrFormData.first_name}
                  onChange={(e) => setSSRFormData({ ...ssrFormData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  required
                  value={ssrFormData.last_name}
                  onChange={(e) => setSSRFormData({ ...ssrFormData, last_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  required
                  value={ssrFormData.email}
                  onChange={(e) => setSSRFormData({ ...ssrFormData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={ssrFormData.phone}
                  onChange={(e) => setSSRFormData({ ...ssrFormData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Role Type *</Label>
                <Input
                  required
                  value={ssrFormData.role_type}
                  onChange={(e) => setSSRFormData({ ...ssrFormData, role_type: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={ssrFormData.status} onValueChange={(value) => setSSRFormData({ ...ssrFormData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEditSSRDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isReplacement ? 'Replace SSR' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>SSR Change History</DialogTitle>
            <DialogDescription>
              Record of previous SSRs who held this position
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {changeHistory.map((entry) => (
              <div key={entry.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-foreground">
                    {entry.previous_title} {entry.previous_first_name} {entry.previous_last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.changed_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{entry.previous_email}</p>
                <p className="text-sm text-muted-foreground">Role: {entry.previous_role_type}</p>
                {entry.reason && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="font-medium">Reason:</span> {entry.reason}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Replaced by: {entry.replaced_by_first_name} {entry.replaced_by_last_name}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}