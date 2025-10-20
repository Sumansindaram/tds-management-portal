import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, User, Users, Home, ChevronDown, Info, Database, Menu, X } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import desLogo from '@/assets/des-logo.jfif';

export function Header() {
  const { user, role, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [fullName, setFullName] = React.useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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
      <Badge variant="secondary" className="bg-badge-user text-white">
        <User className="mr-1 h-3 w-3" />
        User
      </Badge>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-ribbon border-b-4 border-primary shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 cursor-pointer flex-1 min-w-0" onClick={() => navigate('/')}>
            <img src={desLogo} alt="Ministry of Defence & DE&S" className="h-10 sm:h-14 shrink-0" />
            <div className="border-l-2 border-ribbon-foreground/30 pl-2 sm:pl-4 min-w-0">
              <h1 className="text-sm sm:text-xl font-bold text-ribbon-foreground truncate">TDS Management System</h1>
              <p className="text-[10px] sm:text-xs text-ribbon-foreground/80 hidden sm:block">JSP 800 Vol 7 - Tie Down Scheme Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <>
                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/')}
                    className="text-ribbon-foreground hover:bg-ribbon-foreground/20 font-semibold"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                  {(role === 'admin' || role === 'super_admin') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/admin')}
                      className="text-ribbon-foreground hover:bg-ribbon-foreground/20 font-semibold"
                    >
                      <Database className="mr-2 h-4 w-4" />
                      View All Requests
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/form')}
                    className="text-ribbon-foreground hover:bg-ribbon-foreground/20 font-semibold"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Submit Request
                  </Button>
                  {role === 'super_admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/users')}
                      className="text-ribbon-foreground hover:bg-ribbon-foreground/20 font-semibold"
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
                      <DropdownMenuContent align="end" className="z-50 w-64 bg-card border-2">
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-semibold text-card-foreground">Super Admin Tools</p>
                            <p className="text-xs text-muted-foreground">System administration options</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 text-card-foreground" onClick={() => {
                          toast({
                            title: "Backend Access",
                            description: "Click 'View Backend' in the Lovable chat to access the database dashboard.",
                            duration: 5000,
                          });
                        }}>
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
                    <Badge variant="secondary" className="bg-badge-user text-white">
                      <User className="mr-1 h-3 w-3" />
                      User
                    </Badge>
                  )}
                </div>

                {/* Mobile Menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="lg:hidden"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                    <SheetHeader>
                      <SheetTitle className="text-left">Navigation Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-3 mt-6">
                      <Button
                        variant="default"
                        className="w-full justify-start bg-primary text-primary-foreground"
                        onClick={() => {
                          navigate('/');
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Home className="mr-2 h-4 w-4" />
                        Home
                      </Button>
                      {(role === 'admin' || role === 'super_admin') && (
                        <Button
                          variant="default"
                          className="w-full justify-start bg-primary text-primary-foreground"
                          onClick={() => {
                            navigate('/admin');
                            setMobileMenuOpen(false);
                          }}
                        >
                          <Database className="mr-2 h-4 w-4" />
                          View All Requests
                        </Button>
                      )}
                      <Button
                        variant="default"
                        className="w-full justify-start bg-primary text-primary-foreground"
                        onClick={() => {
                          navigate('/form');
                          setMobileMenuOpen(false);
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Submit Request
                      </Button>
                      {role === 'super_admin' && (
                        <>
                          <Button
                            variant="default"
                            className="w-full justify-start bg-primary text-primary-foreground"
                            onClick={() => {
                              navigate('/users');
                              setMobileMenuOpen(false);
                            }}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            Manage Users
                          </Button>
                          <Button
                            variant="default"
                            className="w-full justify-start bg-badge-admin text-white"
                            onClick={() => {
                              toast({
                                title: "Backend Access",
                                description: "Click 'View Backend' in the Lovable chat to access the database dashboard.",
                                duration: 5000,
                              });
                              setMobileMenuOpen(false);
                            }}
                          >
                            <Database className="mr-2 h-4 w-4" />
                            Backend Dashboard
                          </Button>
                        </>
                      )}
                      
                      <div className="border-t pt-3 mt-3">
                        {role === 'super_admin' ? (
                          <Badge variant="default" className="bg-badge-admin text-white mb-3 w-full justify-center py-2">
                            <Shield className="mr-1 h-3 w-3" />
                            Super Admin
                          </Badge>
                        ) : role === 'admin' ? (
                          <Badge variant="default" className="bg-badge-user text-white mb-3 w-full justify-center py-2">
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-badge-user text-white mb-3 w-full justify-center py-2">
                            <User className="mr-1 h-3 w-3" />
                            User
                          </Badge>
                        )}
                        
                        <div className="bg-muted/30 rounded-lg p-3 mb-3">
                          <p className="text-sm font-semibold">{fullName || user.email?.split('@')[0] || 'User'}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => {
                            signOut();
                            setMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                
                {/* User Dropdown - Desktop Only */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="hidden lg:flex">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-ribbon-foreground/30 bg-ribbon text-ribbon-foreground hover:bg-ribbon-foreground/20 gap-1"
                    >
                      <User className="h-4 w-4 mr-1" />
                      <span className="hidden xl:inline">{fullName || user.email?.split('@')[0] || 'User'}</span>
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 w-80 bg-card border-2">
                    <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
                      <img src={desLogo} alt="MOD & DE&S" className="h-12" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-primary">Ministry of Defence</div>
                        <div className="text-xs text-muted-foreground">Defence Equipment & Support</div>
                      </div>
                    </div>
                    <DropdownMenuLabel className="font-normal bg-muted/30">
                      <div className="flex flex-col space-y-1 py-2">
                        <p className="text-sm font-semibold text-card-foreground">
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
