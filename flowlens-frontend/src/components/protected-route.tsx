import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { Zap } from 'lucide-react';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Zap className="h-6 w-6 animate-pulse text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the intended destination so login can send them back after
    // a successful sign-in, instead of always landing on /dashboard.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
