import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Search } from 'lucide-react';

interface TDSEntry {
  id: string;
  reference: string;
  nsn: string;
  short_name: string | null;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-badge-pending text-card-foreground',
  Approved: 'bg-badge-approved text-white',
  Rejected: 'bg-badge-rejected text-white',
  Returned: 'bg-badge-returned text-white'
};

export default function MySubmissions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<TDSEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TDSEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  useEffect(() => {
    loadEntries();

    const handleFocus = () => loadEntries();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  useEffect(() => {
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const results = entries.filter(entry =>
        entry.reference.toLowerCase().includes(lowerQuery) ||
        entry.nsn.toLowerCase().includes(lowerQuery) ||
        (entry.short_name && entry.short_name.toLowerCase().includes(lowerQuery)) ||
        entry.status.toLowerCase().includes(lowerQuery)
      );
      setFilteredEntries(results);
      setCurrentPage(1);
    } else {
      setFilteredEntries(entries);
    }
  }, [searchQuery, entries]);

  async function loadEntries() {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tds_entries')
        .select('id, reference, nsn, short_name, status, created_at')
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
      setFilteredEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEntries = filteredEntries.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 lg:p-8">
        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-2xl font-bold text-card-foreground">My Submissions</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by reference, NSN, name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-[300px] bg-card"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No results found.' : 'No submissions yet.'}
                </p>
                <Button onClick={() => navigate('/form')}>Create Your First Request</Button>
              </div>
            ) : (
              <>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-bold text-card-foreground">Reference</TableHead>
                        <TableHead className="font-bold text-card-foreground">NSN</TableHead>
                        <TableHead className="font-bold text-card-foreground">Short Name</TableHead>
                        <TableHead className="font-bold text-card-foreground">Status</TableHead>
                        <TableHead className="font-bold text-card-foreground">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentEntries.map((entry) => (
                        <TableRow
                          key={entry.id}
                          className="cursor-pointer hover:bg-primary/5 transition-colors"
                          onClick={() => navigate(`/request/${entry.id}`)}
                        >
                          <TableCell className="font-semibold text-primary">{entry.reference}</TableCell>
                          <TableCell className="text-card-foreground">{entry.nsn}</TableCell>
                          <TableCell className="text-card-foreground">{entry.short_name || '-'}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[entry.status] || 'bg-muted text-muted-foreground'}>
                              {entry.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-card-foreground">{formatDateTime(entry.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}

            <div className="mt-6 flex justify-start">
              <Button variant="secondary" onClick={() => navigate('/')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}