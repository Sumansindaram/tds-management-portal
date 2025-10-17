import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, User, Users, Home, ChevronDown, Info, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import desLogo from '@/assets/des-logo.jfif';

export function Header() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = React.useState<string>('');

  React.useEffect(() => {
    if (user?.id) {
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) setFullName(data.full_name);
        });
    }
  }, [user?.id]);

  const getRoleBadge = () => {
    if (role === 'super_admin') {
      return (
        <Badge variant="default" className="bg-badge-admin text-white">
          <Shield className="mr-1 h-3 w-3" />
          Super Admin
        </Badge>
      );
    } else if (role === 'admin') {
      return (
        <Badge variant="default" className="bg-badge-user text-white">
          <Shield className="mr-1 h-3 w-3" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-muted text-foreground">
        <User className="mr-1 h-3 w-3" />
        User
      </Badge>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b-4 border-primary shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <img src={desLogo} alt="Ministry of Defence & DE&S" className="h-14" />
            <div className="border-l-2 border-primary/30 pl-4">
              <h1 className="text-xl font-bold text-primary">TDS Management System</h1>
              <p className="text-xs text-muted-foreground">JSP 800 Vol 7 - Tie Down Scheme Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="text-foreground hover:bg-primary/10 bg-secondary/50"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
                {role === 'super_admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/users')}
                    className="text-foreground hover:bg-primary/10 bg-secondary/50"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                )}
                
                {role === 'super_admin' ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="bg-badge-admin text-white hover:bg-badge-admin/90 gap-1"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Super Admin
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-background border-primary/20">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-semibold text-foreground">Super Admin Tools</p>
                          <p className="text-xs text-muted-foreground">System administration options</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer hover:bg-primary/10" onClick={() => window.open(`https://supabase.com/dashboard/project/ybqrysjtwynuzuqggtfs`, '_blank')}>
                        <Database className="mr-2 h-4 w-4" />
                        <span>Backend Dashboard</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : role === 'admin' ? (
                  <Badge variant="default" className="bg-badge-user text-white">
                    <Shield className="mr-1 h-3 w-3" />
                    Admin
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-muted text-foreground">
                    <User className="mr-1 h-3 w-3" />
                    User
                  </Badge>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-primary/30 hover:bg-primary/5 gap-1"
                    >
                      <User className="h-4 w-4 mr-1" />
                      {fullName || user.email?.split('@')[0] || 'User'}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
                      <img src={desLogo} alt="MOD & DE&S" className="h-12" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-primary">Ministry of Defence</div>
                        <div className="text-xs text-muted-foreground">Defence Equipment & Support</div>
                      </div>
                    </div>
                    <DropdownMenuLabel className="font-normal bg-muted/30">
                      <div className="flex flex-col space-y-1 py-2">
                        <p className="text-sm font-semibold text-foreground">
                          {fullName || user.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer my-1 mx-1">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span className="font-medium">Logout</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="px-3 py-2 text-xs text-center bg-muted/20 text-muted-foreground">
                      <span className="font-medium">About:</span> Version 1.0.0
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
