import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { FileText, List, PlusCircle, Users, Search, Wrench, FilePlus2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import heroBanner from '@/assets/tds-hero-banner.jpg';
import iconNewRequest from '@/assets/icon-create-request.jpg';
import iconMySubmissions from '@/assets/icon-my-submissions-new.jpg';
import iconViewRequests from '@/assets/icon-view-all-requests.jpg';
import iconManageUsers from '@/assets/icon-ssr-directory-new.jpg';
import iconTdsTool from '@/assets/icon-tds-tool.jpg';
import iconNewAssetRequest from '@/assets/icon-new-asset-request.jpg';

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
                  className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 group overflow-hidden relative h-80" 
                  onClick={() => navigate('/form')}
                >
                  <img 
                    src={iconNewRequest} 
                    alt="Submit Request" 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/70 to-primary/40" />
                  
                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform border-2 border-white/40">
                      <PlusCircle className="h-10 w-10 text-white" />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-white mb-2">Submit Request</h3>
                        <p className="text-white/90 text-sm">Create a new TDS entry request</p>
                      </div>
                      <Button className="w-full shadow-lg bg-white text-ribbon hover:bg-white/90 font-semibold border-2 border-white">Create Request</Button>
                    </div>
                  </div>
                </Card>

                {/* My Submissions */}
                <Card 
                  className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 group overflow-hidden relative h-80"
                  onClick={() => navigate('/my-submissions')}
                >
                  <img 
                    src={iconMySubmissions} 
                    alt="My Submissions" 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/70 to-primary/40" />
                  
                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform border-2 border-white/40">
                      <List className="h-10 w-10 text-white" />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-white mb-2">My Submissions</h3>
                        <p className="text-white/90 text-sm">View and track your TDS requests</p>
                      </div>
                      <Button className="w-full shadow-lg bg-white text-ribbon hover:bg-white/90 font-semibold border-2 border-white">
                        View Submissions ({myEntries.length})
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* TDS Tool */}
                <Card 
                  className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 group overflow-hidden relative h-80" 
                  onClick={() => navigate('/tds-tool')}
                >
                  <img 
                    src={iconTdsTool} 
                    alt="TDS Tool" 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/70 to-primary/40" />
                  
                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform border-2 border-white/40">
                      <Wrench className="h-10 w-10 text-white" />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-white mb-2">TDS Tool</h3>
                        <p className="text-white/90 text-sm">Transportation planning calculations</p>
                      </div>
                      <Button className="w-full shadow-lg bg-white text-ribbon hover:bg-white/90 font-semibold border-2 border-white">Open Tool</Button>
                    </div>
                  </div>
                </Card>

                {/* New Asset Request */}
                <Card 
                  className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 group overflow-hidden relative h-80" 
                  onClick={() => navigate('/new-asset-requests')}
                >
                  <img 
                    src={iconNewAssetRequest} 
                    alt="New Asset Request" 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/70 to-primary/40" />
                  
                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform border-2 border-white/40">
                      <FilePlus2 className="h-10 w-10 text-white" />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-white mb-2">New Asset Request</h3>
                        <p className="text-white/90 text-sm">Request TDS for new assets</p>
                      </div>
                      <Button className="w-full shadow-lg bg-white text-ribbon hover:bg-white/90 font-semibold border-2 border-white">View Requests</Button>
                    </div>
                  </div>
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
                  className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 group overflow-hidden relative h-80" 
                  onClick={() => navigate('/admin')}
                >
                  <img 
                    src={iconViewRequests} 
                    alt="View All Requests" 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/70 to-primary/40" />
                  
                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform border-2 border-white/40">
                      <Search className="h-10 w-10 text-white" />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-white mb-2">View All Requests</h3>
                        <p className="text-white/90 text-sm">Review all TDS submissions</p>
                      </div>
                      <Button className="w-full shadow-lg bg-white text-ribbon hover:bg-white/90 font-semibold border-2 border-white">View Requests</Button>
                    </div>
                  </div>
                </Card>

                {/* Submit Request */}
                <Card 
                  className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 group overflow-hidden relative h-80" 
                  onClick={() => navigate('/form')}
                >
                  <img 
                    src={iconNewRequest} 
                    alt="Submit Request" 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/70 to-primary/40" />
                  
                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform border-2 border-white/40">
                      <PlusCircle className="h-10 w-10 text-white" />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-white mb-2">Submit Request</h3>
                        <p className="text-white/90 text-sm">Create a new TDS entry request</p>
                      </div>
                      <Button className="w-full shadow-lg bg-white text-ribbon hover:bg-white/90 font-semibold border-2 border-white">Create Request</Button>
                    </div>
                  </div>
                </Card>

                {/* SSR Directory */}
                <Card 
                  className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 group overflow-hidden relative h-80" 
                  onClick={() => navigate('/ssr-directory')}
                >
                  <img 
                    src={iconManageUsers} 
                    alt="SSR Directory" 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/70 to-primary/40" />
                  
                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform border-2 border-white/40">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-white mb-2">SSR Directory</h3>
                        <p className="text-white/90 text-sm">Safety leadership contacts</p>
                      </div>
                      <Button className="w-full shadow-lg bg-white text-ribbon hover:bg-white/90 font-semibold border-2 border-white">View Directory</Button>
                    </div>
                  </div>
                </Card>

                {/* TDS Tool */}
                <Card 
                  className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 group overflow-hidden relative h-80" 
                  onClick={() => navigate('/tds-tool')}
                >
                  <img 
                    src={iconTdsTool} 
                    alt="TDS Tool" 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/70 to-primary/40" />
                  
                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform border-2 border-white/40">
                      <Wrench className="h-10 w-10 text-white" />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-white mb-2">TDS Tool</h3>
                        <p className="text-white/90 text-sm">Transportation planning calculations</p>
                      </div>
                      <Button className="w-full shadow-lg bg-white text-ribbon hover:bg-white/90 font-semibold border-2 border-white">Open Tool</Button>
                    </div>
                  </div>
                </Card>

                {/* New Asset Request - Admin View */}
                <Card 
                  className="cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 border-primary/30 group overflow-hidden relative h-80" 
                  onClick={() => navigate('/new-asset-requests')}
                >
                  <img 
                    src={iconNewAssetRequest} 
                    alt="New Asset Request" 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/70 to-primary/40" />
                  
                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform border-2 border-white/40">
                      <FilePlus2 className="h-10 w-10 text-white" />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-white mb-2">New Asset Requests</h3>
                        <p className="text-white/90 text-sm">Manage new asset TDS requests</p>
                      </div>
                      <Button className="w-full shadow-lg bg-white text-ribbon hover:bg-white/90 font-semibold border-2 border-white">View All</Button>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
