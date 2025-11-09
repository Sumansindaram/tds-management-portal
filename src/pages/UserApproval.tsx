import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  approved: boolean;
  created_at: string;
}

export default function UserApproval() {
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 lg:p-8">
        <Card className="p-6">
          <h1 className="text-3xl font-bold text-foreground mb-6">User Approval System</h1>
          <p className="text-muted-foreground mb-4">
            The user approval system has been disabled as the main application uses role-based access control.
            All new users are automatically approved upon registration.
          </p>
          <p className="text-muted-foreground mb-6">
            User roles can be managed through the "Manage Users" section (Super Admin only).
          </p>
          <div className="mt-6">
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
