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
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, ArrowLeft, Database, Download, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const itemsPerPage = 20;
  const navigate = useNavigate();
  const { role } = useAuth();
  const { toast } = useToast();

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

  const toggleSelectAll = () => {
    if (selectedIds.size === currentEntries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentEntries.map(e => e.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const checkDrawingsExist = async (entryId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .storage
        .from('transportation-data')
        .list(`${entryId}/drawings`);
      
      if (error || !data) return false;
      return data.length > 0;
    } catch {
      return false;
    }
  };

  const exportToCSV = async (idsToExport: string[]) => {
    if (idsToExport.length === 0) {
      toast({
        title: "No Entries Selected",
        description: "Please select at least one entry to export.",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    try {
      // Fetch full details for selected entries
      const { data: fullEntries, error } = await supabase
        .from('tds_entries')
        .select('*')
        .in('id', idsToExport)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!fullEntries || fullEntries.length === 0) {
        toast({
          title: "Export Failed",
          description: "No data found to export.",
          variant: "destructive",
        });
        return;
      }

      // Check for drawings for each entry
      const entriesWithDrawings = await Promise.all(
        fullEntries.map(async (entry) => {
          const hasDrawings = await checkDrawingsExist(entry.id);
          return { ...entry, has_drawings: hasDrawings ? 'Yes' : 'No' };
        })
      );

      // Create CSV headers
      const headers = [
        'Reference',
        'Status',
        'SSR Name',
        'SSR Email',
        'Designation',
        'NSN',
        'Asset Code',
        'Short Name',
        'Asset Type',
        'Length',
        'Width',
        'Height',
        'Unladen Weight',
        'Laden Weight',
        'ALEST',
        'LIMS 25',
        'LIMS 28',
        'Classification',
        'MLC',
        'Service',
        'Owner Nation',
        'RIC Code',
        'Out of Service Date',
        'Licence',
        'Crew Number',
        'Passenger Capacity',
        'Range',
        'Fuel Capacity',
        'Single Carriage',
        'Dual Carriage',
        'Max Speed',
        'SSR Approval Confirmed',
        'Authorised Person Confirmed',
        'Data Responsibility Confirmed',
        'Review Responsibility Confirmed',
        'Drawings Attached',
        'User Comment',
        'Admin Comment',
        'Submitted On',
        'Last Updated',
      ];

      // Create CSV rows
      const rows = entriesWithDrawings.map(entry => [
        entry.reference,
        entry.status,
        entry.ssr_name,
        entry.ssr_email,
        entry.designation,
        entry.nsn,
        entry.asset_code,
        entry.short_name,
        entry.asset_type,
        entry.length,
        entry.width,
        entry.height,
        entry.unladen_weight,
        entry.laden_weight,
        entry.alest,
        entry.lims_25,
        entry.lims_28,
        entry.classification || '',
        entry.mlc,
        entry.service,
        entry.owner_nation,
        entry.ric_code,
        entry.out_of_service_date,
        entry.licence || '',
        entry.crew_number || '',
        entry.passenger_capacity || '',
        entry.range || '',
        entry.fuel_capacity || '',
        entry.single_carriage || '',
        entry.dual_carriage || '',
        entry.max_speed || '',
        entry.ssr_approval_confirmed ? 'Yes' : 'No',
        entry.authorised_person_confirmed ? 'Yes' : 'No',
        entry.data_responsibility_confirmed ? 'Yes' : 'No',
        entry.review_responsibility_confirmed ? 'Yes' : 'No',
        entry.has_drawings,
        entry.user_comment || '',
        entry.admin_comment || '',
        formatDateTime(entry.created_at),
        formatDateTime(entry.updated_at),
      ]);

      // Escape and format CSV
      const escapeCsvValue = (value: any) => {
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      const csvContent = [
        headers.map(escapeCsvValue).join(','),
        ...rows.map(row => row.map(escapeCsvValue).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `TDS_Entries_Export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${entriesWithDrawings.length} ${entriesWithDrawings.length === 1 ? 'entry' : 'entries'} to CSV.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting data.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportSelected = () => {
    exportToCSV(Array.from(selectedIds));
  };

  const handleExportAll = () => {
    exportToCSV(filteredEntries.map(e => e.id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 lg:p-8">
        <Card className="shadow-2xl border-primary/20">
          <div className="p-6 lg:p-8">
            <div className="mb-6">
              <h2 className="mb-2 text-3xl font-bold text-card-foreground">TDS Requests - Admin View</h2>
              <p className="text-muted-foreground">Search and manage all Tie Down Scheme submissions</p>
            </div>

            {/* Search Bar and Export Buttons */}
            <div className="mb-6 space-y-4">
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
              
              {/* Export Buttons */}
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={handleExportSelected}
                  disabled={selectedIds.size === 0 || exporting}
                  variant="default"
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export Selected ({selectedIds.size})
                </Button>
                <Button
                  onClick={handleExportAll}
                  disabled={filteredEntries.length === 0 || exporting}
                  variant="default"
                  size="sm"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  Export All ({filteredEntries.length})
                </Button>
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
                      <TableHead className="text-primary-foreground font-bold w-12">
                        <Checkbox
                          checked={selectedIds.size === currentEntries.length && currentEntries.length > 0}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                          className="border-primary-foreground data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary"
                        />
                      </TableHead>
                      <TableHead className="text-primary-foreground font-bold">Reference</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Short Name</TableHead>
                      <TableHead className="text-primary-foreground font-bold">NSN</TableHead>
                      <TableHead className="text-primary-foreground font-bold">SSR Name</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Submitted On</TableHead>
                      <TableHead className="text-primary-foreground font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentEntries.map((entry, index) => (
                      <TableRow
                        key={entry.id}
                        className={`hover:bg-primary/10 transition-colors ${index % 2 === 1 ? 'bg-muted/50' : ''}`}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(entry.id)}
                            onCheckedChange={() => toggleSelectRow(entry.id)}
                            aria-label={`Select ${entry.reference}`}
                          />
                        </TableCell>
                        <TableCell 
                          className="font-semibold text-primary cursor-pointer"
                          onClick={() => navigate(`/admin/detail/${entry.id}`)}
                        >
                          {entry.reference}
                        </TableCell>
                        <TableCell 
                          className="font-medium cursor-pointer"
                          onClick={() => navigate(`/admin/detail/${entry.id}`)}
                        >
                          {entry.short_name}
                        </TableCell>
                        <TableCell 
                          className="cursor-pointer"
                          onClick={() => navigate(`/admin/detail/${entry.id}`)}
                        >
                          {entry.nsn}
                        </TableCell>
                        <TableCell 
                          className="cursor-pointer"
                          onClick={() => navigate(`/admin/detail/${entry.id}`)}
                        >
                          {entry.ssr_name}
                        </TableCell>
                        <TableCell 
                          className="text-sm cursor-pointer"
                          onClick={() => navigate(`/admin/detail/${entry.id}`)}
                        >
                          {formatDateTime(entry.created_at)}
                        </TableCell>
                        <TableCell 
                          className="cursor-pointer"
                          onClick={() => navigate(`/admin/detail/${entry.id}`)}
                        >
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
            
            <div className="mt-8 pt-6 border-t flex justify-start">
              <Button
                onClick={() => navigate('/')}
                variant="default"
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
