import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute - Client-side route protection component
 * 
 * SECURITY NOTE: This component provides UX-level route protection only.
 * The actual security is enforced by Row Level Security (RLS) policies in the database.
 * Client-side checks can be bypassed, but users cannot access data without proper RLS policies.
 * 
 * This component serves to:
 * - Improve user experience by preventing unauthorized UI access
 * - Reduce unnecessary API calls for unauthorized users
 * - Provide clear navigation flow
 * 
 * Always ensure RLS policies are properly configured for true data security.
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false, superAdminOnly = false }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (superAdminOnly && role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && role !== 'admin' && role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}