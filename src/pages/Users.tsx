import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, UserRole } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pencil, Search, ArrowUpDown, ArrowUp, ArrowDown, ArrowLeft } from 'lucide-react';

interface UserWithRole {
  id: string;
  full_name: string;
  username: string | null;
  email: string;
  role: UserRole;
  updated_at?: string;
}

type SortField = 'name' | 'recent';
type SortDirection = 'asc' | 'desc';

export default function Users() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [updating, setUpdating] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (role === 'super_admin') {
      loadUsers();
    }
  }, [role]);

  useEffect(() => {
    let filtered = users;
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = users.filter(
        u =>
          u.full_name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.username?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortField === 'name') {
        const comparison = a.full_name.localeCompare(b.full_name);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        // Sort by recent changes (updated_at)
        const aDate = new Date(a.updated_at || 0).getTime();
        const bDate = new Date(b.updated_at || 0).getTime();
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }
    });

    setFilteredUsers(sorted);
    setCurrentPage(1);
  }, [searchQuery, users, sortField, sortDirection]);

  const loadUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, email, updated_at');

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = profilesData.map(profile => {
        const userRole = rolesData.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || 'user',
          updated_at: profile.updated_at,
        };
      });

      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (userToEdit: UserWithRole) => {
    if (userToEdit.id === user?.id) {
      toast({
        title: 'Not Allowed',
        description: 'You cannot edit your own role',
        variant: 'destructive',
      });
      return;
    }
    setEditingUser(userToEdit);
    setSelectedRole(userToEdit.role);
  };

  const handleSaveChanges = async () => {
    if (!editingUser) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: selectedRole })
        .eq('user_id', editingUser.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      console.error('Role update error:', error);
      toast({
        title: 'Error',
        description: 'Unable to update user role. Please try again or contact support if the issue persists.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'user':
        return 'User';
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 inline" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4 inline" /> : 
      <ArrowDown className="ml-2 h-4 w-4 inline" />;
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 lg:p-8">
        <Card className="shadow-2xl border-primary/20">
          <div className="p-6 lg:p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-card-foreground mb-2">Users</h2>
              <p className="text-muted-foreground">Manage user roles</p>
            </div>

            <div className="mb-6 flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base border-primary/30 focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={sortField === 'name' ? 'default' : 'secondary'}
                  onClick={() => handleSort('name')}
                  className="h-12"
                >
                  A-Z <SortIcon field="name" />
                </Button>
                <Button
                  variant={sortField === 'recent' ? 'default' : 'secondary'}
                  onClick={() => handleSort('recent')}
                  className="h-12"
                >
                  Recent <SortIcon field="recent" />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {searchQuery ? 'No users found matching your search' : 'No users found'}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-primary/20">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary hover:bg-primary">
                        <TableHead className="text-primary-foreground font-bold">Display Name</TableHead>
                        <TableHead className="text-primary-foreground font-bold">Username</TableHead>
                        <TableHead className="text-primary-foreground font-bold">Email Address</TableHead>
                        <TableHead className="text-primary-foreground font-bold">Role</TableHead>
                        <TableHead className="text-primary-foreground font-bold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentUsers.map((u, index) => (
                        <TableRow 
                          key={u.id}
                          className={`hover:bg-primary/10 transition-colors ${index % 2 === 1 ? 'bg-muted/30' : ''}`}
                        >
                          <TableCell className="font-medium">{u.full_name}</TableCell>
                          <TableCell>{u.username || u.full_name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                              {getRoleLabel(u.role)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(u)}
                              disabled={u.id === user?.id}
                              className="h-9 w-9 p-0 hover:bg-primary hover:text-primary-foreground"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-6 flex flex-col items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
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
                          let page = i + 1;
                          if (totalPages > 7) {
                            if (currentPage <= 4) page = i + 1;
                            else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                            else page = currentPage - 3 + i;
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

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-[600px] bg-background border-primary/20">
          <DialogHeader className="bg-primary text-primary-foreground -m-6 mb-0 p-6 rounded-t-lg">
            <DialogTitle className="text-xl">
              Edit User: {editingUser?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6 px-6">
            <div className="space-y-3">
              <Label htmlFor="role" className="text-base font-semibold">Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                <SelectTrigger id="role" className="h-12 border-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingUser && (
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                  <span className="font-semibold">Username:</span>
                  <span>{editingUser.username || editingUser.full_name}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                  <span className="font-semibold">Email:</span>
                  <span>{editingUser.email}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                  <span className="font-semibold">Current Role:</span>
                  <span>{getRoleLabel(editingUser.role)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="bg-muted/30 -m-6 mt-0 p-6 rounded-b-lg">
            <Button 
              variant="outline" 
              onClick={() => setEditingUser(null)}
              className="h-12 px-6"
            >
              CANCEL
            </Button>
            <Button 
              onClick={handleSaveChanges} 
              disabled={updating}
              className="h-12 px-6"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'SAVE CHANGES'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
