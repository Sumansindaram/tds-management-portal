import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, ArrowLeft, Database } from 'lucide-react';

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
  const [filteredEntries, setFilteredEntries] = useState<TDSEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const navigate = useNavigate();
  const { role } = useAuth();

  useEffect(() => {
    if (role === 'admin' || role === 'super_admin') {
      loadEntries();
    }
  }, [role]);

  useEffect(() => {
    const handleFocus = () => {
      if (role === 'admin' || role === 'super_admin') {
        loadEntries();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [role]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEntries(entries);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = entries.filter(entry =>
        entry.reference.toLowerCase().includes(query) ||
        entry.short_name.toLowerCase().includes(query) ||
        entry.nsn.toLowerCase().includes(query) ||
        entry.ssr_name.toLowerCase().includes(query) ||
        entry.status.toLowerCase().includes(query)
      );
      setFilteredEntries(filtered);
    }
    setCurrentPage(1);
  }, [searchQuery, entries]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEntries = filteredEntries.slice(startIndex, endIndex);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('tds_entries')
        .select('id, reference, short_name, nsn, ssr_name, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
      setFilteredEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/20 via-background to-muted/10">
      <Header />
      <main className="container mx-auto p-6 lg:p-8">
        <Card className="shadow-2xl border-primary/20">
          <div className="p-6 lg:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-3xl font-bold text-primary">TDS Requests - Admin View</h2>
                <p className="text-muted-foreground">Search and manage all Tie Down Scheme submissions</p>
              </div>
              {role === 'super_admin' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://lovable.dev', '_blank')}
                  className="border-primary/30 hover:bg-primary/10"
                  title="Access Backend Database"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Backend
                </Button>
              )}
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by Reference, NSN, SSR Name, Short Name, or Status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base border-primary/30 focus:border-primary"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {searchQuery ? `No requests found matching "${searchQuery}"` : 'No requests found'}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-primary/20">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="text-primary-foreground font-bold">Reference</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Short Name</TableHead>
                      <TableHead className="text-primary-foreground font-bold">NSN</TableHead>
                      <TableHead className="text-primary-foreground font-bold">SSR Name</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Submitted On</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentEntries.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className="cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => navigate(`/admin/detail/${entry.id}`)}
                      >
                        <TableCell className="font-semibold text-primary">{entry.reference}</TableCell>
                        <TableCell className="font-medium">{entry.short_name}</TableCell>
                        <TableCell>{entry.nsn}</TableCell>
                        <TableCell>{entry.ssr_name}</TableCell>
                        <TableCell className="text-sm">{formatDateTime(entry.created_at)}</TableCell>
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

            {!loading && filteredEntries.length > 0 && (
              <>
                <div className="mt-6 flex flex-col items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredEntries.length)} of {filteredEntries.length} entries
                  </div>
                  {totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                          let page;
                          if (totalPages <= 7) {
                            page = i + 1;
                          } else if (currentPage <= 4) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 3) {
                            page = totalPages - 6 + i;
                          } else {
                            page = currentPage - 3 + i;
                          }
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
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Back Button at Bottom */}
        <div className="flex justify-center mt-6 pb-6">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            size="lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
