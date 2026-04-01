import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { appPath } from '@/lib/preview';

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly }: Props) {
  const { isAuthenticated, isAdmin, authError, retryHydration, logout } = useAuth();

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-2xl bg-card p-6 text-center shadow-soft">
          <h1 className="text-xl font-bold text-foreground">Account setup incomplete</h1>
          <p className="mt-2 text-sm text-muted-foreground">{authError}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => void retryHydration()}>Retry</Button>
            <Button variant="outline" onClick={() => void logout()}>Log out</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to={appPath('/dashboard')} replace />;
  return <>{children}</>;
}
