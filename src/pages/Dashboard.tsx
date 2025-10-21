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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* User Tiles - Equal Size */}
            <Card 
              className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-gradient-to-br from-card to-primary/5 group" 
              onClick={() => navigate('/form')}
            >
              <CardHeader className="pb-3 bg-primary/5 rounded-t-lg">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg group-hover:scale-110 transition-transform">
                  <PlusCircle className="h-10 w-10 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl text-card-foreground">New Request</CardTitle>
                <CardDescription>Submit a new TDS entry request</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90">Create Request</Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-gradient-to-br from-card to-primary/5 group"
              onClick={() => navigate('/my-submissions')}
            >
              <CardHeader className="pb-3 bg-primary/5 rounded-t-lg">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg group-hover:scale-110 transition-transform">
                  <List className="h-10 w-10 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl text-card-foreground">My Submissions</CardTitle>
                <CardDescription>View and track your TDS requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90">
                  View Submissions ({myEntries.length})
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {isAdmin && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Admin Tiles - All Equal Size */}
            <Card 
              className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-gradient-to-br from-card to-primary/5 group" 
              onClick={() => navigate('/admin')}
            >
              <CardHeader className="pb-3">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg group-hover:scale-110 transition-transform">
                  <Search className="h-10 w-10 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl text-card-foreground">View All Requests</CardTitle>
                <CardDescription>Search and review all TDS submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90">View All Requests</Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-gradient-to-br from-card to-primary/5 group" 
              onClick={() => navigate('/form')}
            >
              <CardHeader className="pb-3">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg group-hover:scale-110 transition-transform">
                  <FileText className="h-10 w-10 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl text-card-foreground">Submit Request</CardTitle>
                <CardDescription>Create a new TDS entry</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90">New Entry</Button>
              </CardContent>
            </Card>

            {isSuperAdmin && (
              <Card 
                className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-gradient-to-br from-card to-primary/5 group" 
                onClick={() => navigate('/users')}
              >
                <CardHeader className="pb-3">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl text-card-foreground">Manage Users</CardTitle>
                  <CardDescription>Control user roles and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90">Manage Users</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
