import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Header() {
  const { user, role, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">JSP 800 Vol 7</h1>
            <p className="text-sm opacity-90">Tie Down Scheme (TDS) Portal</p>
          </div>
          <div className="flex items-center gap-3">
            {role === 'admin' ? (
              <Badge variant="default" className="bg-badge-admin text-white">
                <Shield className="mr-1 h-3 w-3" />
                Admin Mode
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-badge-user text-white">
                <User className="mr-1 h-3 w-3" />
                User Mode
              </Badge>
            )}
            <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
              {user?.email}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}