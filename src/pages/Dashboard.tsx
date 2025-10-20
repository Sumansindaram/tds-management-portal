import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { FileText, List, PlusCircle, Users, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';

  const [myEntries, setMyEntries] = useState<any[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);

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
      } else if (isAdmin) {
        const { count } = await supabase
          .from('tds_entries')
          .select('*', { count: 'exact', head: true });
        setTotalEntries(count || 0);
      }
    };
    run();
  }, [isAdmin, user]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 lg:p-8">
        <div className="mb-10">
          <h1 className="mb-3 text-4xl font-bold text-foreground">
            {isAdmin ? 'TDS Admin Dashboard' : 'TDS Management Portal'}
          </h1>
          <p className="text-lg text-foreground/80">
            {isAdmin
              ? 'Manage and review Tie Down Scheme submissions'
              : 'Submit and track your Tie Down Scheme requests'}
          </p>
        </div>

        {!isAdmin && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* User Tiles */}
            <Card 
              className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-gradient-to-br from-card to-primary/5 group" 
              onClick={() => navigate('/form')}
            >
              <CardHeader className="pb-3 bg-primary/5 rounded-t-lg">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg group-hover:scale-110 transition-transform">
                  <PlusCircle className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl text-primary">New Request</CardTitle>
                <CardDescription>Submit a new TDS entry request</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full shadow-md">Create Request</Button>
              </CardContent>
            </Card>

            <Card 
              className="transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-gradient-to-br from-card to-accent/5 col-span-full md:col-span-2 lg:col-span-3"
            >
              <CardHeader className="pb-3 bg-accent/5 rounded-t-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent shadow-lg">
                    <List className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-primary">My Submissions</CardTitle>
                    <CardDescription>View and track your recent TDS requests</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingMy ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : myEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No submissions yet.</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/form')}>
                      Create Your First Request
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {myEntries.map((e) => (
                      <div 
                        key={e.id} 
                        className="flex flex-col rounded-xl border-2 border-primary/20 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-lg cursor-pointer"
                        onClick={() => navigate(`/request/${e.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-bold text-primary">{e.reference}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            e.status === 'Approved' ? 'bg-success/20 text-success' :
                            e.status === 'Pending' ? 'bg-warning/20 text-warning' :
                            e.status === 'Rejected' ? 'bg-destructive/20 text-destructive' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {e.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-1">{e.short_name || e.nsn}</p>
                        <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {isAdmin && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Admin Tiles */}
            <Card 
              className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-gradient-to-br from-card to-primary/5 group col-span-full md:col-span-2" 
              onClick={() => navigate('/admin')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg group-hover:scale-110 transition-transform">
                    <Search className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-primary">View All Requests</CardTitle>
                    <CardDescription className="text-base">Search and review all TDS submissions</CardDescription>
                    {totalEntries > 0 && (
                      <p className="text-sm font-semibold text-primary mt-1">{totalEntries} Total Entries</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full shadow-md" size="lg">View All Requests</Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-gradient-to-br from-card to-secondary/5 group" 
              onClick={() => navigate('/form')}
            >
              <CardHeader className="pb-3">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary shadow-lg group-hover:scale-110 transition-transform">
                  <FileText className="h-8 w-8 text-secondary-foreground" />
                </div>
                <CardTitle className="text-xl text-primary">Submit Request</CardTitle>
                <CardDescription>Create a new TDS entry</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full shadow-md bg-secondary text-secondary-foreground hover:bg-secondary/90">New Entry</Button>
              </CardContent>
            </Card>

            {isSuperAdmin && (
              <Card 
                className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-gradient-to-br from-card to-success/5 group" 
                onClick={() => navigate('/users')}
              >
                <CardHeader className="pb-3">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8 text-success-foreground" />
                  </div>
                  <CardTitle className="text-xl text-primary">Manage Users</CardTitle>
                  <CardDescription>Control user roles and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full shadow-md bg-success text-success-foreground hover:bg-success/90">Manage Users</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
