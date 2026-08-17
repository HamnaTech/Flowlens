import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { LandingPage } from '@/pages/marketing/landing-page';

export function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // Don't flash the landing page while the initial /auth/me check is still
  // running — same loading guard pattern as ProtectedRoute.
  if (isLoading) return null;

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}
