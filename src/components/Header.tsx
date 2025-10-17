import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, User, Users, Home, ChevronDown, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

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
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <h1 className="text-2xl font-extrabold">JSP 800 Vol 7</h1>
            <p className="text-sm opacity-90">Tie Down Scheme (TDS) Portal</p>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
                {role === 'super_admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/users')}
                    className="text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                )}
                {getRoleBadge()}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-primary-foreground hover:bg-primary-foreground/10 gap-1"
                    >
                      {user.email?.split('@')[0] || 'User'}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="flex items-center gap-3 p-4 border-b">
                      <div className="flex items-center gap-3 w-full">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">Ministry of Defence</div>
                          <div className="text-xs text-muted-foreground">DE&S</div>
                        </div>
                      </div>
                    </div>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                      <Info className="mr-2 h-4 w-4" />
                      <span className="text-xs">Version 1.0.0</span>
                    </DropdownMenuItem>
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