import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { landingRouteFor } from '@/components/layouts/nav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';

/** Login & Authentication screen (PRD Table 3.6, row 1). */

export function Login() {
  const { login, isAuthenticated, role, initializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!initializing && isAuthenticated && role) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? landingRouteFor(role)} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? landingRouteFor(user.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border border-hairline/90 bg-white/95 p-7 shadow-lg backdrop-blur-md sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-ink-primary">Sign in</h2>
        <p className="mt-1 text-[13px] text-ink-secondary">
          Enter your credentials to access the operations console.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-control border border-red-200 bg-red-50/80 p-3.5 text-[13px] text-red-700 shadow-xs"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Email address" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="size-4" />}
          />
        </Field>

        <Field label="Password" htmlFor="password" required>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="size-4" />}
            rightSlot={
              <IconButton
                label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </IconButton>
            }
          />
        </Field>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={submitting}
          leftIcon={<LogIn className="size-4" />}
          className="mt-2"
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 border-t border-hairline/80 pt-5 text-center text-xs text-ink-muted">
        Access is restricted to authorised fleet personnel.
      </p>
    </Card>
  );
}

