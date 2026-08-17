import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/users.api';

export function OnboardingGate() {
  const location = useLocation();

  const profileQuery = useQuery({
    queryKey: ['profile', 'onboarding-check'],
    queryFn: () => usersApi.getProfile(),
    staleTime: Infinity, // onboarding status doesn't change mid-session outside this flow itself
  });

  // Fail open — if the profile check itself fails, don't trap the user in
  // a broken gate; let them into the app rather than blocking on an
  // unrelated network hiccup.
  if (profileQuery.isLoading) return null;
  if (profileQuery.isError) return <Outlet />;

  const needsOnboarding = profileQuery.data?.onboardingStep === 0;

  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
