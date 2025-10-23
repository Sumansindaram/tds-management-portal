import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { FileText, List, PlusCircle, Users, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import heroBanner from '@/assets/tds-hero-banner.jpg';
import iconNewRequest from '@/assets/icon-new-request.jpg';
import iconMySubmissions from '@/assets/icon-my-submissions.jpg';
import iconViewRequests from '@/assets/icon-view-requests.jpg';
import iconManageUsers from '@/assets/icon-manage-users.jpg';

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
      
      {/* Hero Banner */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        <img 
          src={heroBanner} 
          alt="Military Transportation Equipment" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40 flex items-center">
          <div className="container mx-auto px-6 lg:px-8">
            <h2 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg">
              {isAdmin ? 'TDS Admin Dashboard' : 'TDS Management Portal'}
            </h2>
            <p className="text-sm sm:text-lg text-white/90 mt-2 drop-shadow">
              {isAdmin
                ? 'Manage and review Tie Down Scheme submissions'
                : 'Submit and track your Tie Down Scheme requests'}
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto p-6 lg:p-8 mt-8">

        {!isAdmin && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* User Tiles - Equal Size */}
            <Card 
              className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-card group overflow-hidden" 
              onClick={() => navigate('/form')}
            >
              <div className="relative h-32 overflow-hidden">
                <img 
                  src={iconNewRequest} 
                  alt="New Request" 
                  className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
              </div>
              <CardHeader className="pb-3 relative">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg group-hover:scale-110 transition-transform -mt-16 border-4 border-card">
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
              className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-card group overflow-hidden"
              onClick={() => navigate('/my-submissions')}
            >
              <div className="relative h-32 overflow-hidden">
                <img 
                  src={iconMySubmissions} 
                  alt="My Submissions" 
                  className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
              </div>
              <CardHeader className="pb-3 relative">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg group-hover:scale-110 transition-transform -mt-16 border-4 border-card">
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
              className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-card group overflow-hidden" 
              onClick={() => navigate('/admin')}
            >
              <div className="relative h-32 overflow-hidden">
                <img 
                  src={iconViewRequests} 
                  alt="View All Requests" 
                  className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
              </div>
              <CardHeader className="pb-3 relative">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg group-hover:scale-110 transition-transform -mt-16 border-4 border-card">
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
              className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-card group overflow-hidden" 
              onClick={() => navigate('/form')}
            >
              <div className="relative h-32 overflow-hidden">
                <img 
                  src={iconNewRequest} 
                  alt="Submit Request" 
                  className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
              </div>
              <CardHeader className="pb-3 relative">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg group-hover:scale-110 transition-transform -mt-16 border-4 border-card">
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
                className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-card group overflow-hidden" 
                onClick={() => navigate('/users')}
              >
                <div className="relative h-32 overflow-hidden">
                  <img 
                    src={iconManageUsers} 
                    alt="Manage Users" 
                    className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                </div>
                <CardHeader className="pb-3 relative">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg group-hover:scale-110 transition-transform -mt-16 border-4 border-card">
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
