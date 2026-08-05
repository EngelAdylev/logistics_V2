import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
}

function getStoredAuth(): AuthResponse | null {
  try {
    const raw = localStorage.getItem('auth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface AuthContextValue {
  auth: AuthResponse | null;
  login: (auth: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(() => getStoredAuth());

  const login = useCallback((a: AuthResponse) => {
    localStorage.setItem('auth', JSON.stringify(a));
    localStorage.setItem('access_token', a.token);
    setAuth(a);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth');
    localStorage.removeItem('access_token');
    setAuth(null);
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
