import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Loader2, Plus, Search, Eye, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import BulkSSRUpload from '@/components/BulkSSRUpload';

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

export default function SSRDirectory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useAuth();
  const [ssrs, setSSRs] = useState<SSR[]>([]);
  const [filteredSSRs, setFilteredSSRs] = useState<SSR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
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
    loadSSRs();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = ssrs.filter(ssr =>
        ssr.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ssr.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ssr.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ssr.delivery_team.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSSRs(filtered);
    } else {
      setFilteredSSRs(ssrs);
    }
  }, [searchQuery, ssrs]);

  const loadSSRs = async () => {
    try {
      const { data, error } = await supabase
        .from('ssrs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSSRs(data || []);
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
        .from('ssrs')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'SSR contact created successfully'
      });
      setShowDialog(false);
      setFormData({
        delivery_team: '',
        title: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role_type: '',
        status: 'active'
      });
      loadSSRs();
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 lg:p-8">
        <Card className="p-6">
          <h1 className="text-3xl font-bold text-primary mb-6">Safety Leadership Directory</h1>
          
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="list">SSR List</TabsTrigger>
              {isAdmin && <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>}
            </TabsList>

            <TabsContent value="list">
              <div className="flex justify-between items-center mb-6">
                <div className="flex-1" />
                {isAdmin && (
                  <Button onClick={() => setShowDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New SSR
                  </Button>
                )}
              </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, email, or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Delivery Team</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSSRs.map((ssr) => (
                <TableRow key={ssr.id}>
                  <TableCell>{ssr.delivery_team}</TableCell>
                  <TableCell>
                    {ssr.title} {ssr.first_name} {ssr.last_name}
                  </TableCell>
                  <TableCell>{ssr.email}</TableCell>
                  <TableCell>{ssr.phone || 'N/A'}</TableCell>
                  <TableCell>{ssr.role_type}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      ssr.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ssr.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/ssr/${ssr.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

              <div className="mt-6">
                <Button variant="default" onClick={() => navigate('/')}>
                  Back to Dashboard
                </Button>
              </div>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="bulk">
                <BulkSSRUpload onSuccess={loadSSRs} />
                <div className="mt-4">
                  <Button variant="default" onClick={() => navigate('/')}>
                    Back to Dashboard
                  </Button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </Card>
      </main>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New SSR Contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Delivery Team *</Label>
                <Input
                  required
                  value={formData.delivery_team}
                  onChange={(e) => setFormData({ ...formData, delivery_team: e.target.value })}
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label>First Name *</Label>
                <Input
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Role Type *</Label>
                <Input
                  required
                  value={formData.role_type}
                  onChange={(e) => setFormData({ ...formData, role_type: e.target.value })}
                  placeholder="e.g., Safety Officer"
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
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Create SSR</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
