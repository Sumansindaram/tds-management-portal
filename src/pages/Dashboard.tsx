import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { FileText, List, PlusCircle, Users, Search, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import heroBanner from '@/assets/tds-hero-banner.jpg';
import iconNewRequest from '@/assets/icon-new-request.jpg';
import iconMySubmissions from '@/assets/icon-my-submissions.jpg';
import iconViewRequests from '@/assets/icon-view-requests.jpg';
import iconManageUsers from '@/assets/icon-manage-users.jpg';
import iconTdsTool from '@/assets/icon-tds-tool.jpg';

export default function Dashboard() {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';

  const [myEntries, setMyEntries] = useState<any[]>([]);
  const [loadingMy, setLoadingMy] = useState(true);
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
        setLoadingMy(true);
        try {
          const { count } = await supabase
            .from('tds_entries')
            .select('*', { count: 'exact', head: true });
          setTotalEntries(count || 0);
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

      <main className="container mx-auto p-6 lg:p-8 mt-2">

        {/* Regular User View */}
        {!isAdmin && (
          <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {loadingMy ? (
              <>
                <Card className="border-primary/30 bg-card overflow-hidden">
                  <div className="relative h-32 overflow-hidden">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <CardHeader className="pb-3 relative">
                    <Skeleton className="h-20 w-20 rounded-2xl -mt-16 mb-4" />
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
                <Card className="border-primary/30 bg-card overflow-hidden">
                  <div className="relative h-32 overflow-hidden">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <CardHeader className="pb-3 relative">
                    <Skeleton className="h-20 w-20 rounded-2xl -mt-16 mb-4" />
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
                <Card className="border-primary/30 bg-card overflow-hidden">
                  <div className="relative h-32 overflow-hidden">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <CardHeader className="pb-3 relative">
                    <Skeleton className="h-20 w-20 rounded-2xl -mt-16 mb-4" />
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Submit Request */}
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
                      <PlusCircle className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl text-card-foreground">Submit Request</CardTitle>
                    <CardDescription>Create a new TDS entry request</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90">Create Request</Button>
                  </CardContent>
                </Card>

                {/* My Submissions */}
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

                {/* TDS Tool */}
                <Card 
                  className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-card group overflow-hidden" 
                  onClick={() => navigate('/tds-tool')}
                >
                  <div className="relative h-32 overflow-hidden">
                    <img 
                      src={iconTdsTool} 
                      alt="TDS Tool" 
                      className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                  </div>
                  <CardHeader className="pb-3 relative">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg group-hover:scale-110 transition-transform -mt-16 border-4 border-card">
                      <Wrench className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl text-card-foreground">TDS Tool</CardTitle>
                    <CardDescription>Transportation planning calculations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90">Open Tool</Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Admin and Super Admin View */}
        {isAdmin && (
          <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
            {loadingMy ? (
              <>
                <Card className="border-primary/30 bg-card overflow-hidden">
                  <div className="relative h-32 overflow-hidden">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <CardHeader className="pb-3 relative">
                    <Skeleton className="h-20 w-20 rounded-2xl -mt-16 mb-4" />
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
                <Card className="border-primary/30 bg-card overflow-hidden">
                  <div className="relative h-32 overflow-hidden">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <CardHeader className="pb-3 relative">
                    <Skeleton className="h-20 w-20 rounded-2xl -mt-16 mb-4" />
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
                <Card className="border-primary/30 bg-card overflow-hidden">
                  <div className="relative h-32 overflow-hidden">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <CardHeader className="pb-3 relative">
                    <Skeleton className="h-20 w-20 rounded-2xl -mt-16 mb-4" />
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
                <Card className="border-primary/30 bg-card overflow-hidden">
                  <div className="relative h-32 overflow-hidden">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <CardHeader className="pb-3 relative">
                    <Skeleton className="h-20 w-20 rounded-2xl -mt-16 mb-4" />
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* View All Requests */}
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
                    <CardDescription>Review all TDS submissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90">View Requests</Button>
                  </CardContent>
                </Card>

                {/* Submit Request */}
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
                      <PlusCircle className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl text-card-foreground">Submit Request</CardTitle>
                    <CardDescription>Create a new TDS entry request</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90">Create Request</Button>
                  </CardContent>
                </Card>

                {/* SSR Directory */}
                <Card 
                  className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-card group overflow-hidden" 
                  onClick={() => navigate('/ssr-directory')}
                >
                  <div className="relative h-32 overflow-hidden">
                    <img 
                      src={iconManageUsers} 
                      alt="SSR Directory" 
                      className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                  </div>
                  <CardHeader className="pb-3 relative">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg group-hover:scale-110 transition-transform -mt-16 border-4 border-card">
                      <Users className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl text-card-foreground">SSR Directory</CardTitle>
                    <CardDescription>Safety leadership contacts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90">View Directory</Button>
                  </CardContent>
                </Card>

                {/* TDS Tool */}
                <Card 
                  className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 bg-card group overflow-hidden" 
                  onClick={() => navigate('/tds-tool')}
                >
                  <div className="relative h-32 overflow-hidden">
                    <img 
                      src={iconTdsTool} 
                      alt="TDS Tool" 
                      className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                  </div>
                  <CardHeader className="pb-3 relative">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg group-hover:scale-110 transition-transform -mt-16 border-4 border-card">
                      <Wrench className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl text-card-foreground">TDS Tool</CardTitle>
                    <CardDescription>Transportation planning calculations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90">Open Tool</Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
