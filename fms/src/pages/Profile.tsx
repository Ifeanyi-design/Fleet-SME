import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { DetailList } from '@/components/modules/shared/DetailList';

/** Admin profile — account details for the signed-in fleet manager. */

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  function handleSignOut() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="Your account details and session."
        breadcrumbs={[{ label: 'Account' }, { label: 'Profile' }]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-5 flex items-center gap-4 border-b border-hairline pb-5">
            <Avatar name={user?.name ?? 'User'} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-ink-primary">{user?.name}</p>
              <p className="truncate text-[13px] text-ink-secondary">{user?.email}</p>
            </div>
            <Badge variant="success" className="ml-auto shrink-0 capitalize">
              {user?.role}
            </Badge>
          </div>

          <DetailList
            columns={2}
            items={[
              { label: 'Full name', value: user?.name ?? '—' },
              { label: 'Email address', value: user?.email ?? '—' },
              { label: 'Role', value: <span className="capitalize">{user?.role ?? '—'}</span> },
              { label: 'Account ID', value: <span className="font-mono">#{user?.userId ?? '—'}</span> },
            ]}
          />
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2.5">
            <ShieldCheck className="size-4 text-ink-secondary" aria-hidden />
            <CardTitle>Session</CardTitle>
          </div>
          <CardDescription>
            You are signed in as an administrator. Access to vehicle, driver and dispatch
            records is restricted to this role.
          </CardDescription>
          <Button
            variant="secondary"
            fullWidth
            className="mt-5"
            leftIcon={<LogOut className="size-4" />}
            onClick={() => setConfirmingSignOut(true)}
          >
            Sign out
          </Button>
        </Card>
      </div>

      <AlertDialog
        open={confirmingSignOut}
        onClose={() => setConfirmingSignOut(false)}
        onConfirm={handleSignOut}
        title="Sign out?"
        description="You will be returned to the sign-in screen."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
      />
    </>
  );
}
