import apiClient from './client';

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
}

export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { username, password }).then(r => r.data),
};

export function getStoredAuth(): AuthResponse | null {
  try {
    const raw = localStorage.getItem('auth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeAuth(auth: AuthResponse) {
  localStorage.setItem('auth', JSON.stringify(auth));
  localStorage.setItem('access_token', auth.token);
}

export function clearAuth() {
  localStorage.removeItem('auth');
  localStorage.removeItem('access_token');
}

export function isAdmin(): boolean {
  return getStoredAuth()?.role === 'ADMIN';
}
