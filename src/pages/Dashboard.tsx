import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { FileText, List, PlusCircle, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';

  const [myEntries, setMyEntries] = useState<any[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!isAdmin && user) {
        setLoadingMy(true);
        try {
          const { data } = await supabase
            .from('tds_entries')
            .select('id, reference, short_name, nsn, status, created_at')
            .eq('submitted_by', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
          setMyEntries(data || []);
        } finally {
          setLoadingMy(false);
        }
      }
    };
    run();
  }, [isAdmin, user]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-primary">Welcome to TDS Portal</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? 'Manage TDS requests and review submissions'
              : 'Submit new TDS requests for asset tie-down schemes'}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {!isAdmin && (
            <>
              <Card className="cursor-pointer transition-all hover:shadow-lg" onClick={() => navigate('/form')}>
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                    <PlusCircle className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle>New Request</CardTitle>
                  <CardDescription>Submit a new TDS entry request</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Create Request</Button>
                </CardContent>
              </Card>

              <Card className="transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                    <List className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle>My Submissions</CardTitle>
                  <CardDescription>Recent requests you've submitted</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMy ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : myEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No submissions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {myEntries.map((e) => (
                        <div key={e.id} className="flex items-center justify-between rounded-md border p-3">
                          <div>
                            <p className="font-medium">{e.reference}</p>
                            <p className="text-xs text-muted-foreground">{e.short_name || e.nsn} • {new Date(e.created_at).toLocaleDateString()}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/request/${e.id}`)}>
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {isAdmin && (
            <>
              <Card className="cursor-pointer transition-all hover:shadow-lg" onClick={() => navigate('/admin')}>
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                    <List className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle>View All Requests</CardTitle>
                  <CardDescription>Review and manage all TDS submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">View Requests</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer transition-all hover:shadow-lg" onClick={() => navigate('/form')}>
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                    <FileText className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle>Submit Request</CardTitle>
                  <CardDescription>Create a new TDS entry</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">New Entry</Button>
                </CardContent>
              </Card>

              {isSuperAdmin && (
                <Card className="cursor-pointer transition-all hover:shadow-lg" onClick={() => navigate('/users')}>
                  <CardHeader>
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                      <Users className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle>Manage Users</CardTitle>
                    <CardDescription>Control user roles and permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">Manage Users</Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}