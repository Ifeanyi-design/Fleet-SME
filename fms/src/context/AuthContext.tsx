import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiClient, setAuthToken } from '@/lib/apiClient';
import type { AuthUser, UserRole } from '@/types/domain';

/**
 * Auth / session state (plan.md §1.3).
 *
 * Two modes, selected by VITE_USE_MOCK:
 *   mock  → credentials checked against the in-memory demo directory (no backend needed)
 *   live  → POST /api/auth/login against the Flask API, JWT persisted, session re-verified
 *           with GET /api/auth/me on reload
 *
 * The returned principal carries `driverId` (and the embedded driver record) so a driver
 * login resolves to its DRIVER row rather than relying on a coincidental id match.
 */

const STORAGE_KEY = 'fms.auth';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  /** True while restoring the persisted session on first mount. */
  initializing: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface LoginResult {
  user: AuthUser;
  token: string;
}

/* ── offline account directory (only used when VITE_USE_MOCK is not "false") ──
   Mirrors the accounts the backend seeds, so sign-in behaves identically in both
   modes. Passwords are overridable on the server via SEED_ADMIN_PASSWORD /
   SEED_DRIVER_PASSWORD. */

const OFFLINE_ACCOUNTS: Array<{ email: string; password: string; user: AuthUser }> = [
  {
    email: 'manager@fleetsme.com',
    password: 'Fleet@2026',
    user: {
      userId: 1,
      name: 'Ifeanyi Agada',
      email: 'manager@fleetsme.com',
      role: 'admin',
      driverId: null,
    },
  },
  {
    email: 'dispatch@fleetsme.com',
    password: 'Fleet@2026',
    user: {
      userId: 2,
      name: 'Ngozi Okonkwo',
      email: 'dispatch@fleetsme.com',
      role: 'admin',
      driverId: null,
    },
  },
  {
    email: 'musa.ibrahim@fleetsme.com',
    password: 'Rider@2026',
    user: {
      userId: 3,
      name: 'Musa Ibrahim',
      email: 'musa.ibrahim@fleetsme.com',
      role: 'driver',
      driverId: 1,
    },
  },
];

async function offlineLogin(email: string, password: string): Promise<LoginResult> {
  await new Promise((resolve) => setTimeout(resolve, 450)); // simulate latency
  const account = OFFLINE_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
  );
  if (!account) {
    throw new Error('Invalid email or password.');
  }
  return { user: account.user, token: `offline.${account.user.role}.${Date.now()}` };
}

/* ── live API ────────────────────────────────────────────────────────────── */

async function apiLogin(email: string, password: string): Promise<LoginResult> {
  return apiClient.post<LoginResult>('/auth/login', {
    email: email.trim().toLowerCase(),
    password,
  });
}

/* ── provider ────────────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  const persist = useCallback((nextUser: AuthUser | null, nextToken: string | null) => {
    setUser(nextUser);
    setToken(nextToken);
    setAuthToken(nextToken);
    if (nextUser && nextToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, token: nextToken }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Restore the persisted session on first mount.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw) as LoginResult;
        setAuthToken(parsed.token);

        if (USE_MOCK) {
          if (!cancelled) persist(parsed.user, parsed.token);
        } else {
          // Re-verify against the API: the token may have expired, and this also
          // refreshes the principal (e.g. a newly linked driver record).
          const fresh = await apiClient.get<AuthUser>('/auth/me');
          if (!cancelled) persist(fresh, parsed.token);
        }
      } catch {
        // Stored session is unusable (expired token, or the API is unreachable).
        setAuthToken(null);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [persist]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const result = USE_MOCK
        ? await offlineLogin(email, password)
        : await apiLogin(email, password);
      persist(result.user, result.token);
      return result.user;
    },
    [persist],
  );

  const logout = useCallback(() => {
    persist(null, null);
  }, [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user && token),
      initializing,
      login,
      logout,
    }),
    [user, token, initializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ── hook ────────────────────────────────────────────────────────────────── */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>.');
  return ctx;
}

/**
 * The DRIVER row id for the signed-in rider, or null.
 * Prefer this over `user.userId` — the two are different keys.
 */
export function useDriverId(): number | null {
  const { user } = useAuth();
  return user?.driverId ?? null;
}
