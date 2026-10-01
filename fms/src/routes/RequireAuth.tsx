import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { landingRouteFor } from '@/components/layouts/nav';
import type { UserRole } from '@/types/domain';

/**
 * Route guard (NFR2). Redirects unauthenticated users to /login (preserving the
 * intended destination) and bounces users hitting a route outside their role.
 */
export function RequireAuth({ role }: { role?: UserRole }) {
  const { isAuthenticated, role: userRole, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullPageSpinner label="Restoring session…" />;

  if (!isAuthenticated || !userRole) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && userRole !== role) {
    return <Navigate to={landingRouteFor(userRole)} replace />;
  }

  return <Outlet />;
}
