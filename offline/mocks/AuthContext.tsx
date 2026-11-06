import { ReactNode } from 'react';
const value = { user: { id: 'offline-user', email: 'offline@local' } as any, session: null, role: 'super_admin' as const, loading: false, signOut: async () => {} };
export function AuthProvider({ children }: { children: ReactNode }) { return <>{children}</>; }
export function useAuth() { return value; }
