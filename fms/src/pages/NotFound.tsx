import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { landingRouteFor } from '@/components/layouts/nav';
import { Button } from '@/components/ui/Button';

export function NotFound() {
  const { role } = useAuth();

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4">
      <div className="flex flex-col items-center text-center">
        <span className="mb-5 grid size-14 place-items-center rounded-full bg-brand-100 text-brand-700">
          <Compass className="size-7" aria-hidden />
        </span>
        <p className="text-3xl font-bold tracking-tight text-ink-primary">404</p>
        <p className="mt-1 text-sm text-ink-secondary">
          That page doesn&apos;t exist or has moved.
        </p>
        <Link to={role ? landingRouteFor(role) : '/login'} className="mt-6">
          <Button>{role ? 'Back to dashboard' : 'Go to sign in'}</Button>
        </Link>
      </div>
    </div>
  );
}
