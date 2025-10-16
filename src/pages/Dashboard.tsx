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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Header />
      <main className="container mx-auto p-6">
        <div className="mb-10">
          <h1 className="mb-3 text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to TDS Portal
          </h1>
          <p className="text-lg text-muted-foreground">
            {isAdmin
              ? 'Manage TDS requests and review submissions'
              : 'Submit new TDS requests for asset tie-down schemes'}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {!isAdmin && (
            <>
              <Card className="cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-primary/20" onClick={() => navigate('/form')}>
                <CardHeader>
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                    <PlusCircle className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">New Request</CardTitle>
                  <CardDescription>Submit a new TDS entry request</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full shadow-md">Create Request</Button>
                </CardContent>
              </Card>

              <Card className="transition-all hover:shadow-xl hover:-translate-y-1 border-primary/20">
                <CardHeader>
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                    <List className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">My Submissions</CardTitle>
                  <CardDescription>Recent requests you've submitted</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMy ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : myEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No submissions yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {myEntries.map((e) => (
                        <div key={e.id} className="flex items-center justify-between rounded-lg border border-primary/10 bg-muted/30 p-3 transition-colors hover:bg-muted/50">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{e.reference}</p>
                            <p className="text-xs text-muted-foreground truncate">{e.short_name || e.nsn} • {new Date(e.created_at).toLocaleDateString()}</p>
                          </div>
                          <Button size="sm" variant="outline" className="ml-2 shrink-0" onClick={() => navigate(`/request/${e.id}`)}>
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
              <Card className="cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-primary/20" onClick={() => navigate('/admin')}>
                <CardHeader>
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                    <List className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">View All Requests</CardTitle>
                  <CardDescription>Review and manage all TDS submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full shadow-md">View Requests</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-primary/20" onClick={() => navigate('/form')}>
                <CardHeader>
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                    <FileText className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">Submit Request</CardTitle>
                  <CardDescription>Create a new TDS entry</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full shadow-md" variant="outline">New Entry</Button>
                </CardContent>
              </Card>

              {isSuperAdmin && (
                <Card className="cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-primary/20" onClick={() => navigate('/users')}>
                  <CardHeader>
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                      <Users className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">Manage Users</CardTitle>
                    <CardDescription>Control user roles and permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full shadow-md" variant="outline">Manage Users</Button>
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