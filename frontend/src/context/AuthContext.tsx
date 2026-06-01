import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getStoredAuth, storeAuth, clearAuth, type AuthResponse } from '../api/auth';

interface AuthContextValue {
  auth: AuthResponse | null;
  login: (auth: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const GUEST_AUTH: AuthResponse = { token: '', username: 'guest', role: 'ADMIN' };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(() => getStoredAuth() ?? GUEST_AUTH);

  const login = useCallback((a: AuthResponse) => {
    storeAuth(a);
    setAuth(a);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setAuth(null);
  }, []);

  // Axios interceptor emits this event when 401/403 is received
  useEffect(() => {
    const handler = () => setAuth(null);
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
