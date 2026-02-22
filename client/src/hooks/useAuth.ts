import { useState, useCallback } from 'react';
import { AuthUser, AuthResponse } from '../shared/types';

const TOKEN_KEY = 'vanguard-auth-token';
const USER_KEY = 'vanguard-auth-user';

export interface AuthState {
  isLoggedIn: boolean;
  user: AuthUser | null;
  token: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    const user = userRaw ? JSON.parse(userRaw) as AuthUser : null;
    return { isLoggedIn: !!token && !!user, user, token };
  });

  const handleAuthResponse = useCallback((response: AuthResponse): AuthResponse => {
    if (response.success && response.token && response.user) {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setAuthState({ isLoggedIn: true, user: response.user, token: response.token });
    }
    return response;
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuthState({ isLoggedIn: false, user: null, token: null });
  }, []);

  const updateUser = useCallback((user: AuthUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setAuthState(prev => ({ ...prev, user }));
  }, []);

  return { authState, handleAuthResponse, clearAuth, updateUser };
}
