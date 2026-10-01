import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { landingRouteFor } from '@/components/layouts/nav';

/** Sends "/" to the correct landing route for the signed-in role. */
export function RootRedirect() {
  const { isAuthenticated, role, initializing } = useAuth();

  if (initializing) return <FullPageSpinner label="Loading…" />;
  if (!isAuthenticated || !role) return <Navigate to="/login" replace />;
  return <Navigate to={landingRouteFor(role)} replace />;
}
