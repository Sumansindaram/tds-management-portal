import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, ArrowLeft, Trash2, Search } from 'lucide-react';
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

export default function SSRDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useAuth();
  const [ssr, setSSR] = useState<SSR | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    nsn: '',
    asset_code: '',
    designation: '',
    asset_type: '',
    short_name: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('ssr_assets')
        .insert([{ ...formData, ssr_id: id }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Asset added successfully'
      });
      setShowDialog(false);
      setFormData({
        nsn: '',
        asset_code: '',
        designation: '',
        asset_type: '',
        short_name: '',
        status: 'active'
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 lg:p-8">
        <Button variant="default" onClick={() => navigate('/ssr-directory')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Directory
        </Button>

        <Card className="p-6 mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-6">SSR Contact Details</h1>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Delivery Team</p>
              <p className="font-semibold">{ssr.delivery_team}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">
                {ssr.title} {ssr.first_name} {ssr.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{ssr.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-semibold">{ssr.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role Type</p>
              <p className="font-semibold">{ssr.role_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span className={`px-2 py-1 rounded-full text-xs ${
                ssr.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {ssr.status}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">Assets Managed</h2>
          
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
                  <Button onClick={() => setShowDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                )}
              </div>

              {filteredAssets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'No assets match your search' : 'No assets assigned yet'}
                </p>
              ) : (
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NSN</TableHead>
                  <TableHead>Asset Code</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Short Name</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-mono">{asset.nsn}</TableCell>
                    <TableCell>{asset.asset_code}</TableCell>
                    <TableCell>{asset.designation}</TableCell>
                    <TableCell>{asset.asset_type}</TableCell>
                    <TableCell>{asset.short_name || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        asset.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {asset.status}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAsset(asset.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
                </Table>
              )}
            </TabsContent>

            {isAdmin && (
              <TabsContent value="bulk">
                <BulkAssetsUpload ssrId={id!} onSuccess={loadData} />
              </TabsContent>
            )}
          </Tabs>
        </Card>
      </main>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>NSN *</Label>
              <Input
                required
                value={formData.nsn}
                onChange={(e) => setFormData({ ...formData, nsn: e.target.value })}
                placeholder="e.g., 2320-99-123-4567"
              />
            </div>
            <div>
              <Label>Asset Code *</Label>
              <Input
                required
                value={formData.asset_code}
                onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
              />
            </div>
            <div>
              <Label>Designation *</Label>
              <Input
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>
            <div>
              <Label>Asset Type *</Label>
              <Select value={formData.asset_type} onValueChange={(value) => setFormData({ ...formData, asset_type: value })}>
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
                value={formData.short_name}
                onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Asset</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
