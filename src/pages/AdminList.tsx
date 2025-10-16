import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface TDSEntry {
  id: string;
  reference: string;
  short_name: string;
  nsn: string;
  ssr_name: string;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-badge-pending text-yellow-900',
  Approved: 'bg-badge-approved text-white',
  Rejected: 'bg-badge-rejected text-white',
  Returned: 'bg-badge-returned text-white',
};

export default function AdminList() {
  const [entries, setEntries] = useState<TDSEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { role } = useAuth();

  useEffect(() => {
    if (role === 'admin' || role === 'super_admin') {
      loadEntries();
    }
  }, [role]);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('tds_entries')
        .select('id, reference, short_name, nsn, ssr_name, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6">
        <Card className="shadow-lg">
          <div className="p-6">
            <h2 className="mb-6 text-2xl font-bold text-primary">TDS Requests - Admin View</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : entries.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No requests found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="text-primary-foreground">Reference</TableHead>
                      <TableHead className="text-primary-foreground">Short Name</TableHead>
                      <TableHead className="text-primary-foreground">NSN</TableHead>
                      <TableHead className="text-primary-foreground">SSR Name</TableHead>
                      <TableHead className="text-primary-foreground">Submitted On</TableHead>
                      <TableHead className="text-primary-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className="cursor-pointer hover:bg-primary/5"
                        onClick={() => navigate(`/admin/detail/${entry.id}`)}
                      >
                        <TableCell className="font-medium">{entry.reference}</TableCell>
                        <TableCell>{entry.short_name}</TableCell>
                        <TableCell>{entry.nsn}</TableCell>
                        <TableCell>{entry.ssr_name}</TableCell>
                        <TableCell>{formatDate(entry.created_at)}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[entry.status] || ''}>
                            {entry.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}