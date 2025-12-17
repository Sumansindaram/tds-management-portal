import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, FileText, Clock, AlertCircle } from 'lucide-react';

interface NewAssetRequest {
  id: string;
  reference: string;
  task_title: string;
  asset_name: string;
  asset_type: string;
  project_team: string;
  status: string;
  urgency_level: string;
  created_at: string;
  required_by_date: string | null;
}

export default function NewAssetRequestsList() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<NewAssetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = role === 'admin' || role === 'super_admin';

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('new_asset_requests')
        .select('id, reference, task_title, asset_name, asset_type, project_team, status, urgency_level, created_at, required_by_date')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Urgent': return 'bg-red-500/20 text-red-700 dark:text-red-300';
      case 'High': return 'bg-orange-500/20 text-orange-700 dark:text-orange-300';
      case 'Normal': return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'Low': return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredRequests = requests.filter(req =>
    req.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.task_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.project_team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <h1 className="text-2xl font-bold">New TDS Requests</h1>
          </div>
          <Button onClick={() => navigate('/new-asset-request/create')} className="gap-2">
            <Plus className="h-4 w-4" /> New Request
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by reference, title, asset name, or project team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Requests Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No requests match your search criteria.' : 'You haven\'t submitted any new asset requests yet.'}
              </p>
              <Button onClick={() => navigate('/new-asset-request/create')}>
                <Plus className="h-4 w-4 mr-2" /> Create New Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(request => (
              <Card 
                key={request.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow border-l-4"
                style={{
                  borderLeftColor: request.urgency_level === 'Urgent' ? 'hsl(var(--destructive))' : 
                                   request.urgency_level === 'High' ? 'hsl(25, 95%, 53%)' : 
                                   'hsl(var(--primary))'
                }}
                onClick={() => navigate(`/new-asset-request/${request.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-primary">{request.reference}</span>
                        <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                        <Badge variant="outline" className={getUrgencyColor(request.urgency_level)}>
                          {request.urgency_level}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{request.task_title}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span><strong>Asset:</strong> {request.asset_name}</span>
                        <span><strong>Type:</strong> {request.asset_type}</span>
                        <span><strong>Team:</strong> {request.project_team}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                        {request.required_by_date && (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Required by: {new Date(request.required_by_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
