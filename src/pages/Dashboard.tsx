import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { FileText, List, PlusCircle } from 'lucide-react';

export default function Dashboard() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === 'admin';

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
            </>
          )}
        </div>
      </main>
    </div>
  );
}