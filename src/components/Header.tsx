import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, User, Users, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

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
                <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
                  {user.email}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}