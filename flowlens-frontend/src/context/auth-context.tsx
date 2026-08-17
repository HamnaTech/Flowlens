import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { tokenStorage } from '@/lib/api-client';
import type { PublicUser } from '@/types/api';

interface AuthContextValue {
  user: PublicUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // On first load, if a token already exists (page refresh, returning
  // visitor), fetch the current user rather than assuming they're logged
  // out. If the token is stale, apiClient's own 401 interceptor already
  // handles the refresh-or-redirect — we just need to attempt the call.
  useEffect(() => {
    const hasToken = !!tokenStorage.getAccessToken();
    if (!hasToken) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { user, tokens } = await authApi.login({ email, password });
    tokenStorage.setTokens(tokens);
    setUser(user);
  }

  async function register(email: string, password: string, displayName: string) {
    const { user, tokens } = await authApi.register({ email, password, displayName });
    tokenStorage.setTokens(tokens);
    setUser(user);
  }

  async function logout() {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // Even if the server call fails (e.g. token already expired), we
      // still want to clear local state and send the user to login —
      // a failed logout call should never trap someone in the app.
    }
    tokenStorage.clear();
    setUser(null);
    navigate('/login');
  }

  async function refreshUser() {
    const freshUser = await authApi.me();
    setUser(freshUser);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
